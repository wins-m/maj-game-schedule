/**
 * 比赛管理模块
 */

const Game = {
    /**
     * 根据积分排名进行分桌（蛇形分组）
     * @param {Array} players - 选手数组（已按积分排序）
     * @param {number} playersPerTable - 每桌人数，默认4
     * @param {number} tables - 桌数，默认2
     */
    arrangeTables(players, playersPerTable = 4, tables = 2) {
        // 确保选手按积分降序排序
        const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
        
        const tableArrangement = [];
        
        // 蛇形分组算法
        for (let tableIndex = 0; tableIndex < tables; tableIndex++) {
            const tablePlayers = [];
            
            // 第一轮：按顺序分配
            // 第二轮：反向分配
            for (let round = 0; round < playersPerTable; round++) {
                let playerIndex;
                if (round % 2 === 0) {
                    // 正向：tableIndex, tableIndex + tables, ...
                    playerIndex = tableIndex + round * tables;
                } else {
                    // 反向：从后往前
                    const reverseIndex = tables - 1 - tableIndex;
                    playerIndex = reverseIndex + round * tables;
                }
                
                if (playerIndex < sortedPlayers.length) {
                    tablePlayers.push(sortedPlayers[playerIndex].id);
                }
            }
            
            tableArrangement.push({
                tableId: tableIndex + 1,
                players: tablePlayers,
                commonTimes: []
            });
        }
        
        return tableArrangement;
    },

    /**
     * 随机分组
     * @param {Array} players - 选手数组
     * @param {number} playersPerTable - 每桌人数，默认4
     * @param {number} tables - 桌数，默认2
     */
    arrangeTablesRandom(players, playersPerTable = 4, tables = 2) {
        // 打乱选手顺序
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
        
        const tableArrangement = [];
        
        for (let tableIndex = 0; tableIndex < tables; tableIndex++) {
            const tablePlayers = [];
            
            for (let i = 0; i < playersPerTable; i++) {
                const playerIndex = tableIndex * playersPerTable + i;
                if (playerIndex < shuffledPlayers.length) {
                    tablePlayers.push(shuffledPlayers[playerIndex].id);
                }
            }
            
            tableArrangement.push({
                tableId: tableIndex + 1,
                players: tablePlayers,
                commonTimes: []
            });
        }
        
        return tableArrangement;
    },

    /**
     * 按积分分组（积分相同时随机）
     * 积分高的4人一组，只有并列的人才随机分配
     * @param {Array} players - 选手数组
     * @param {number} playersPerTable - 每桌人数，默认4
     * @param {number} tables - 桌数，默认2
     */
    arrangeTablesByScore(players, playersPerTable = 4, tables = 2) {
        // 按积分分组，积分相同的随机排序
        const groupedByScore = {};
        players.forEach(player => {
            const score = player.totalScore;
            if (!groupedByScore[score]) {
                groupedByScore[score] = [];
            }
            groupedByScore[score].push(player);
        });
        
        // 对每个积分组内的选手随机排序（只有并列的人才随机分配）
        Object.keys(groupedByScore).forEach(score => {
            groupedByScore[score].sort(() => Math.random() - 0.5);
        });
        
        // 按积分降序排列，然后展平
        const sortedPlayers = Object.keys(groupedByScore)
            .sort((a, b) => parseFloat(b) - parseFloat(a))
            .flatMap(score => groupedByScore[score]);
        
        const tableArrangement = [];
        
        // 直接分组：前4名一桌，后4名一桌（积分高的4人一组）
        for (let tableIndex = 0; tableIndex < tables; tableIndex++) {
            const tablePlayers = [];
            const startIndex = tableIndex * playersPerTable;
            
            for (let i = 0; i < playersPerTable; i++) {
                const playerIndex = startIndex + i;
                if (playerIndex < sortedPlayers.length) {
                    tablePlayers.push(sortedPlayers[playerIndex].id);
                }
            }
            
            tableArrangement.push({
                tableId: tableIndex + 1,
                players: tablePlayers,
                commonTimes: []
            });
        }
        
        return tableArrangement;
    },

    /**
     * 创建新的比赛场次
     * @param {number} round - 场次编号
     * @param {string} method - 分组方法：'score'（按积分）, 'random'（随机）, 默认按积分
     */
    async createGame(round, method = 'score') {
        const players = await Storage.getPlayers();
        let tables;
        
        if (method === 'random') {
            tables = this.arrangeTablesRandom(players);
        } else if (method === 'score') {
            tables = this.arrangeTablesByScore(players);
        } else {
            tables = this.arrangeTables(players);
        }
        
        const game = {
            round: round,
            tables: tables,
            isCompleted: false,
            createdAt: new Date().toISOString()
        };

        // 为向后兼容，初始化新字段的默认值
        game.tables.forEach(table => {
            if (!table.scores) table.scores = {};
            if (!table.ratings) table.ratings = {};
            if (!table.recordUrl) table.recordUrl = '';
        });
        
        await Storage.saveGame(game);
        return game;
    },

    /**
     * 重新分组当前场次
     * @param {string} method - 分组方法：'score'（按积分）, 'random'（随机）
     */
    async regroupCurrentGame(method = 'random') {
        const game = await this.getCurrentGame();
        if (!game || game.isCompleted) {
            Utils.showMessage('当前场次已完成或不存在', 'error');
            return false;
        }
        
        const players = await Storage.getPlayers();
        let tables;
        
        if (method === 'random') {
            tables = this.arrangeTablesRandom(players);
        } else if (method === 'score') {
            tables = this.arrangeTablesByScore(players);
        } else {
            tables = this.arrangeTables(players);
        }
        
        game.tables = tables;

        // 为新分组的桌子初始化新字段的默认值
        game.tables.forEach(table => {
            if (!table.scores) table.scores = {};
            if (!table.ratings) table.ratings = {};
            if (!table.recordUrl) table.recordUrl = '';
        });

        await Storage.saveGame(game);
        
        Utils.showMessage(`已${method === 'random' ? '随机' : '按积分'}重新分组`, 'success');
        return true;
    },

    /**
     * 完成当前场次并录入积分
     * @param {Object} scores - 积分对象 { playerId: score }
     * @param {Object} options - 选项对象
     * @param {Object} options.ratings - 评分对象 { tableId: { playerId: rating } }
     * @param {Object} options.recordUrls - 牌谱网址对象 { tableId: url }
     * @param {boolean} options.advanceRound - 是否进入下一场次，默认true
     */
    async completeRound(scores, options = {}) {
        const { ratings = {}, recordUrls = {}, advanceRound = true } = options;
        const currentRound = await Storage.getCurrentRound();
        const game = await Storage.getGame(currentRound);

        if (!game) {
            Utils.showMessage('当前场次不存在', 'error');
            return false;
        }

        // 更新选手积分
        const players = await Storage.getPlayers();
        players.forEach(player => {
            const score = scores[player.id] || 0;
            player.scores.push(score);
            player.totalScore += score;
            // 只有进入下一场次时才重置时间表填写状态
            if (advanceRound) {
                player.hasFilledSchedule = false;
            }
        });
        await Storage.savePlayers(players);

        // 更新桌级别的评分和牌谱网址
        game.tables.forEach(table => {
            table.scores = {};
            table.ratings = {};
            table.recordUrl = recordUrls[table.tableId] || '';

            // 为该桌的每个玩家设置积分和评分
            table.players.forEach(playerId => {
                table.scores[playerId] = scores[playerId] || 0;
                table.ratings[playerId] = (ratings[table.tableId] && ratings[table.tableId][playerId]) || '';
            });
        });

        // 只有进入下一场次时才标记当前场次为已完成
        if (advanceRound) {
            game.isCompleted = true;
        }

        // 保存更新后的游戏数据
        await Storage.saveGame(game);

        if (advanceRound) {
            // 创建下一场次
            const nextRound = currentRound + 1;
            if (nextRound <= 6) { // 默认6场
                await Storage.setCurrentRound(nextRound);
                await this.createGame(nextRound);
                Utils.showMessage(`第${currentRound}场已完成，已生成第${nextRound}场分桌`, 'success');
            } else {
                Utils.showMessage('所有比赛场次已完成！', 'success');
            }
        } else {
            Utils.showMessage(`第${currentRound}场积分已录入，场次保持不变`, 'success');
        }
        
        return true;
    },

    /**
     * 获取当前场次
     */
    async getCurrentGame() {
        const currentRound = await Storage.getCurrentRound();
        const game = await Storage.getGame(currentRound);
        return game ? this.migrateGameData(game) : null;
    },

    /**
     * 计算一桌的共同空闲时间
     * @param {Array} playerIds - 选手ID数组
     */
    async calculateCommonTimes(playerIds) {
        const schedules = await Storage.getSchedules();
        const playerSchedules = playerIds.map(id => 
            schedules.find(s => s.playerId === id)
        ).filter(s => s); // 过滤掉未填表的选手
        
        // 如果不足4人都填表，返回空数组
        if (playerSchedules.length < 4) {
            return [];
        }
        
        // 获取所有选手的空闲时间
        const allTimes = playerSchedules.map(s => 
            new Set(s.availableTimes || [])
        );
        
        // 找出交集（4人都有空的时间）
        let commonTimes = Array.from(allTimes[0]);
        
        for (let i = 1; i < allTimes.length; i++) {
            commonTimes = commonTimes.filter(time => 
                allTimes[i].has(time)
            );
        }
        
        // 转换为可读格式并排序
        const future7Days = Utils.getNextDays(7);
        return commonTimes.map(timeKey => {
            const { dateStr, period } = Utils.parseTimeKey(timeKey);
            const dayInfo = future7Days.find(d => d.dateStr === dateStr);
            return {
                timeKey,
                dateStr,
                period,
                dayName: dayInfo?.weekday || '',
                periodName: Utils.getPeriodName(period),
                display: dateStr ? `${dateStr} ${Utils.getPeriodName(period)}` : timeKey
            };
        }).sort((a, b) => {
            if (a.dateStr !== b.dateStr) {
                return a.dateStr.localeCompare(b.dateStr);
            }
            const periodOrder = { morning: 1, afternoon: 2, evening: 3 };
            return periodOrder[a.period] - periodOrder[b.period];
        });
    },

    /**
     * 更新所有桌的共同空闲时间
     */
    async updateAllCommonTimes() {
        const game = await this.getCurrentGame();
        if (!game) return;

        for (const table of game.tables) {
            table.commonTimes = await this.calculateCommonTimes(table.players);
        }

        await Storage.saveGame(game);
    },

    /**
     * 迁移旧游戏数据，确保向后兼容
     * 为没有新字段的旧数据添加默认值
     */
    migrateGameData(game) {
        if (!game || !game.tables) return game;

        game.tables.forEach(table => {
            // 初始化积分对象
            if (!table.scores) {
                table.scores = {};
                // 如果有玩家但没有积分记录，为每个玩家设置默认积分0
                if (table.players && table.players.length > 0) {
                    table.players.forEach(playerId => {
                        table.scores[playerId] = 0;
                    });
                }
            }

            // 初始化评分对象
            if (!table.ratings) {
                table.ratings = {};
                // 如果有玩家但没有评分记录，为每个玩家设置默认空字符串
                if (table.players && table.players.length > 0) {
                    table.players.forEach(playerId => {
                        table.ratings[playerId] = '';
                    });
                }
            }

            // 初始化牌谱网址
            if (!table.recordUrl) {
                table.recordUrl = '';
            }
        });

        return game;
    }
};

