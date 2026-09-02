// pages/index/index.js
const { getTodayStr, formatDisplayDate, getFirstDayOfMonth, getLastDayOfMonth } = require('../../utils/date')
const { calculateCountdown } = require('../../utils/countdown')

Page({
  data: {
    currentDate: getTodayStr(),
    recordsMap: {},
    anniversariesMap: {},
    recentAnniversaries: [],
    userInfo: null,
    hasCouple: false
  },

  onLoad() {
    this.loadCalendarData();
    this.checkCoupleStatus();
  },

  onShow() {
    this.loadCalendarData();
    this.checkCoupleStatus();
  },

  onUserLogin() {
    this.loadCalendarData();
    this.checkCoupleStatus();
  },

  // 检查情侣状态
  async checkCoupleStatus() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'manageCouple',
        data: { action: 'get' }
      });

      this.setData({
        hasCouple: result.result.success
      });
    } catch (error) {
      console.error('检查情侣状态失败:', error);
      this.setData({ hasCouple: false });
    }
  },

  // 加载日历相关数据
  async loadCalendarData() {
    try {
      const app = getApp();
      const openid = await app.waitForUser();
      if (!openid) {
        console.error('用户仍未登录');
        return;
      }

      const [year, month] = this.data.currentDate.split('-').map(Number);

      const calendarResult = await wx.cloud.callFunction({
        name: 'getCalendarData',
        data: {
          startDate: getFirstDayOfMonth(year, month),
          endDate: getLastDayOfMonth(year, month)
        }
      });

      if (calendarResult.result.success) {
        this.setData({
          recordsMap: calendarResult.result.recordsByDate,
          anniversariesMap: calendarResult.result.anniversariesByDate
        });

        if (calendarResult.result.hasCouple !== undefined) {
          this.setData({ hasCouple: calendarResult.result.hasCouple });
        }

        this.loadRecentAnniversaries();
      } else {
        console.error('获取日历数据失败:', calendarResult.result.error);
      }
    } catch (error) {
      console.error('加载日历数据失败:', error);
    }
  },

  // 加载最近的纪念日
  async loadRecentAnniversaries() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getAllAnniversaries',
        data: {}
      });

      if (result.result.success) {
        const anniversaries = result.result.anniversaries || [];

        const anniversariesWithInfo = anniversaries.map(anniversary => ({
          ...anniversary,
          countdownText: calculateCountdown(anniversary),
          displayDate: formatDisplayDate(anniversary.date)
        }));

        const sortedAnniversaries = anniversariesWithInfo.sort((a, b) => {
          const getDays = (text) => {
            if (text === '今天') return 0;
            if (text === '还剩 1 天') return 1;
            const match = text.match(/还剩 (\d+) 天/);
            return match ? parseInt(match[1]) : Number.MAX_VALUE;
          };
          return getDays(a.countdownText) - getDays(b.countdownText);
        });

        this.setData({
          recentAnniversaries: sortedAnniversaries.slice(0, 3)
        });
      }
    } catch (error) {
      console.error('加载最近纪念日失败:', error);
    }
  },

  // 日期点击事件
  onDayClick(e) {
    const { date } = e.detail;
    wx.navigateTo({
      url: `/pages/day-detail/day-detail?date=${date}`
    });
  },

  // 月份变化事件
  onMonthChange(e) {
    const { date } = e.detail;
    const normalizedDate = this.normalizeDate(date);
    this.setData({ currentDate: normalizedDate });
    this.loadCalendarData();
  },

  // 标准化日期格式
  normalizeDate(dateStr) {
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    return dateStr;
  },

  goToAnniversaries() {
    wx.navigateTo({ url: '/pages/anniversaries/anniversaries' });
  },

  viewAnniversaryDetail(e) {
    const anniversary = e.currentTarget.dataset.anniversary;
    wx.navigateTo({
      url: `/pages/day-detail/day-detail?date=${anniversary.date}`
    });
  },

  goToAddRecord() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?date=${getTodayStr()}`
    });
  },

  goToCoupleBind() {
    wx.navigateTo({ url: '/pages/couple-bind/couple-bind' });
  }
})
