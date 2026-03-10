// app.js
App({
  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'dev-5gu57acl6acc6a6b', // 使用实际的云开发环境 ID
        traceUser: true,
      });
    }

    // 初始化用户
    this.initUser();
  },

  // 初始化用户信息
  async initUser() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'initUser',
        data: {}
      });

      if (result.result.success) {
        this.globalData.userId = result.result.userId || result.result.userInfo._id;
        this.globalData.isNewUser = result.result.isNewUser;
        this.globalData.openid = result.result.openid;

        console.log('用户初始化成功:', result.result);

        // 用户登录成功后，通知所有页面刷新数据
        this.notifyPagesToUpdate();
      } else {
        console.error('用户初始化失败:', result.result.error);
      }
    } catch (error) {
      console.error('调用initUser云函数失败:', error);
    }
  },

  // 通知所有页面刷新数据
  notifyPagesToUpdate() {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page && typeof page.onUserLogin === 'function') {
        page.onUserLogin();
      }
      if (page && typeof page.loadCalendarData === 'function') {
        page.loadCalendarData();
      }
    });

  },

  globalData: {
    userInfo: null,
    userId: null,
    isNewUser: null,
    openid: null
  }
});