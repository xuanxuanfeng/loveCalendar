// pages/day-detail/day-detail.js
const { formatDisplayDateWithWeekday, formatTime } = require('../../utils/date')

Page({
  data: {
    date: '',
    displayDate: '',
    records: []
  },

  onLoad(options) {
    const date = options.date;
    this.setData({
      date: date,
      displayDate: formatDisplayDateWithWeekday(date)
    });

    this.loadRecordsForDate(date);
  },

  onShow() {
    this.loadRecordsForDate(this.data.date);
  },

  onUserLogin() {
    this.loadRecordsForDate(this.data.date);
  },

  async loadRecordsForDate(date) {
    try {
      wx.showLoading({ title: '加载中...' });

      const app = getApp();
      const openid = await app.waitForUser();
      if (!openid) {
        wx.showToast({ title: '请先登录', icon: 'error' });
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'getRecordsByDate',
        data: { date }
      });

      if (result.result.success) {
        const records = (result.result.records || []).map(record => ({
          ...record,
          displayTime: formatTime(record.createdAt)
        }));
        this.setData({ records });
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' });
      }
    } catch (error) {
      console.error('加载记录失败:', error);
      wx.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  addRecordForDate() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?date=${this.data.date}`
    });
  },

  setAsAnniversary() {
    wx.navigateTo({
      url: `/pages/add-anniversary/add-anniversary?date=${this.data.date}`
    });
  },

  editRecord(e) {
    const record = e.currentTarget.dataset.record;
    wx.navigateTo({
      url: `/pages/add-record/add-record?recordId=${record._id}`
    });
  },

  async deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });

            const result = await wx.cloud.callFunction({
              name: 'deleteRecord',
              data: { recordId }
            });

            if (result.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadRecordsForDate(this.data.date);
            } else {
              wx.showToast({ title: '删除失败', icon: 'error' });
            }
          } catch (error) {
            console.error('删除记录失败:', error);
            wx.showToast({ title: '删除失败', icon: 'error' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  viewRecordDetail(e) {
    const record = e.currentTarget.dataset.record;
    wx.navigateTo({
      url: `/pages/record-detail/record-detail?recordId=${record._id}`
    });
  },

  previewImage(e) {
    const { images, current } = e.currentTarget.dataset;
    wx.previewImage({
      current: images[current],
      urls: images
    });
  },

  goBack() {
    wx.navigateBack();
  }
})