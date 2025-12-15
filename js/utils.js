/**
 * 工具函数模块
 */

const Utils = {
    /**
     * 格式化日期
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    },

    /**
     * 获取未来N天的日期数组
     */
    getNextDays(count = 7) {
        const days = [];
        const today = new Date();
        for (let i = 0; i < count; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                day: i + 1,
                date: date,
                dateStr: this.formatDate(date),
                weekday: this.getWeekday(date.getDay())
            });
        }
        return days;
    },

    /**
     * 获取星期几
     */
    getWeekday(dayIndex) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        return weekdays[dayIndex];
    },

    /**
     * 时段名称
     */
    getPeriodName(period) {
        const periods = {
            morning: '早上',
            afternoon: '下午',
            evening: '晚上'
        };
        return periods[period] || period;
    },

    /**
     * 时段列表
     */
    getPeriods() {
        return [
            { key: 'morning', name: '早上' },
            { key: 'afternoon', name: '下午' },
            { key: 'evening', name: '晚上' }
        ];
    },

    /**
     * 生成时间段的唯一标识（使用实际日期）
     * @param {string|number} dateOrDay - 日期字符串(YYYY-MM-DD)或相对天数(1-7)
     * @param {string} period - 时段
     */
    getTimeKey(dateOrDay, period) {
        // 如果是数字（相对天数），转换为实际日期
        if (typeof dateOrDay === 'number') {
            const days = this.getNextDays(7);
            const dayInfo = days.find(d => d.day === dateOrDay);
            if (dayInfo) {
                return `${dayInfo.dateStr}_${period}`;
            }
        }
        // 如果已经是日期字符串，直接使用
        return `${dateOrDay}_${period}`;
    },

    /**
     * 从时间键解析日期和时段
     * @param {string} timeKey - 时间键，格式：YYYY-MM-DD_period 或 day_period（旧格式）
     */
    parseTimeKey(timeKey) {
        const parts = timeKey.split('_');
        if (parts.length >= 2) {
            const firstPart = parts[0];
            const period = parts.slice(1).join('_'); // 处理时段名称中可能包含下划线的情况
            
            // 判断是日期格式还是相对天数格式
            if (/^\d{4}-\d{2}-\d{2}$/.test(firstPart)) {
                // 新格式：日期字符串
                return { dateStr: firstPart, period };
            } else if (/^\d+$/.test(firstPart)) {
                // 旧格式：相对天数，转换为实际日期
                const day = parseInt(firstPart);
                const days = this.getNextDays(7);
                const dayInfo = days.find(d => d.day === day);
                if (dayInfo) {
                    return { dateStr: dayInfo.dateStr, period, day };
                }
            }
        }
        // 兼容旧格式
        return { day: parseInt(parts[0]), period: parts[1] || parts.slice(1).join('_') };
    },

    /**
     * 迁移旧的时间键格式到新格式（相对天数 -> 实际日期）
     * @param {Array} oldTimeKeys - 旧的时间键数组
     * @returns {Array} 新的时间键数组
     */
    migrateTimeKeys(oldTimeKeys) {
        const today = new Date();
        const migrated = [];
        
        oldTimeKeys.forEach(timeKey => {
            const parts = timeKey.split('_');
            if (parts.length >= 2) {
                const firstPart = parts[0];
                const period = parts.slice(1).join('_');
                
                // 如果是旧格式（相对天数）
                if (/^\d+$/.test(firstPart) && parseInt(firstPart) >= 1 && parseInt(firstPart) <= 7) {
                    const day = parseInt(firstPart);
                    const date = new Date(today);
                    date.setDate(today.getDate() + day - 1);
                    const dateStr = this.formatDate(date);
                    migrated.push(`${dateStr}_${period}`);
                } else {
                    // 已经是新格式，保持不变
                    migrated.push(timeKey);
                }
            }
        });
        
        return migrated;
    },

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 显示提示消息
     */
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => messageEl.classList.add('show'), 10);
        
        // 自动移除
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    },

    /**
     * 确认对话框
     */
    confirm(message) {
        return window.confirm(message);
    }
};

