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
     * 生成时间段的唯一标识
     */
    getTimeKey(day, period) {
        return `${day}_${period}`;
    },

    /**
     * 从时间键解析天和时段
     */
    parseTimeKey(timeKey) {
        const [day, period] = timeKey.split('_');
        return { day: parseInt(day), period };
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

