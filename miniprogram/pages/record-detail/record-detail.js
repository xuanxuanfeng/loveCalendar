// pages/record-detail/record-detail.js
const { formatDisplayDateFull } = require('../../utils/date')

Page({
  data: {
    recordId: '',
    record: {},
    displayDate: ''
  },

  onLoad(options) {
    const recordId = options.recordId;
    this.setData({ recordId });
    this.loadRecordDetail(recordId);
  },

  async loadRecordDetail(recordId) {
    try {
      wx.showLoading({ title: '加载中...' });

      const result = await wx.cloud.callFunction({
        name: 'getRecordById',
        data: { recordId }
      });

      if (result.result.success) {
        const record = result.result.record;
        this.setData({
          record,
          displayDate: formatDisplayDateFull(record.date)
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      wx.hideLoading();
    }
  },

  previewImage(e) {
    const { images, current } = e.currentTarget.dataset;
    wx.previewImage({
      current: images[current],
      urls: images
    });
  },

  editRecord() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?recordId=${this.data.recordId}`
    });
  },

  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });

            const result = await wx.cloud.callFunction({
              name: 'deleteRecord',
              data: { recordId: this.data.recordId }
            });

            if (result.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
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

  goBack() {
    wx.navigateBack();
  }
})