// app.js
App({
  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'dev-5gu57acl6acc6a6b',
        traceUser: true,
      });
    }

    // 创建 userReady Promise，供页面等待用户初始化完成
    this.globalData.userReadyPromise = new Promise((resolve) => {
      this.globalData._resolveUserReady = resolve;
    });

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
        this.globalData.userReady = true;

        this.notifyPagesToUpdate();
      } else {
        console.error('用户初始化失败:', result.result.error);
      }
    } catch (error) {
      console.error('调用initUser云函数失败:', error);
    } finally {
      if (this.globalData._resolveUserReady) {
        this.globalData._resolveUserReady(this.globalData.openid);
      }
    }
  },

  // 等待用户初始化完成
  waitForUser() {
    if (this.globalData.userReady) {
      return Promise.resolve(this.globalData.openid);
    }
    return this.globalData.userReadyPromise;
  },

  // 通知所有页面刷新数据
  notifyPagesToUpdate() {
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page && typeof page.onUserLogin === 'function') {
        page.onUserLogin();
      }
    });
  },

  globalData: {
    userInfo: null,
    userId: null,
    isNewUser: null,
    openid: null,
    userReady: false,
    userReadyPromise: null,
    _resolveUserReady: null
  }
});