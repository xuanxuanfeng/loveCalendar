// pages/index/index.js
Page({
  data: {
    currentDate: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`,
    recordsMap: {},
    anniversariesMap: {},
    recentAnniversaries: [],
    userInfo: null,
    hasCouple: false
  },

  onLoad() {
    // 初始化页面
    this.loadCalendarData();
    this.checkCoupleStatus();
  },

  onShow() {
    // 页面显示时重新加载数据
    this.loadCalendarData();
    this.checkCoupleStatus();
  },

  // 用户登录后回调
  onUserLogin() {
    this.loadCalendarData();
    this.checkCoupleStatus();
  },

  // 检查情侣状态
  async checkCoupleStatus() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'manageCouple',
        data: {
          action: 'get'
        }
      });

      if (result.result.success) {
        this.setData({
          hasCouple: true
        });
      } else {
        this.setData({
          hasCouple: false
        });
      }
    } catch (error) {
      console.error('检查情侣状态失败:', error);
      this.setData({
        hasCouple: false
      });
    }
  },

  // 加载日历相关数据
  async loadCalendarData() {
    try {
      // 获取用户信息
      const app = getApp();
      const openid = app.globalData.openid;

      if (!openid) {
        console.log('用户未登录，尝试初始化用户');
        // 如果用户未登录，尝试初始化用户
        await app.initUser();
        // 重新获取用户信息
        const newOpenid = app.globalData.openid;
        if (!newOpenid) {
          console.error('用户仍未登录');
          return;
        }
      }

      // 获取日历数据（记录和纪念日）
      const calendarResult = await wx.cloud.callFunction({
        name: 'getCalendarData',
        data: {
          startDate: this.getFirstDayOfMonth(),
          endDate: this.getLastDayOfMonth()
        }
      });

      if (calendarResult.result.success) {
        this.setData({
          recordsMap: calendarResult.result.recordsByDate,
          anniversariesMap: calendarResult.result.anniversariesByDate
        });

        // 更新情侣状态
        if (calendarResult.result.hasCouple !== undefined) {
          this.setData({
            hasCouple: calendarResult.result.hasCouple
          });
        }

        // 加载最近的纪念日
        this.loadRecentAnniversaries();
      } else {
        console.error('获取日历数据失败:', calendarResult.result.error);
      }

    } catch (error) {
      console.error('加载日历数据失败:', error);
    }
  },

  // 获取当月第一天
  getFirstDayOfMonth() {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // 设置时间为当天的开始，避免时区问题
    date.setDate(1);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  },

  // 获取当月最后一天
  getLastDayOfMonth() {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // 设置时间为当天的开始，避免时区问题
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
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

        // 计算每个纪念日的倒计时和显示日期
        const anniversariesWithInfo = anniversaries.map(anniversary => {
          const countdownText = this.calculateCountdown(anniversary.date);
          const displayDate = this.formatDisplayDate(anniversary.date);
          return {
            ...anniversary,
            countdownText,
            displayDate
          };
        });

        // 按倒计时天数排序，获取最近的3个
        const sortedAnniversaries = anniversariesWithInfo.sort((a, b) => {
          // 将倒计时文本转换为数字进行排序
          const getDays = (text) => {
            if (text === '今天') return 0;
            if (text === '还剩1天') return 1;
            const match = text.match(/还剩(\d+)天/);
            return match ? parseInt(match[1]) : Number.MAX_VALUE;
          };
          return getDays(a.countdownText) - getDays(b.countdownText);
        });

        // 取前3个最近的纪念日
        const recentAnniversaries = sortedAnniversaries.slice(0, 3);

        this.setData({
          recentAnniversaries
        });
      }
    } catch (error) {
      console.error('加载最近纪念日失败:', error);
    }
  },

  // 计算倒计时
  calculateCountdown(anniversaryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 解析纪念日日期字符串，确保使用本地时间
    const [year, month, day] = anniversaryDate.split('-').map(Number);
    const anniversary = new Date(year, month - 1, day); // month - 1 因为Date的月份是从0开始的
    anniversary.setHours(0, 0, 0, 0);

    // 设置今年的纪念日
    const thisYearAnniversary = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate());

    let diffTime;
    if (thisYearAnniversary >= today) {
      // 今年还没到
      diffTime = thisYearAnniversary.getTime() - today.getTime();
    } else {
      // 今年已过，计算明年的
      const nextYearAnniversary = new Date(today.getFullYear() + 1, anniversary.getMonth(), anniversary.getDate());
      diffTime = nextYearAnniversary.getTime() - today.getTime();
    }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '还剩1天';
    } else {
      return `还剩${diffDays}天`;
    }
  },

  // 格式化显示日期
  formatDisplayDate(dateString) {
    // 解析日期字符串，确保使用本地时间
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 因为Date的月份是从0开始的
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const monthNum = date.getMonth() + 1;
    const dayNum = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${monthNum}月${dayNum}日`;
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
    // 确保日期格式正确
    const normalizedDate = this.normalizeDate(date);
    this.setData({
      currentDate: normalizedDate
    });

    // 重新加载该月的数据
    this.loadCalendarData();
  },

  // 标准化日期格式
  normalizeDate(dateStr) {
    if (dateStr.includes('T')) {
      // 如果是 ISO 格式，转换为本地日期格式
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    return dateStr;
  },

  // 跳转到纪念日列表页面
  goToAnniversaries() {
    wx.navigateTo({
      url: '/pages/anniversaries/anniversaries'
    });
  },

  // 查看纪念日详情
  viewAnniversaryDetail(e) {
    const anniversary = e.currentTarget.dataset.anniversary;
    // 这里可以跳转到纪念日详情页或者直接跳转到对应的日期
    wx.navigateTo({
      url: `/pages/day-detail/day-detail?date=${anniversary.date}`
    });
  },

  // 跳转到添加记录页面
  goToAddRecord() {
    const today = new Date().toISOString().split('T')[0];
    wx.navigateTo({
      url: `/pages/add-record/add-record?date=${today}`
    });
  },

  // 跳转到情侣绑定页面
  goToCoupleBind() {
    wx.navigateTo({
      url: '/pages/couple-bind/couple-bind'
    });
  }
})