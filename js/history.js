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

        // 渲染场次筛选器
        this.renderRoundFilter(completedGames);

        // 渲染历史记录表格
        this.renderHistoryTable(completedGames, players);
    },

    /**
     * 渲染场次筛选器
     */
    renderRoundFilter(completedGames) {
        const roundFilter = document.getElementById('round-filter');
        if (!roundFilter) return;

        // 清空现有选项（保留"全部场次"）
        roundFilter.innerHTML = '<option value="">全部场次</option>';

        // 添加场次选项
        completedGames.forEach(game => {
            const option = document.createElement('option');
            option.value = game.round.toString();
            option.textContent = `第${game.round}场`;
            roundFilter.appendChild(option);
        });
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
                // 为每桌的每个玩家创建一行记录
                table.players.forEach(playerId => {
                    const player = players.find(p => p.id === playerId);
                    if (!player) return;

                    const row = document.createElement('tr');
                    row.dataset.round = game.round;
                    row.dataset.table = table.tableId;
                    row.dataset.player = playerId;

                    row.innerHTML = `
                        <td>第${game.round}场</td>
                        <td>第${table.tableId}桌</td>
                        <td>${player.name}</td>
                        <td>${table.scores ? (table.scores[playerId] || 0).toFixed(1) : '0.0'}</td>
                        <td>${table.ratings ? (table.ratings[playerId] || '') : ''}</td>
                        <td>
                            ${table.recordUrl ?
                                `<a href="${table.recordUrl}" target="_blank" rel="noopener noreferrer">${table.recordUrl}</a>` :
                                ''
                            }
                        </td>
                        <td>
                            <button class="btn-edit" data-round="${game.round}" data-table="${table.tableId}">编辑</button>
                        </td>
                    `;

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

        const rows = document.querySelectorAll('#history-tbody tr');

        rows.forEach(row => {
            const round = row.dataset.round;
            const table = row.dataset.table;

            const roundMatch = !roundFilter || round === roundFilter;
            const tableMatch = !tableFilter || table === tableFilter;

            row.style.display = (roundMatch && tableMatch) ? '' : 'none';
        });
    },

    /**
     * 显示编辑对话框
     */
    async showEditDialog(round, tableId) {
        const game = await Storage.getGame(round);
        const players = await Storage.getPlayers();

        if (!game || !game.tables) return;

        const table = game.tables.find(t => t.tableId === tableId);
        if (!table) return;

        // 填充编辑信息
        const editInfoText = document.getElementById('edit-info-text');
        editInfoText.textContent = `编辑第${round}场第${tableId}桌的记录`;

        // 填充选手编辑区域
        const playersContainer = document.getElementById('edit-players-container');
        playersContainer.innerHTML = '';

        table.players.forEach(playerId => {
            const player = players.find(p => p.id === playerId);
            if (!player) return;

            const playerDiv = document.createElement('div');
            playerDiv.className = 'edit-player-item';
            playerDiv.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                    <span class="current-score">当前积分: ${player.totalScore.toFixed(1)}</span>
                </div>
                <div class="input-group">
                    <label>积分:</label>
                    <input type="number"
                           name="score_${playerId}"
                           value="${table.scores ? (table.scores[playerId] || 0) : 0}"
                           step="0.1"
                           placeholder="-5.5">
                </div>
                <div class="input-group">
                    <label>评分:</label>
                    <input type="text"
                           name="rating_${playerId}"
                           value="${table.ratings ? (table.ratings[playerId] || '') : ''}"
                           placeholder="可选"
                           maxlength="50">
                </div>
            `;

            playersContainer.appendChild(playerDiv);
        });

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
        const players = await Storage.getPlayers();

        if (!game || !game.tables) return;

        const table = game.tables.find(t => t.tableId === tableId);
        if (!table) return;

        // 收集更新数据
        const updates = {
            scores: {},
            ratings: {},
            recordUrl: document.getElementById('edit-record-url').value.trim()
        };

        formData.forEach((value, key) => {
            if (key.startsWith('score_')) {
                const playerId = parseInt(key.replace('score_', ''));
                const scoreValue = parseFloat(value);
                if (!isNaN(scoreValue)) {
                    updates.scores[playerId] = scoreValue;
                }
            } else if (key.startsWith('rating_')) {
                const playerId = parseInt(key.replace('rating_', ''));
                updates.ratings[playerId] = value.trim();
            }
        });

        // 更新桌数据
        table.scores = updates.scores;
        table.ratings = updates.ratings;
        table.recordUrl = updates.recordUrl;

        // 重新计算所有选手的总积分
        const allGames = await Storage.getGames();

        // 为所有受影响的选手重新计算总积分
        table.players.forEach(playerId => {
            const player = players.find(p => p.id === playerId);
            if (!player) return;

            let totalScore = 0;
            allGames.forEach(g => {
                if (g.isCompleted && g.tables) {
                    g.tables.forEach(t => {
                        if (t.scores && t.scores[playerId] !== undefined) {
                            totalScore += t.scores[playerId];
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
