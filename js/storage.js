/**
 * 数据存储管理模块
 * 使用LocalStorage存储比赛数据
 */

const Storage = {
    // 存储键名
    KEYS: {
        PLAYERS: 'majgame_players',
        GAMES: 'majgame_games',
        SCHEDULES: 'majgame_schedules',
        CURRENT_ROUND: 'majgame_current_round',
        CONFIG: 'majgame_config'
    },

    /**
     * 初始化默认数据
     */
    init() {
        if (!this.getPlayers() || this.getPlayers().length === 0) {
            this.initDefaultData();
        }
    },

    /**
     * 初始化默认数据（8位选手）
     */
    initDefaultData() {
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
        this.savePlayers(defaultPlayers);
        this.saveGames([]);
        this.saveSchedules([]);
        this.setCurrentRound(1);
    },

    /**
     * 选手数据操作
     */
    getPlayers() {
        const data = localStorage.getItem(this.KEYS.PLAYERS);
        return data ? JSON.parse(data) : [];
    },

    savePlayers(players) {
        localStorage.setItem(this.KEYS.PLAYERS, JSON.stringify(players));
    },

    getPlayer(playerId) {
        const players = this.getPlayers();
        return players.find(p => p.id === playerId);
    },

    updatePlayer(playerId, updates) {
        const players = this.getPlayers();
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            players[index] = { ...players[index], ...updates };
            this.savePlayers(players);
        }
    },

    /**
     * 比赛数据操作
     */
    getGames() {
        const data = localStorage.getItem(this.KEYS.GAMES);
        return data ? JSON.parse(data) : [];
    },

    saveGames(games) {
        localStorage.setItem(this.KEYS.GAMES, JSON.stringify(games));
    },

    getGame(round) {
        const games = this.getGames();
        return games.find(g => g.round === round);
    },

    saveGame(game) {
        const games = this.getGames();
        const index = games.findIndex(g => g.round === game.round);
        if (index !== -1) {
            games[index] = game;
        } else {
            games.push(game);
        }
        this.saveGames(games);
    },

    /**
     * 时间表数据操作
     */
    getSchedules() {
        const data = localStorage.getItem(this.KEYS.SCHEDULES);
        return data ? JSON.parse(data) : [];
    },

    saveSchedules(schedules) {
        localStorage.setItem(this.KEYS.SCHEDULES, JSON.stringify(schedules));
    },

    getSchedule(playerId) {
        const schedules = this.getSchedules();
        return schedules.find(s => s.playerId === playerId);
    },

    saveSchedule(schedule) {
        const schedules = this.getSchedules();
        const index = schedules.findIndex(s => s.playerId === schedule.playerId);
        if (index !== -1) {
            schedules[index] = schedule;
        } else {
            schedules.push(schedule);
        }
        this.saveSchedules(schedules);
    },

    /**
     * 当前场次
     */
    getCurrentRound() {
        const round = localStorage.getItem(this.KEYS.CURRENT_ROUND);
        return round ? parseInt(round) : 1;
    },

    setCurrentRound(round) {
        localStorage.setItem(this.KEYS.CURRENT_ROUND, round.toString());
    },

    /**
     * 清空所有数据
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initDefaultData();
    },

    /**
     * 导出数据
     */
    exportData() {
        return {
            players: this.getPlayers(),
            games: this.getGames(),
            schedules: this.getSchedules(),
            currentRound: this.getCurrentRound(),
            exportTime: new Date().toISOString()
        };
    },

    /**
     * 导入数据
     */
    importData(data) {
        if (data.players) this.savePlayers(data.players);
        if (data.games) this.saveGames(data.games);
        if (data.schedules) this.saveSchedules(data.schedules);
        if (data.currentRound) this.setCurrentRound(data.currentRound);
    }
};

