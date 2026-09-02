// pages/anniversaries/anniversaries.js
const { calculateCountdown, getAllCountdowns } = require('../../utils/countdown')

Page({
  data: {
    anniversaries: []
  },

  onLoad() {
    this.loadAnniversaries();
  },

  onShow() {
    this.loadAnniversaries();
  },

  onUserLogin() {
    this.loadAnniversaries();
  },

  // 加载纪念日列表
  async loadAnniversaries() {
    try {
      wx.showLoading({ title: '加载中...' });

      const app = getApp();
      const openid = await app.waitForUser();
      if (!openid) {
        wx.showToast({ title: '请先登录', icon: 'error' });
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'getAllAnniversaries',
        data: {}
      });

      if (result.result.success) {
        const anniversariesWithInfo = result.result.anniversaries.map(anniversary => ({
          ...anniversary,
          countdownText: calculateCountdown(anniversary),
          allCountdowns: getAllCountdowns(anniversary)
        }));

        this.setData({ anniversaries: anniversariesWithInfo });
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' });
      }
    } catch (error) {
      console.error('加载纪念日失败:', error);
      wx.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  addAnniversary() {
    wx.navigateTo({ url: '/pages/add-anniversary/add-anniversary' });
  },

  editAnniversary(e) {
    const anniversary = e.currentTarget.dataset.anniversary;
    const countdownDaysStr = anniversary.countdownDays ? encodeURIComponent(JSON.stringify(anniversary.countdownDays)) : '';
    const url = `/pages/add-anniversary/add-anniversary?anniversaryId=${anniversary._id}&name=${encodeURIComponent(anniversary.name)}&date=${anniversary.date.split('T')[0]}&isCountdown=${anniversary.isCountdownMode || false}&countdownDays=${countdownDaysStr}`;
    wx.navigateTo({ url });
  },

  async deleteAnniversary(e) {
    const anniversaryId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个纪念日吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });

            const result = await wx.cloud.callFunction({
              name: 'deleteAnniversary',
              data: { anniversaryId }
            });

            if (result.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadAnniversaries();
            } else {
              wx.showToast({ title: '删除失败', icon: 'error' });
            }
          } catch (error) {
            console.error('删除纪念日失败:', error);
            wx.showToast({ title: '删除失败', icon: 'error' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
})
