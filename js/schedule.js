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
        } else if (schedule.availableTimes && schedule.availableTimes.length > 0) {
            // 迁移旧格式的时间键到新格式（使用实际日期）
            const migrated = Utils.migrateTimeKeys(schedule.availableTimes);
            // 过滤掉已过期的日期（只保留未来7天内的）
            const today = new Date();
            const future7Days = Utils.getNextDays(7).map(d => d.dateStr);
            schedule.availableTimes = migrated.filter(timeKey => {
                const { dateStr } = Utils.parseTimeKey(timeKey);
                return dateStr && future7Days.includes(dateStr);
            });
            
            // 如果有变化，保存迁移后的数据
            if (migrated.length !== schedule.availableTimes.length || 
                JSON.stringify(migrated) !== JSON.stringify(schedule.availableTimes)) {
                Storage.saveSchedule(schedule);
            }
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
     * @param {string|number} dateOrDay - 日期字符串(YYYY-MM-DD)或相对天数(1-7)
     * @param {string} period - 时段（morning/afternoon/evening）
     * @param {boolean} autoSave - 是否自动保存，默认false
     */
    toggleTimeSlot(playerId, dateOrDay, period, autoSave = false) {
        const schedule = this.getPlayerSchedule(playerId);
        const timeKey = Utils.getTimeKey(dateOrDay, period);
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
     * @param {string|number} dateOrDay - 日期字符串(YYYY-MM-DD)或相对天数(1-7)
     * @param {string} period - 时段
     */
    isTimeSlotSelected(playerId, dateOrDay, period) {
        const schedule = this.getPlayerSchedule(playerId);
        const timeKey = Utils.getTimeKey(dateOrDay, period);
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

