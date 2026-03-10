// pages/record-detail/record-detail.js
Page({
  data: {
    recordId: '',
    record: {},
    displayDate: ''
  },

  onLoad(options) {
    const recordId = options.recordId;
    this.setData({
      recordId: recordId
    });
    
    this.loadRecordDetail(recordId);
  },

  // 加载记录详情
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
          record: record,
          displayDate: this.formatDisplayDate(record.date)
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } finally {
      wx.hideLoading();
    }
  },

  // 格式化显示日期
  formatDisplayDate(dateString) {
    if (!dateString) return '';
    // 解析日期字符串，确保使用本地时间
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 因为Date的月份是从0开始的
    const yearNum = date.getFullYear();
    const monthNum = date.getMonth() + 1;
    const dayNum = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];

    return `${yearNum}年${monthNum}月${dayNum}日 周${weekday}`;
  },

  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  },

  // 预览图片
  previewImage(e) {
    const { images, current } = e.currentTarget.dataset;
    wx.previewImage({
      current: images[current],
      urls: images
    });
  },

  // 编辑记录
  editRecord() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?recordId=${this.data.recordId}`
    });
  },

  // 删除记录
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
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
            }
          } catch (error) {
            console.error('删除记录失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
})