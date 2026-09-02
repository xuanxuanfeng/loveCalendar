// components/calendar/calendar.js
const { formatDate, getTodayStr } = require('../../utils/date')

Component({
  properties: {
    currentDate: {
      type: String,
      value: formatDate(new Date())
    },
    recordsMap: {
      type: Object,
      value: {}
    },
    anniversariesMap: {
      type: Object,
      value: {}
    }
  },

  data: {
    calendarDays: [],
    currentMonth: '',
    currentYear: ''
  },

  observers: {
    'currentDate': function(newVal) {
      this.generateCalendar();
    },
    'recordsMap, anniversariesMap': function() {
      this.updateCalendarMarkers();
    }
  },

  lifetimes: {
    attached() {
      this.generateCalendar();
    }
  },

  methods: {
    generateCalendar() {
      const date = new Date(this.properties.currentDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      this.setData({
        currentYear: year,
        currentMonth: this.getMonthName(month)
      });

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      
      const calendarDays = [];
      
      // 添加上个月的日期
      const prevMonthDays = new Date(year, month, 0).getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const prevDate = new Date(year, month - 1, day);
        const dateStr = formatDate(prevDate);
        calendarDays.push({
          date: dateStr,
          day: day,
          isCurrentMonth: false,
          hasRecord: this.hasRecord(dateStr),
          isAnniversary: this.isAnniversary(dateStr),
          isToday: this.isToday(dateStr)
        });
      }
      
      // 添加当前月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        calendarDays.push({
          date: dateStr,
          day: day,
          isCurrentMonth: true,
          hasRecord: this.hasRecord(dateStr),
          isAnniversary: this.isAnniversary(dateStr),
          isToday: this.isToday(dateStr)
        });
      }
      
      // 添加下个月的日期
      const remainingDays = 42 - calendarDays.length; // 6行7列
      for (let day = 1; day <= remainingDays; day++) {
        const nextDate = new Date(year, month + 1, day);
        const dateStr = formatDate(nextDate);
        calendarDays.push({
          date: dateStr,
          day: day,
          isCurrentMonth: false,
          hasRecord: this.hasRecord(dateStr),
          isAnniversary: this.isAnniversary(dateStr),
          isToday: this.isToday(dateStr)
        });
      }
      
      this.setData({ calendarDays });
    },

    updateCalendarMarkers() {
      const updatedDays = this.data.calendarDays.map(day => ({
        ...day,
        hasRecord: this.hasRecord(day.date),
        isAnniversary: this.isAnniversary(day.date)
      }));
      
      this.setData({ calendarDays: updatedDays });
    },

    hasRecord(date) {
      // 确保日期格式一致
      const normalizedDate = this.normalizeDate(date);
      return this.properties.recordsMap[normalizedDate] && this.properties.recordsMap[normalizedDate].length > 0;
    },

    isAnniversary(date) {
      // 确保日期格式一致
      const normalizedDate = this.normalizeDate(date);
      return this.properties.anniversariesMap[normalizedDate] && this.properties.anniversariesMap[normalizedDate].length > 0;
    },

    // 标准化日期格式
    normalizeDate(dateStr) {
      if (dateStr.includes('T')) {
        const date = new Date(dateStr);
        return formatDate(date);
      }
      return dateStr;
    },

    isToday(date) {
      return date === getTodayStr();
    },

    getMonthName(month) {
      const months = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
      ];
      return months[month];
    },

    onDayTap(e) {
      const { date } = e.currentTarget.dataset;
      this.triggerEvent('dayClick', { date });
    },

    onPrevMonth() {
      const date = new Date(this.properties.currentDate);
      date.setMonth(date.getMonth() - 1);
      this.triggerEvent('monthChange', { date: formatDate(date) });
    },

    onNextMonth() {
      const date = new Date(this.properties.currentDate);
      date.setMonth(date.getMonth() + 1);
      this.triggerEvent('monthChange', { date: formatDate(date) });
    }
  }
})