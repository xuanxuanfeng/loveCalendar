// pages/day-detail/day-detail.js
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
      displayDate: this.formatDisplayDate(date)
    });
    
    this.loadRecordsForDate(date);
  },

  onShow() {
    // 页面重新显示时刷新数据
    this.loadRecordsForDate(this.data.date);
  },

  // 用户登录后回调
  onUserLogin() {
    this.loadRecordsForDate(this.data.date);
  },

  // 加载指定日期的记录
  async loadRecordsForDate(date) {
    try {
      wx.showLoading({ title: '加载中...' });

      // 等待用户初始化完成
      const app = getApp();
      const openid = await app.waitForUser();
      if (!openid) {
        wx.showToast({
          title: '请先登录',
          icon: 'error'
        });
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'getRecordsByDate',
        data: { date }
      });

      if (result.result.success) {
        const records = (result.result.records || []).map(record => ({
          ...record,
          displayTime: this.formatTime(record.createdAt)
        }));
        this.setData({
          records
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('加载记录失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
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

    return `${monthNum}月${dayNum}日 周${weekday}`;
  },

  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  },

  // 添加记录
  addRecordForDate() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?date=${this.data.date}`
    });
  },

  // 设为纪念日
  setAsAnniversary() {
    wx.navigateTo({
      url: `/pages/add-anniversary/add-anniversary?date=${this.data.date}`
    });
  },

  // 编辑记录
  editRecord(e) {
    const record = e.currentTarget.dataset.record;
    wx.navigateTo({
      url: `/pages/add-record/add-record?recordId=${record._id}`
    });
  },

  // 删除记录
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
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 重新加载数据
              this.loadRecordsForDate(this.data.date);
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

  // 查看记录详情
  viewRecordDetail(e) {
    const record = e.currentTarget.dataset.record;
    wx.navigateTo({
      url: `/pages/record-detail/record-detail?recordId=${record._id}`
    });
  },

  // 预览图片
  previewImage(e) {
    const { images, current } = e.currentTarget.dataset;
    wx.previewImage({
      current: images[current],
      urls: images
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
})