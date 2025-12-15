/**
 * 主应用逻辑
 */

const App = {
    /**
     * 初始化应用
     */
    init() {
        Storage.init();
        this.renderMainPage();
        this.bindEvents();
    },

    /**
     * 渲染主页面
     */
    renderMainPage() {
        const game = Game.getCurrentGame();
        const players = Storage.getPlayers();
        const currentRound = Storage.getCurrentRound();
        
        if (!game) {
            // 如果没有当前场次，创建第一场
            Game.createGame(1);
            this.renderMainPage();
            return;
        }
        
        // 渲染分桌表
        this.renderTables(game, players);
        
        // 渲染场次信息
        this.renderRoundInfo(currentRound, game.isCompleted);
        
        // 更新共同空闲时间
        Game.updateAllCommonTimes();
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
                                <span class="player-score">积分: ${player.totalScore}</span>
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
            scoreBtn.addEventListener('click', () => this.showScoreDialog());
        }
        
        // 重置比赛按钮
        const resetBtn = document.getElementById('reset-game-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }
        
        // 导出数据按钮
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // 导入数据按钮
        const importBtn = document.getElementById('import-data-btn');
        if (importBtn) {
            importBtn.addEventListener('change', (e) => this.importData(e));
        }
        
        // 随机重新分组按钮
        const regroupRandomBtn = document.getElementById('regroup-random-btn');
        if (regroupRandomBtn) {
            regroupRandomBtn.addEventListener('click', () => this.regroupGame('random'));
        }
        
        // 按积分重新分组按钮
        const regroupScoreBtn = document.getElementById('regroup-score-btn');
        if (regroupScoreBtn) {
            regroupScoreBtn.addEventListener('click', () => this.regroupGame('score'));
        }
    },

    /**
     * 显示积分录入对话框
     */
    showScoreDialog() {
        const game = Game.getCurrentGame();
        if (!game || game.isCompleted) {
            Utils.showMessage('当前场次已完成或不存在', 'error');
            return;
        }
        
        const players = Storage.getPlayers();
        const currentRound = Storage.getCurrentRound();
        
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>录入第 ${currentRound} 场积分</h3>
                <form id="score-form">
                    ${players.map(player => `
                        <div class="score-input-group">
                            <label>${player.name}（当前积分：${player.totalScore}）</label>
                            <input type="number" 
                                   name="player_${player.id}" 
                                   value="0" 
                                   min="0" 
                                   step="1"
                                   required>
                        </div>
                    `).join('')}
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">保存</button>
                        <button type="button" class="btn btn-secondary" id="cancel-score-btn">取消</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 绑定事件
        document.getElementById('score-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitScores(dialog);
        });
        
        document.getElementById('cancel-score-btn').addEventListener('click', () => {
            dialog.remove();
        });
    },

    /**
     * 提交积分
     */
    submitScores(dialog) {
        const form = document.getElementById('score-form');
        const formData = new FormData(form);
        const scores = {};
        
        formData.forEach((value, key) => {
            const playerId = parseInt(key.replace('player_', ''));
            scores[playerId] = parseInt(value) || 0;
        });
        
        if (Game.completeRound(scores)) {
            dialog.remove();
            this.renderMainPage();
        }
    },

    /**
     * 重置比赛
     */
    resetGame() {
        if (Utils.confirm('确定要重置所有比赛数据吗？此操作不可恢复！')) {
            Storage.clearAll();
            Utils.showMessage('比赛数据已重置', 'success');
            this.renderMainPage();
        }
    },

    /**
     * 导出数据
     */
    exportData() {
        const data = Storage.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `majgame_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showMessage('数据已导出', 'success');
    },

    /**
     * 导入数据
     */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                Storage.importData(data);
                Utils.showMessage('数据已导入', 'success');
                this.renderMainPage();
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
    regroupGame(method) {
        const game = Game.getCurrentGame();
        if (!game || game.isCompleted) {
            Utils.showMessage('当前场次已完成或不存在', 'error');
            return;
        }
        
        const confirmMsg = method === 'random' 
            ? '确定要随机重新分组吗？当前分桌将被替换。'
            : '确定要按积分重新分组吗？当前分桌将被替换。';
        
        if (Utils.confirm(confirmMsg)) {
            if (Game.regroupCurrentGame(method)) {
                this.renderMainPage();
            }
        }
    },

    /**
     * 显示重命名对话框
     */
    showRenameDialog(playerId) {
        const player = Storage.getPlayer(playerId);
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
        document.getElementById('rename-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newName = formData.get('player_name').trim();
            
            if (newName && newName !== player.name) {
                Storage.updatePlayer(playerId, { name: newName });
                Utils.showMessage('选手名称已更新', 'success');
                dialog.remove();
                this.renderMainPage();
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

