/**
 * 历史记录页面逻辑
 */

const History = {
    /**
     * 初始化历史记录页面
     */
    async init() {
        try {
            this.showLoading();

            await this.renderHistoryPage();
            this.bindEvents();

            this.hideLoading();
            this.showContent();
        } catch (error) {
            console.error('初始化历史记录页面失败:', error);
            this.hideLoading();
            this.showError('连接服务器失败，请检查网络连接和服务器状态');
        }
    },

    /**
     * 显示加载提示
     */
    showLoading() {
        const loadingEl = document.getElementById('loading-message');
        if (loadingEl) loadingEl.style.display = 'block';
    },

    /**
     * 隐藏加载提示
     */
    hideLoading() {
        const loadingEl = document.getElementById('loading-message');
        if (loadingEl) loadingEl.style.display = 'none';
    },

    /**
     * 显示内容区域
     */
    showContent() {
        const contentEl = document.getElementById('history-content');
        if (contentEl) contentEl.style.display = 'block';
    },

    /**
     * 显示错误信息
     */
    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.querySelector('p').textContent = message;
            errorEl.style.display = 'block';
        }
        Utils.showMessage(message, 'error');
    },

    /**
     * 渲染历史记录页面
     */
    async renderHistoryPage() {
        const games = await Storage.getGames();
        const players = await Storage.getPlayers();

        // 过滤已完成的游戏
        const completedGames = games.filter(game => game.isCompleted);

        if (completedGames.length === 0) {
            this.showNoData();
            return;
        }

        // 渲染筛选器
        this.renderFilters(completedGames, players);

        // 渲染历史记录表格
        this.renderHistoryTable(completedGames, players);
    },

    /**
     * 渲染筛选器
     */
    renderFilters(completedGames, players) {
        // 渲染场次筛选器
        const roundFilter = document.getElementById('round-filter');
        if (roundFilter) {
            roundFilter.innerHTML = '<option value="">全部场次</option>';
            completedGames.forEach(game => {
                const option = document.createElement('option');
                option.value = game.round.toString();
                option.textContent = `第${game.round}场`;
                roundFilter.appendChild(option);
            });
        }

        // 渲染选手筛选器
        const playerFilter = document.getElementById('player-filter');
        if (playerFilter) {
            playerFilter.innerHTML = '<option value="">全部选手</option>';
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id.toString();
                option.textContent = player.name;
                playerFilter.appendChild(option);
            });
        }
    },

    /**
     * 渲染历史记录表格
     */
    renderHistoryTable(games, players) {
        const tbody = document.getElementById('history-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        games.forEach(game => {
            game.tables.forEach(table => {
                const tablePlayers = table.players.map(id => {
                    const player = players.find(p => p.id === id);
                    return player;
                }).filter(p => p); // 过滤掉不存在的选手

                // 按积分降序排序选手
                tablePlayers.sort((a, b) => {
                    const scoreA = table.scores ? (table.scores[a.id] || 0) : 0;
                    const scoreB = table.scores ? (table.scores[b.id] || 0) : 0;
                    return scoreB - scoreA; // 降序排列
                });

                // 为每桌创建4行记录
                tablePlayers.forEach((player, index) => {
                    const row = document.createElement('tr');
                    row.dataset.round = game.round;
                    row.dataset.table = table.tableId;
                    row.dataset.player = player.id;

                    // 第一行：桌次列合并，显示桌次和编辑按钮
                    if (index === 0) {
                        const tableText = `第${game.round}场第${table.tableId}桌`;
                        const tableCell = table.recordUrl ?
                            `<a href="${table.recordUrl}" target="_blank" rel="noopener noreferrer" class="table-link">${tableText}</a>` :
                            tableText;

                        row.innerHTML = `
                            <td rowspan="4" class="table-cell">${tableCell}</td>
                            <td>${player.name}</td>
                            <td>${table.scores ? (table.scores[player.id] || 0).toFixed(1) : '0.0'}</td>
                            <td>${table.ratings ? (table.ratings[player.id] || '') : ''}</td>
                            <td rowspan="4" class="action-cell">
                                <button class="btn-edit" data-round="${game.round}" data-table="${table.tableId}">编辑</button>
                            </td>
                        `;
                    } else {
                        // 其他行：只显示选手信息
                        row.innerHTML = `
                            <td>${player.name}</td>
                            <td>${table.scores ? (table.scores[player.id] || 0).toFixed(1) : '0.0'}</td>
                            <td>${table.ratings ? (table.ratings[player.id] || '') : ''}</td>
                        `;
                    }

                    tbody.appendChild(row);
                });
            });
        });

        this.hideNoData();
    },

    /**
     * 显示无数据提示
     */
    showNoData() {
        const noDataEl = document.getElementById('no-data');
        const tableContainer = document.querySelector('.history-table-container');

        if (noDataEl) noDataEl.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
    },

    /**
     * 隐藏无数据提示
     */
    hideNoData() {
        const noDataEl = document.getElementById('no-data');
        const tableContainer = document.querySelector('.history-table-container');

        if (noDataEl) noDataEl.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 场次筛选
        const roundFilter = document.getElementById('round-filter');
        if (roundFilter) {
            roundFilter.addEventListener('change', () => this.filterHistory());
        }

        // 桌次筛选
        const tableFilter = document.getElementById('table-filter');
        if (tableFilter) {
            tableFilter.addEventListener('change', () => this.filterHistory());
        }

        // 选手筛选
        const playerFilter = document.getElementById('player-filter');
        if (playerFilter) {
            playerFilter.addEventListener('change', () => this.filterHistory());
        }

        // 编辑按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit')) {
                const round = parseInt(e.target.dataset.round);
                const table = parseInt(e.target.dataset.table);
                this.showEditDialog(round, table);
            }
        });

        // 导出历史记录
        const exportBtn = document.getElementById('export-history-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportHistory());
        }

        // 导入历史记录
        const importBtn = document.getElementById('import-history-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importHistory());
        }
    },

    /**
     * 筛选历史记录
     */
    async filterHistory() {
        const roundFilter = document.getElementById('round-filter').value;
        const tableFilter = document.getElementById('table-filter').value;
        const playerFilter = document.getElementById('player-filter').value;

        const rows = document.querySelectorAll('#history-tbody tr');

        // 如果有选手筛选，需要按桌为单位进行筛选
        if (playerFilter) {
            // 按桌分组处理
            const tables = {};
            rows.forEach(row => {
                const round = row.dataset.round;
                const table = row.dataset.table;
                const player = row.dataset.player;
                const tableKey = `${round}-${table}`;

                if (!tables[tableKey]) {
                    tables[tableKey] = { rows: [], hasMatchingPlayer: false };
                }
                tables[tableKey].rows.push(row);

                // 检查这桌是否有匹配的选手
                if (player === playerFilter) {
                    tables[tableKey].hasMatchingPlayer = true;
                }
            });

            // 显示或隐藏整桌的行
            Object.values(tables).forEach(table => {
                const round = table.rows[0].dataset.round;
                const tableId = table.rows[0].dataset.table;

                const roundMatch = !roundFilter || round === roundFilter;
                const tableMatch = !tableFilter || tableId === tableFilter;
                const shouldShow = roundMatch && tableMatch && table.hasMatchingPlayer;

                table.rows.forEach(row => {
                    row.style.display = shouldShow ? '' : 'none';

                    // 移除行的整体高亮样式
                    row.classList.remove('highlighted-player');

                    // 如果该行对应的选手是被筛选的选手，给选手相关单元格添加高亮样式
                    if (shouldShow && row.dataset.player === playerFilter) {
                        // 获取行内的所有单元格
                        const cells = row.querySelectorAll('td');
                        cells.forEach(cell => {
                            // 高亮所有单元格，除了桌次列和操作列
                            if (!cell.classList.contains('table-cell') && !cell.classList.contains('action-cell')) {
                                cell.classList.add('highlighted-player-cell');
                            }
                        });
                    } else {
                        // 移除所有单元格的高亮样式
                        const cells = row.querySelectorAll('td');
                        cells.forEach(cell => {
                            cell.classList.remove('highlighted-player-cell');
                        });
                    }
                });
            });
        } else {
            // 没有选手筛选时，按行进行筛选
            rows.forEach(row => {
                const round = row.dataset.round;
                const table = row.dataset.table;

                const roundMatch = !roundFilter || round === roundFilter;
                const tableMatch = !tableFilter || table === tableFilter;

                row.style.display = (roundMatch && tableMatch) ? '' : 'none';
                // 移除所有高亮样式
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.classList.remove('highlighted-player-cell');
                });
            });
        }
    },

    /**
     * 显示编辑对话框
     */
    async showEditDialog(round, tableId) {
        const game = await Storage.getGame(round);
        const allPlayers = await Storage.getPlayers();

        if (!game || !game.tables) return;

        const table = game.tables.find(t => t.tableId === tableId);
        if (!table) return;

        // 填充编辑信息
        const editInfoText = document.getElementById('edit-info-text');
        editInfoText.textContent = `编辑第${round}场第${tableId}桌的记录`;

        // 填充选手编辑区域
        const playersContainer = document.getElementById('edit-players-container');
        playersContainer.innerHTML = '';

        // 为每桌的4个位置创建编辑项
        for (let i = 0; i < 4; i++) {
            const playerId = table.players[i];
            const currentPlayer = playerId ? allPlayers.find(p => p.id === playerId) : null;

            const playerDiv = document.createElement('div');
            playerDiv.className = 'edit-player-item';

            // 创建选手选择下拉菜单
            let playerSelectOptions = '<option value="">选择选手</option>';
            allPlayers.forEach(player => {
                const selected = currentPlayer && player.id === currentPlayer.id ? 'selected' : '';
                playerSelectOptions += `<option value="${player.id}" ${selected}>${player.name}</option>`;
            });

            playerDiv.innerHTML = `
                <div class="player-info">
                    <span class="position-label">位置 ${i + 1}:</span>
                    ${currentPlayer ? `<span class="current-score">当前积分: ${currentPlayer.totalScore.toFixed(1)}</span>` : ''}
                </div>
                <div class="input-group">
                    <label>选手姓名:</label>
                    <select name="player_${i}" class="player-select">
                        ${playerSelectOptions}
                    </select>
                </div>
                <div class="input-group">
                    <label>积分:</label>
                    <input type="number"
                           name="score_${i}"
                           value="${table.scores && playerId ? (table.scores[playerId] || 0) : 0}"
                           step="0.1"
                           placeholder="-5.5">
                </div>
                <div class="input-group">
                    <label>评分:</label>
                    <input type="text"
                           name="rating_${i}"
                           value="${table.ratings && playerId ? (table.ratings[playerId] || '') : ''}"
                           placeholder="可选"
                           maxlength="50">
                </div>
            `;

            playersContainer.appendChild(playerDiv);
        }

        // 填充牌谱网址
        const recordUrlInput = document.getElementById('edit-record-url');
        recordUrlInput.value = table.recordUrl || '';

        // 显示对话框
        const dialog = document.getElementById('edit-dialog');
        dialog.style.display = 'flex';

        // 绑定事件
        document.getElementById('edit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitEdit(round, tableId, dialog);
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            dialog.style.display = 'none';
        });
    },

    /**
     * 提交编辑
     */
    async submitEdit(round, tableId, dialog) {
        const form = document.getElementById('edit-form');
        const formData = new FormData(form);
        const game = await Storage.getGame(round);
        const allPlayers = await Storage.getPlayers();

        if (!game || !game.tables) return;

        const table = game.tables.find(t => t.tableId === tableId);
        if (!table) return;

        // 收集更新数据
        const newPlayers = [];
        const updates = {
            scores: {},
            ratings: {},
            recordUrl: document.getElementById('edit-record-url').value.trim()
        };

        // 处理4个位置的数据
        for (let i = 0; i < 4; i++) {
            const playerIdStr = formData.get(`player_${i}`);
            const scoreStr = formData.get(`score_${i}`);
            const ratingStr = formData.get(`rating_${i}`);

            if (playerIdStr) {
                const playerId = parseInt(playerIdStr);

                // 添加到新的选手列表
                if (!newPlayers.includes(playerId)) {
                    newPlayers.push(playerId);
                }

                // 设置积分
                if (scoreStr) {
                    const scoreValue = parseFloat(scoreStr);
                    if (!isNaN(scoreValue)) {
                        updates.scores[playerId] = scoreValue;
                    }
                }

                // 设置评分
                if (ratingStr !== undefined) {
                    updates.ratings[playerId] = ratingStr.trim();
                }
            }
        }

        // 更新桌数据
        table.players = newPlayers;
        table.scores = updates.scores;
        table.ratings = updates.ratings;
        table.recordUrl = updates.recordUrl;

        // 数据清理：确保只保存可序列化的基本数据类型
        const cleanedGame = this.sanitizeGameData(game);

        // 只保存游戏数据，不修改选手的累积得分
        await Storage.saveGame(cleanedGame);

        dialog.style.display = 'none';
        Utils.showMessage('历史记录已更新', 'success');

        // 重新渲染页面
        await this.renderHistoryPage();

        // 自动刷新网页
        setTimeout(() => {
            window.location.reload();
        }, 1000); // 1秒后刷新，给用户一点时间看到成功消息
    },


    /**
     * 清理游戏数据，确保只包含可序列化的基本数据类型
     */
    sanitizeGameData(game) {
        if (!game) return game;

        // 深拷贝游戏对象，避免修改原始对象
        const cleanedGame = JSON.parse(JSON.stringify(game));

        // 确保基本字段存在且为正确类型
        cleanedGame.round = parseInt(cleanedGame.round) || 0;
        cleanedGame.isCompleted = Boolean(cleanedGame.isCompleted);
        cleanedGame.createTime = cleanedGame.createTime || new Date().toISOString();

        // 清理桌数据
        if (cleanedGame.tables && Array.isArray(cleanedGame.tables)) {
            cleanedGame.tables = cleanedGame.tables.map(table => {
                const cleanedTable = {
                    tableId: parseInt(table.tableId) || 0,
                    players: Array.isArray(table.players) ? table.players.map(id => parseInt(id)) : [],
                    scores: {},
                    ratings: {},
                    recordUrl: String(table.recordUrl || '')
                };

                // 清理积分数据
                if (table.scores && typeof table.scores === 'object') {
                    Object.keys(table.scores).forEach(playerId => {
                        const score = parseFloat(table.scores[playerId]);
                        if (!isNaN(score)) {
                            cleanedTable.scores[playerId] = score;
                        }
                    });
                }

                // 清理评分数据
                if (table.ratings && typeof table.ratings === 'object') {
                    Object.keys(table.ratings).forEach(playerId => {
                        cleanedTable.ratings[playerId] = String(table.ratings[playerId] || '');
                    });
                }

                return cleanedTable;
            });
        } else {
            cleanedGame.tables = [];
        }

        return cleanedGame;
    },

    /**
     * 导出历史记录
     */
    async exportHistory() {
        try {
            const games = await Storage.getGames();
            const players = await Storage.getPlayers();

            const completedGames = games.filter(game => game.isCompleted);

            if (completedGames.length === 0) {
                Utils.showMessage('暂无历史记录可导出', 'info');
                return;
            }

            const historyData = completedGames.map(game => ({
                round: game.round,
                tables: game.tables.map(table => ({
                    tableId: table.tableId,
                    players: table.players.map(playerId => {
                        const player = players.find(p => p.id === playerId);
                        return {
                            id: playerId,
                            name: player ? player.name : '未知选手',
                            score: table.scores ? (table.scores[playerId] || 0) : 0,
                            rating: table.ratings ? (table.ratings[playerId] || '') : ''
                        };
                    }),
                    recordUrl: table.recordUrl || ''
                }))
            }));

            const dataStr = JSON.stringify(historyData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `majgame_history_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            Utils.showMessage('历史记录已导出', 'success');
        } catch (error) {
            Utils.showMessage('导出历史记录失败', 'error');
        }
    },

    /**
     * 导入历史记录
     */
    async importHistory() {
        const fileInput = document.getElementById('import-file-input');
        if (!fileInput) {
            Utils.showMessage('导入功能不可用', 'error');
            return;
        }

        // 触发文件选择对话框
        fileInput.click();

        // 监听文件选择事件
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // 读取文件内容
                const text = await this.readFileAsText(file);

                // 解析JSON数据
                const importData = JSON.parse(text);

                // 判断数据格式并相应处理
                if (this.isFullSystemData(importData)) {
                    // 完整系统数据格式，直接使用服务器导入API
                    await this.importFullSystemData(importData);
                } else if (this.isHistoryData(importData)) {
                    // 历史记录格式，在前端处理
                    if (!this.validateImportData(importData)) {
                        return;
                    }

                    // 显示确认对话框
                    const confirmMessage = `即将导入 ${importData.length} 场历史记录，现有数据将被覆盖。是否继续？`;
                    if (!confirm(confirmMessage)) {
                        return;
                    }

                    // 导入数据到存储系统
                    await this.processImportData(importData);

                    Utils.showMessage('历史记录导入成功', 'success');
                } else {
                    Utils.showMessage('导入文件格式不正确，请选择有效的历史记录导出文件', 'error');
                    return;
                }

                // 重新渲染页面
                await this.renderHistoryPage();

                // 自动刷新网页
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (error) {
                console.error('导入历史记录失败:', error);
                Utils.showMessage('导入历史记录失败：' + error.message, 'error');
            } finally {
                // 清空文件输入，以便下次可以选择相同文件
                fileInput.value = '';
            }
        }, { once: true }); // 只监听一次，避免重复绑定
    },

    /**
     * 判断是否为完整系统数据格式
     */
    isFullSystemData(data) {
        return data &&
               typeof data === 'object' &&
               (data.players || data.games || data.schedules || data.currentRound !== undefined);
    },

    /**
     * 判断是否为历史记录数据格式
     */
    isHistoryData(data) {
        return Array.isArray(data) &&
               data.length > 0 &&
               data[0].round !== undefined &&
               Array.isArray(data[0].tables);
    },

    /**
     * 导入完整系统数据
     */
    async importFullSystemData(data) {
        // 显示确认对话框
        const gamesCount = data.games ? data.games.length : 0;
        const playersCount = data.players ? data.players.length : 0;
        const confirmMessage = `即将导入完整的系统数据（${gamesCount}场游戏，${playersCount}个选手），现有数据将被覆盖。是否继续？`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // 使用服务器的导入API
        await Storage.importData(data);
        Utils.showMessage('系统数据导入成功', 'success');
    },

    /**
     * 读取文件内容为文本
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    },

    /**
     * 验证导入的数据格式
     */
    validateImportData(data) {
        if (!Array.isArray(data)) {
            Utils.showMessage('导入数据格式错误：应为数组格式', 'error');
            return false;
        }

        if (data.length === 0) {
            Utils.showMessage('导入数据为空', 'error');
            return false;
        }

        // 验证每场游戏的数据结构
        for (let i = 0; i < data.length; i++) {
            const game = data[i];

            if (!game.round || typeof game.round !== 'number') {
                Utils.showMessage(`第${i + 1}场数据错误：缺少有效的场次信息`, 'error');
                return false;
            }

            if (!Array.isArray(game.tables)) {
                Utils.showMessage(`第${game.round}场数据错误：桌数据应为数组格式`, 'error');
                return false;
            }

            // 验证每桌的数据结构
            for (let j = 0; j < game.tables.length; j++) {
                const table = game.tables[j];

                if (!table.tableId || typeof table.tableId !== 'number') {
                    Utils.showMessage(`第${game.round}场第${j + 1}桌数据错误：缺少有效的桌号`, 'error');
                    return false;
                }

                if (!Array.isArray(table.players)) {
                    Utils.showMessage(`第${game.round}场第${table.tableId}桌数据错误：选手数据应为数组格式`, 'error');
                    return false;
                }

                // 验证选手数据结构
                for (let k = 0; k < table.players.length; k++) {
                    const player = table.players[k];

                    if (!player.id || !player.name) {
                        Utils.showMessage(`第${game.round}场第${table.tableId}桌第${k + 1}个选手数据错误：缺少ID或姓名`, 'error');
                        return false;
                    }

                    if (typeof player.score !== 'number') {
                        Utils.showMessage(`第${game.round}场第${table.tableId}桌选手${player.name}积分数据错误`, 'error');
                        return false;
                    }
                }
            }
        }

        return true;
    },

    /**
     * 处理导入的数据
     */
    async processImportData(importData) {
        try {
            // 获取现有的选手数据，用于匹配导入的选手
            const existingPlayers = await Storage.getPlayers();
            const playerMap = new Map();
            existingPlayers.forEach(player => {
                playerMap.set(player.name, player.id);
            });

            // 处理每场游戏
            for (const gameData of importData) {
                const game = {
                    round: gameData.round,
                    isCompleted: true,
                    createTime: new Date().toISOString(),
                    tables: []
                };

                // 处理每桌
                for (const tableData of gameData.tables) {
                    const table = {
                        tableId: tableData.tableId,
                        players: [],
                        scores: {},
                        ratings: {},
                        recordUrl: tableData.recordUrl || ''
                    };

                    // 处理每桌的选手
                    for (const playerData of tableData.players) {
                        let playerId = playerMap.get(playerData.name);

                        // 如果选手不存在，创建新选手
                        if (!playerId) {
                            const existingPlayers = await Storage.getPlayers();
                            const maxId = existingPlayers.length > 0 ? Math.max(...existingPlayers.map(p => p.id)) : 0;
                            const newPlayer = {
                                id: maxId + 1,
                                name: playerData.name,
                                totalScore: 0,
                                gamesPlayed: 0,
                                createTime: new Date().toISOString()
                            };

                            existingPlayers.push(newPlayer);
                            await Storage.savePlayers(existingPlayers);
                            playerId = newPlayer.id;
                            playerMap.set(playerData.name, playerId);
                        }

                        // 添加到桌的选手列表
                        table.players.push(playerId);

                        // 设置积分和评分
                        table.scores[playerId] = playerData.score;
                        if (playerData.rating) {
                            table.ratings[playerId] = playerData.rating;
                        }
                    }

                    game.tables.push(table);
                }

                // 保存游戏数据
                await Storage.saveGame(game);
            }

        } catch (error) {
            console.error('处理导入数据失败:', error);
            throw new Error('数据导入处理失败');
        }
    }
};

// 页面加载完成后初始化
(function() {
    async function initialize() {
        try {
            await History.init();
        } catch (error) {
            console.error('历史记录页面初始化失败:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
