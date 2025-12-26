/**
 * 主应用逻辑
 */

const App = {
    /**
     * 初始化应用
     */
    async init() {
        try {
            // 显示加载提示
            this.showLoading();
            
            await Storage.init();
            await this.renderMainPage();
            this.bindEvents();
            
            // 隐藏加载提示，显示内容
            this.hideLoading();
            this.showContent();
        } catch (error) {
            console.error('初始化失败:', error);
            this.hideLoading();
            this.showError('连接服务器失败，请检查网络连接和服务器状态');
        }
    },

    /**
     * 显示加载提示
     */
    showLoading() {
        const loadingEl = document.getElementById('loading-message');
        const errorEl = document.getElementById('error-message');
        if (loadingEl) loadingEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
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
        const roundInfo = document.getElementById('round-info');
        const regroupActions = document.querySelector('.regroup-actions');
        const tablesContainer = document.getElementById('tables-container');
        
        if (roundInfo) roundInfo.style.display = 'block';
        if (regroupActions) regroupActions.style.display = 'flex';
        if (tablesContainer) tablesContainer.style.display = 'grid';
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
     * 渲染主页面
     */
    async renderMainPage() {
        try {
            const game = await Game.getCurrentGame();
            const players = await Storage.getPlayers();
            const currentRound = await Storage.getCurrentRound();
            
            if (!game) {
                // 如果没有当前场次，创建第一场
                await Game.createGame(1);
                await this.renderMainPage();
                return;
            }
            
            // 渲染分桌表
            this.renderTables(game, players);
            
            // 渲染场次信息
            this.renderRoundInfo(currentRound, game.isCompleted);
            
            // 更新共同空闲时间
            await Game.updateAllCommonTimes();
        } catch (error) {
            console.error('渲染主页面失败:', error);
            Utils.showMessage('加载数据失败', 'error');
        }
    },

    /**
     * 渲染场次信息
     */
    renderRoundInfo(round, isCompleted) {
        const roundInfoEl = document.getElementById('round-info');
        if (roundInfoEl) {
            roundInfoEl.innerHTML = `
                <h2>第 ${round} 场积分赛 ${isCompleted ? '(已完成)' : ''}</h2>
                <p>共6场，当前进行到第${round}场</p>
            `;
        }
    },

    /**
     * 渲染分桌表
     */
    renderTables(game, players) {
        const tablesContainer = document.getElementById('tables-container');
        if (!tablesContainer) return;
        
        let html = '';
        
        game.tables.forEach(table => {
            const tablePlayers = table.players.map(id => {
                const player = players.find(p => p.id === id);
                return player;
            });
            
            // 检查是否4人都填表
            const allFilled = tablePlayers.every(p => p.hasFilledSchedule);
            
            html += `
                <div class="table-card">
                    <h3>第 ${table.tableId} 桌</h3>
                    <div class="players-list">
                        ${tablePlayers.map(player => `
                            <div class="player-item ${player.hasFilledSchedule ? 'filled' : ''}">
                                <div class="player-name-group">
                                    <a href="player-schedule.html?playerId=${player.id}" class="player-name">
                                        ${player.name}
                                    </a>
                                    <button class="btn-rename" data-player-id="${player.id}" title="重命名">
                                        ✏️
                                    </button>
                                </div>
                                <span class="player-score">积分: ${Utils.displayScore(player.totalScore)}</span>
                                <span class="fill-status ${player.hasFilledSchedule ? 'filled' : 'unfilled'}">
                                    ${player.hasFilledSchedule ? '✓ 已填表' : '○ 未填表'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    ${allFilled && table.commonTimes.length > 0 ? `
                        <div class="common-times">
                            <h4>共同空闲时间：</h4>
                            <ul>
                                ${table.commonTimes.map(time => `
                                    <li>${time.display}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : allFilled ? `
                        <div class="common-times no-times">
                            <p>暂无共同空闲时间</p>
                        </div>
                    ` : `
                        <div class="common-times waiting">
                            <p>等待所有选手填写时间表</p>
                        </div>
                    `}
                </div>
            `;
        });
        
        tablesContainer.innerHTML = html;
        
        // 绑定重命名按钮事件
        document.querySelectorAll('.btn-rename').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playerId = parseInt(btn.dataset.playerId);
                this.showRenameDialog(playerId);
            });
        });
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 积分录入按钮
        const scoreBtn = document.getElementById('enter-scores-btn');
        if (scoreBtn) {
            scoreBtn.addEventListener('click', async () => {
                await this.showScoreDialog();
            });
        }
        
        // 重置比赛按钮
        const resetBtn = document.getElementById('reset-game-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                await this.resetGame();
            });
        }
        
        // 导出数据按钮
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                await this.exportData();
            });
        }
        
        // 导入数据按钮
        const importBtn = document.getElementById('import-data-btn');
        if (importBtn) {
            importBtn.addEventListener('change', async (e) => {
                await this.importData(e);
            });
        }
        
        // 随机重新分组按钮
        const regroupRandomBtn = document.getElementById('regroup-random-btn');
        if (regroupRandomBtn) {
            regroupRandomBtn.addEventListener('click', async () => {
                await this.regroupGame('random');
            });
        }
        
        // 按积分重新分组按钮
        const regroupScoreBtn = document.getElementById('regroup-score-btn');
        if (regroupScoreBtn) {
            regroupScoreBtn.addEventListener('click', async () => {
                await this.regroupGame('score');
            });
        }
    },

    /**
     * 显示积分录入对话框
     */
    async showScoreDialog() {
        const game = await Game.getCurrentGame();
        if (!game || game.isCompleted) {
            Utils.showMessage('当前场次已完成或不存在', 'error');
            return;
        }

        const players = await Storage.getPlayers();
        const currentRound = await Storage.getCurrentRound();

        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content score-dialog">
                <h3>录入第 ${currentRound} 场积分</h3>
                <form id="score-form">
                    ${game.tables.map(table => {
                        const tablePlayers = table.players.map(id => {
                            const player = players.find(p => p.id === id);
                            return player;
                        });

                        return `
                            <div class="table-score-section">
                                <h4>第 ${table.tableId} 桌</h4>
                                <div class="table-players">
                                    ${tablePlayers.map(player => `
                                        <div class="player-score-input">
                                            <div class="player-info">
                                                <span class="player-name">${player.name}</span>
                                                <span class="current-score">当前积分: ${Utils.displayScore(player.totalScore)}</span>
                                            </div>
                                            <div class="input-group">
                                                <label>积分:</label>
                                                <input type="number"
                                                       name="score_${table.tableId}_${player.id}"
                                                       value="${table.scores ? (table.scores[player.id] || 0) : 0}"
                                                       step="0.1"
                                                       placeholder="-5.5"
                                                       required>
                                            </div>
                                            <div class="input-group">
                                                <label>评分:</label>
                                                <input type="text"
                                                       name="rating_${table.tableId}_${player.id}"
                                                       value="${table.ratings ? (table.ratings[player.id] || '') : ''}"
                                                       placeholder="可选"
                                                       maxlength="50">
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="record-url-input">
                                    <label>牌谱网址:</label>
                                    <input type="url"
                                           name="record_url_${table.tableId}"
                                           value="${table.recordUrl || ''}"
                                           placeholder="https://..."
                                           maxlength="500">
                                </div>
                            </div>
                        `;
                    }).join('')}
                    <div class="score-input-group advance-round">
                        <label>
                            <input type="checkbox" name="advance_round" checked>
                            录入后进入下一场次（不勾选则保持当前场次）
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">保存</button>
                        <button type="button" class="btn btn-secondary" id="cancel-score-btn">取消</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        // 绑定事件
        document.getElementById('score-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitScores(dialog);
        });

        document.getElementById('cancel-score-btn').addEventListener('click', () => {
            dialog.remove();
        });
    },

    /**
     * 提交积分
     */
    async submitScores(dialog) {
        const form = document.getElementById('score-form');
        const formData = new FormData(form);
        const scores = {};
        const ratings = {};
        const recordUrls = {};
        let advanceRound = false;
        let hasValidationError = false;

        formData.forEach((value, key) => {
            if (hasValidationError) return;

            if (key === 'advance_round') {
                advanceRound = value === 'on';
            } else if (key.startsWith('score_')) {
                // 处理积分: score_{tableId}_{playerId}
                const [, tableIdStr, playerIdStr] = key.split('_');
                const tableId = parseInt(tableIdStr);
                const playerId = parseInt(playerIdStr);
                const scoreValue = parseFloat(value);

                // 验证积分格式
                if (isNaN(scoreValue)) {
                    Utils.showMessage(`第${tableId}桌选手ID ${playerId} 的分数格式不正确`, 'error');
                    hasValidationError = true;
                    return;
                }

                // 检查小数位数（最多1位小数）
                if (value.includes('.') && value.split('.')[1].length > 1) {
                    Utils.showMessage(`第${tableId}桌选手ID ${playerId} 的分数最多只能有1位小数`, 'error');
                    hasValidationError = true;
                    return;
                }

                scores[playerId] = scoreValue;
            } else if (key.startsWith('rating_')) {
                // 处理评分: rating_{tableId}_{playerId}
                const [, tableIdStr, playerIdStr] = key.split('_');
                const tableId = parseInt(tableIdStr);
                const playerId = parseInt(playerIdStr);

                if (!ratings[tableId]) ratings[tableId] = {};
                ratings[tableId][playerId] = value.trim();
            } else if (key.startsWith('record_url_')) {
                // 处理牌谱网址: record_url_{tableId}
                const [, tableIdStr] = key.split('_');
                const tableId = parseInt(tableIdStr);

                // 验证URL格式（如果有值的话）
                if (value.trim() && !this.isValidUrl(value.trim())) {
                    Utils.showMessage(`第${tableId}桌的牌谱网址格式不正确`, 'error');
                    hasValidationError = true;
                    return;
                }

                recordUrls[tableId] = value.trim();
            }
        });

        if (hasValidationError) {
            return;
        }

        const options = {
            ratings,
            recordUrls,
            advanceRound
        };

        if (await Game.completeRound(scores, options)) {
            dialog.remove();
            await this.renderMainPage();
        }
    },

    /**
     * 重置比赛
     */
    async resetGame() {
        if (Utils.confirm('确定要重置所有比赛数据吗？此操作不可恢复！')) {
            await Storage.clearAll();
            Utils.showMessage('比赛数据已重置', 'success');
            await this.renderMainPage();
        }
    },

    /**
     * 导出数据
     */
    async exportData() {
        try {
            const data = await Storage.exportData();
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `majgame_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Utils.showMessage('数据已导出', 'success');
        } catch (error) {
            Utils.showMessage('导出数据失败', 'error');
        }
    },

    /**
     * 导入数据
     */
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (await Storage.importData(data)) {
                    Utils.showMessage('数据已导入', 'success');
                    await this.renderMainPage();
                } else {
                    Utils.showMessage('导入失败', 'error');
                }
            } catch (error) {
                Utils.showMessage('导入失败：文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // 重置input
    },

    /**
     * 重新分组
     */
    async regroupGame(method) {
        const game = await Game.getCurrentGame();
        if (!game || game.isCompleted) {
            Utils.showMessage('当前场次已完成或不存在', 'error');
            return;
        }
        
        const confirmMsg = method === 'random' 
            ? '确定要随机重新分组吗？当前分桌将被替换。'
            : '确定要按积分重新分组吗？当前分桌将被替换。';
        
        if (Utils.confirm(confirmMsg)) {
            if (await Game.regroupCurrentGame(method)) {
                await this.renderMainPage();
            }
        }
    },

    /**
     * 验证URL格式
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    /**
     * 显示重命名对话框
     */
    async showRenameDialog(playerId) {
        const player = await Storage.getPlayer(playerId);
        if (!player) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>重命名选手</h3>
                <form id="rename-form">
                    <div class="score-input-group">
                        <label>选手姓名</label>
                        <input type="text" 
                               name="player_name" 
                               value="${player.name}" 
                               required
                               maxlength="20">
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">保存</button>
                        <button type="button" class="btn btn-secondary" id="cancel-rename-btn">取消</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 绑定事件
        document.getElementById('rename-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newName = formData.get('player_name').trim();
            
            if (newName && newName !== player.name) {
                await Storage.updatePlayer(playerId, { name: newName });
                Utils.showMessage('选手名称已更新', 'success');
                dialog.remove();
                await this.renderMainPage();
            } else {
                Utils.showMessage('名称未更改', 'info');
            }
        });
        
        document.getElementById('cancel-rename-btn').addEventListener('click', () => {
            dialog.remove();
        });
        
        // 自动聚焦输入框
        dialog.querySelector('input').focus();
        dialog.querySelector('input').select();
    }
};

// 页面加载完成后初始化
(function() {
    async function initialize() {
        try {
            await App.init();
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();

