/**
 * 时间表管理模块
 */

const Schedule = {
    /**
     * 获取选手的时间表
     * @param {number} playerId - 选手ID
     */
    async getPlayerSchedule(playerId) {
        let schedule = await Storage.getSchedule(playerId);
        
        if (!schedule) {
            // 创建新的时间表
            schedule = {
                playerId: playerId,
                availableTimes: [],
                updatedAt: new Date().toISOString()
            };
        } else if (schedule.availableTimes && schedule.availableTimes.length > 0) {
            // 迁移旧格式的时间键到新格式（使用实际日期）
            const originalTimes = [...schedule.availableTimes];
            const migrated = Utils.migrateTimeKeys(schedule.availableTimes);
            
            // 更新为迁移后的数据
            schedule.availableTimes = migrated;
            
            // 如果有迁移变化，保存迁移后的数据
            if (JSON.stringify(originalTimes) !== JSON.stringify(migrated)) {
                await Storage.saveSchedule(schedule);
            }
        }
        
        return schedule;
    },

    /**
     * 保存选手的时间表
     * @param {number} playerId - 选手ID
     * @param {Array} availableTimes - 空闲时间数组（时间键数组）
     */
    async savePlayerSchedule(playerId, availableTimes) {
        const schedule = {
            playerId: playerId,
            availableTimes: availableTimes,
            updatedAt: new Date().toISOString()
        };
        
        await Storage.saveSchedule(schedule);
        
        // 更新选手的填表状态：如果时间表为空，则认为未填表
        await Storage.updatePlayer(playerId, { 
            hasFilledSchedule: availableTimes && availableTimes.length > 0 
        });
        
        // 更新共同空闲时间
        await Game.updateAllCommonTimes();
        
        Utils.showMessage('时间表已保存', 'success');
    },

    /**
     * 切换时间段的选择状态
     * @param {number} playerId - 选手ID
     * @param {string|number} dateOrDay - 日期字符串(YYYY-MM-DD)或相对天数(1-7)
     * @param {string} period - 时段（morning/afternoon/evening）
     * @param {boolean} autoSave - 是否自动保存，默认false
     */
    async toggleTimeSlot(playerId, dateOrDay, period, autoSave = false) {
        const schedule = await this.getPlayerSchedule(playerId);
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
            await this.savePlayerSchedule(playerId, schedule.availableTimes);
        } else {
            // 否则只更新内存中的状态（异步保存到服务器）
            await Storage.saveSchedule(schedule);
        }
        
        return schedule.availableTimes;
    },

    /**
     * 检查时间段是否被选中
     * @param {number} playerId - 选手ID
     * @param {string|number} dateOrDay - 日期字符串(YYYY-MM-DD)或相对天数(1-7)
     * @param {string} period - 时段
     */
    async isTimeSlotSelected(playerId, dateOrDay, period) {
        const schedule = await this.getPlayerSchedule(playerId);
        const timeKey = Utils.getTimeKey(dateOrDay, period);
        return schedule.availableTimes.includes(timeKey);
    },

    /**
     * 获取所有已选时间段（针对当前未来7天）
     * @param {number} playerId - 选手ID
     */
    async getSelectedTimes(playerId) {
        const schedule = await this.getPlayerSchedule(playerId);
        const availableTimes = schedule.availableTimes || [];
        const future7Days = Utils.getNextDays(7).map(d => d.dateStr);
        
        // 只返回在未来7天内的已选时间
        return availableTimes.filter(timeKey => {
            const parsed = Utils.parseTimeKey(timeKey);
            return parsed.dateStr && future7Days.includes(parsed.dateStr);
        });
    }
};

