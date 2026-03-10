// components/calendar/calendar.js
Component({
  properties: {
    currentDate: {
      type: String,
      value: new Date().toISOString().split('T')[0]
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
        // 使用本地时间格式化日期
        const dateStr = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}-${prevDate.getDate().toString().padStart(2, '0')}`;
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
        // 使用本地时间格式化日期
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
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
        // 使用本地时间格式化日期
        const dateStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;
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
      // 确保日期格式为 YYYY-MM-DD
      if (dateStr.includes('T')) {
        // 如果是 ISO 格式，转换为本地日期格式
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
      return dateStr;
    },

    isToday(date) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      return date === todayStr;
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
      const newDate = date.toISOString().split('T')[0];
      this.triggerEvent('monthChange', { date: newDate });
    },

    onNextMonth() {
      const date = new Date(this.properties.currentDate);
      date.setMonth(date.getMonth() + 1);
      const newDate = date.toISOString().split('T')[0];
      this.triggerEvent('monthChange', { date: newDate });
    }
  }
})