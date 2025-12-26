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

                // 为每桌创建4行记录
                tablePlayers.forEach((player, index) => {
                    const row = document.createElement('tr');
                    row.dataset.round = game.round;
                    row.dataset.table = table.tableId;
                    row.dataset.player = player.id;

                    // 第一行：桌次列合并，显示桌次和编辑按钮
                    if (index === 0) {
                        const tableText = `第${game.round}场${table.tableId === 1 ? '哥哥桌' : '弟弟桌'}`;
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

                    // 如果该行对应的选手是被筛选的选手，添加加粗样式
                    if (shouldShow && row.dataset.player === playerFilter) {
                        row.classList.add('highlighted-player');
                    } else {
                        row.classList.remove('highlighted-player');
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
                row.classList.remove('highlighted-player');
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
        editInfoText.textContent = `编辑第${round}场${tableId === 1 ? '哥哥桌' : '弟弟桌'}的记录`;

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

        // 重新计算所有选手的总积分
        const allGames = await Storage.getGames();

        // 为所有选手重新计算总积分
        allPlayers.forEach(player => {
            let totalScore = 0;
            allGames.forEach(g => {
                if (g.isCompleted && g.tables) {
                    g.tables.forEach(t => {
                        if (t.scores && t.scores[player.id] !== undefined) {
                            totalScore += t.scores[player.id];
                        }
                    });
                }
            });

            player.totalScore = totalScore;
        });

        // 保存数据
        await Storage.saveGame(game);
        await Storage.savePlayers(players);

        dialog.style.display = 'none';
        Utils.showMessage('历史记录已更新', 'success');

        // 重新渲染页面
        await this.renderHistoryPage();
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
