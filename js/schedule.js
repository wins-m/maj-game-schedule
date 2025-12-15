/**
 * 时间表管理模块
 */

const Schedule = {
    /**
     * 获取选手的时间表
     * @param {number} playerId - 选手ID
     */
    getPlayerSchedule(playerId) {
        let schedule = Storage.getSchedule(playerId);
        
        if (!schedule) {
            // 创建新的时间表
            schedule = {
                playerId: playerId,
                availableTimes: [],
                updatedAt: new Date().toISOString()
            };
        }
        
        return schedule;
    },

    /**
     * 保存选手的时间表
     * @param {number} playerId - 选手ID
     * @param {Array} availableTimes - 空闲时间数组（时间键数组）
     */
    savePlayerSchedule(playerId, availableTimes) {
        const schedule = {
            playerId: playerId,
            availableTimes: availableTimes,
            updatedAt: new Date().toISOString()
        };
        
        Storage.saveSchedule(schedule);
        
        // 更新选手的填表状态
        Storage.updatePlayer(playerId, { hasFilledSchedule: true });
        
        // 更新共同空闲时间
        Game.updateAllCommonTimes();
        
        Utils.showMessage('时间表已保存', 'success');
    },

    /**
     * 切换时间段的选择状态
     * @param {number} playerId - 选手ID
     * @param {number} day - 天数（1-7）
     * @param {string} period - 时段（morning/afternoon/evening）
     * @param {boolean} autoSave - 是否自动保存，默认false
     */
    toggleTimeSlot(playerId, day, period, autoSave = false) {
        const schedule = this.getPlayerSchedule(playerId);
        const timeKey = Utils.getTimeKey(day, period);
        const index = schedule.availableTimes.indexOf(timeKey);
        
        if (index > -1) {
            // 取消选择
            schedule.availableTimes.splice(index, 1);
        } else {
            // 选择
            schedule.availableTimes.push(timeKey);
        }
        
        // 如果启用自动保存，立即保存
        if (autoSave) {
            this.savePlayerSchedule(playerId, schedule.availableTimes);
        } else {
            // 否则只更新内存中的状态
            Storage.saveSchedule(schedule);
        }
        
        return schedule.availableTimes;
    },

    /**
     * 检查时间段是否被选中
     * @param {number} playerId - 选手ID
     * @param {number} day - 天数
     * @param {string} period - 时段
     */
    isTimeSlotSelected(playerId, day, period) {
        const schedule = this.getPlayerSchedule(playerId);
        const timeKey = Utils.getTimeKey(day, period);
        return schedule.availableTimes.includes(timeKey);
    },

    /**
     * 获取所有已选时间段
     * @param {number} playerId - 选手ID
     */
    getSelectedTimes(playerId) {
        const schedule = this.getPlayerSchedule(playerId);
        return schedule.availableTimes || [];
    }
};

