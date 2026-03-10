// pages/anniversaries/anniversaries.js
Page({
  data: {
    anniversaries: []
  },

  onLoad() {
    this.loadAnniversaries();
  },

  onShow() {
    // 页面重新显示时刷新数据
    this.loadAnniversaries();
  },

  // 用户登录后回调
  onUserLogin() {
    this.loadAnniversaries();
  },

  // 加载纪念日列表
  async loadAnniversaries() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 确保用户已登录
      const app = getApp();
      if (!app.globalData.openid) {
        console.log('用户未登录，尝试初始化用户');
        await app.initUser();
        if (!app.globalData.openid) {
          wx.showToast({
            title: '请先登录',
            icon: 'error'
          });
          return;
        }
      }

      const result = await wx.cloud.callFunction({
        name: 'getAllAnniversaries',
        data: {}
      });

      if (result.result.success) {
        // 计算每个纪念日的倒计时
        const anniversariesWithCountdown = result.result.anniversaries.map(anniversary => {
          return {
            ...anniversary,
            countdownText: this.calculateCountdown(anniversary.date)
          };
        });

        this.setData({
          anniversaries: anniversariesWithCountdown
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('加载纪念日失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
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

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    // 解析日期字符串，确保使用本地时间
    const [year, month, day] = dateString.split('-').map(Number);
    return `${month}月${day}日`;
  },

  // 添加纪念日
  addAnniversary() {
    wx.navigateTo({
      url: '/pages/add-anniversary/add-anniversary'
    });
  },

  // 编辑纪念日
  editAnniversary(e) {
    const anniversary = e.currentTarget.dataset.anniversary;
    wx.navigateTo({
      url: `/pages/add-anniversary/add-anniversary?anniversaryId=${anniversary._id}&name=${encodeURIComponent(anniversary.name)}&date=${anniversary.date.split('T')[0]}`
    });
  },

  // 删除纪念日
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
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 重新加载数据
              this.loadAnniversaries();
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
            }
          } catch (error) {
            console.error('删除纪念日失败:', error);
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