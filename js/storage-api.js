/**
 * 数据存储管理模块 - API版本
 * 使用服务器端API存储数据，支持多设备同步
 */

const Storage = {
    // API基础URL
    API_BASE_URL: window.location.origin + '/api',

    /**
     * API请求封装
     */
    async apiRequest(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API请求失败 (${response.status}):`, errorText);
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            // 如果是网络错误，提供更友好的提示
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('无法连接到服务器，请检查服务器是否运行在端口1414');
            }
            throw error;
        }
    },

    /**
     * 初始化默认数据
     */
    async init() {
        const players = await this.getPlayers();
        if (!players || players.length === 0) {
            await this.initDefaultData();
        }
    },

    /**
     * 初始化默认数据（8位选手）
     */
    async initDefaultData() {
        const defaultPlayers = [
            { id: 1, name: '选手1', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 2, name: '选手2', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 3, name: '选手3', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 4, name: '选手4', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 5, name: '选手5', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 6, name: '选手6', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 7, name: '选手7', totalScore: 0, scores: [], hasFilledSchedule: false },
            { id: 8, name: '选手8', totalScore: 0, scores: [], hasFilledSchedule: false }
        ];
        await this.savePlayers(defaultPlayers);
        await this.saveGames([]);
        await this.saveSchedules([]);
        await this.setCurrentRound(1);
    },

    /**
     * 选手数据操作
     */
    async getPlayers() {
        try {
            return await this.apiRequest('/players');
        } catch (error) {
            console.error('获取选手数据失败:', error);
            return [];
        }
    },

    async savePlayers(players) {
        try {
            await this.apiRequest('/players', 'POST', players);
            return true;
        } catch (error) {
            console.error('保存选手数据失败:', error);
            Utils.showMessage('保存数据失败，请检查网络连接', 'error');
            return false;
        }
    },

    async getPlayer(playerId) {
        const players = await this.getPlayers();
        return players.find(p => p.id === playerId);
    },

    async updatePlayer(playerId, updates) {
        const players = await this.getPlayers();
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players[index] = { ...players[index], ...updates };
            await this.savePlayers(players);
        }
    },

    /**
     * 比赛数据操作
     */
    async getGames() {
        try {
            return await this.apiRequest('/games');
        } catch (error) {
            console.error('获取比赛数据失败:', error);
            return [];
        }
    },

    async saveGames(games) {
        try {
            await this.apiRequest('/games', 'POST', games);
            return true;
        } catch (error) {
            console.error('保存比赛数据失败:', error);
            return false;
        }
    },

    async getGame(round) {
        const games = await this.getGames();
        return games.find(g => g.round === round);
    },

    async saveGame(game) {
        try {
            // 使用新的单个游戏保存API，避免并发冲突
            await this.apiRequest(`/game/${game.round}`, 'POST', game);
            return true;
        } catch (error) {
            console.error('保存单个游戏失败，回退到批量保存:', error);
            // 如果新API失败，回退到原来的批量保存方式
            const games = await this.getGames();
            const index = games.findIndex(g => g.round === game.round);
            if (index !== -1) {
                games[index] = game;
            } else {
                games.push(game);
            }
            await this.saveGames(games);
            return true;
        }
    },

    /**
     * 时间表数据操作
     */
    async getSchedules() {
        try {
            const schedules = await this.apiRequest('/schedules');
            // 更新缓存
            this._schedulesCache = schedules;
            return schedules;
        } catch (error) {
            console.error('获取时间表数据失败:', error);
            return [];
        }
    },

    async saveSchedules(schedules) {
        try {
            await this.apiRequest('/schedules', 'POST', schedules);
            // 更新缓存
            this._schedulesCache = schedules;
            return true;
        } catch (error) {
            console.error('保存时间表数据失败:', error);
            // 保存失败时清除缓存，确保下次获取最新数据
            this._schedulesCache = null;
            return false;
        }
    },

    async getSchedule(playerId) {
        // 优化：优先使用缓存，避免重复请求
        let schedules = this._schedulesCache;
        if (!schedules) {
            schedules = await this.getSchedules();
        }
        return schedules.find(s => s.playerId === playerId);
    },

    async saveSchedule(schedule) {
        // 优化：如果已经有 schedules 缓存，直接使用，避免重复请求
        // 否则才获取所有时间表
        let schedules = this._schedulesCache;
        if (!schedules) {
            schedules = await this.getSchedules();
        }
        
        const index = schedules.findIndex(s => s.playerId === schedule.playerId);
        if (index !== -1) {
            schedules[index] = schedule;
        } else {
            schedules.push(schedule);
        }
        
        // 更新缓存
        this._schedulesCache = schedules;
        
        await this.saveSchedules(schedules);
    },

    /**
     * 当前场次
     */
    async getCurrentRound() {
        try {
            const result = await this.apiRequest('/current-round');
            return result.round || 1;
        } catch (error) {
            console.error('获取当前场次失败:', error);
            return 1;
        }
    },

    async setCurrentRound(round) {
        try {
            await this.apiRequest('/current-round', 'POST', { round });
            return true;
        } catch (error) {
            console.error('保存当前场次失败:', error);
            return false;
        }
    },

    /**
     * 清空所有数据
     */
    async clearAll() {
        try {
            await this.apiRequest('/reset', 'POST');
            await this.initDefaultData();
            return true;
        } catch (error) {
            console.error('重置数据失败:', error);
            return false;
        }
    },

    /**
     * 导出数据
     */
    async exportData() {
        try {
            return await this.apiRequest('/export');
        } catch (error) {
            console.error('导出数据失败:', error);
            throw error;
        }
    },

    /**
     * 导入数据
     */
    async importData(data) {
        try {
            await this.apiRequest('/import', 'POST', data);
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
};

