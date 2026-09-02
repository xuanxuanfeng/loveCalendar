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
        name: 'getAllAnniversaries',
        data: {}
      });

      if (result.result.success) {
        // 计算每个纪念日的倒计时和所有倒数日信息
        const anniversariesWithInfo = result.result.anniversaries.map(anniversary => {
          return {
            ...anniversary,
            countdownText: this.calculateCountdown(anniversary),
            allCountdowns: this.getAllCountdowns(anniversary)
          };
        });

        this.setData({
          anniversaries: anniversariesWithInfo
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

  // 计算倒计时（支持多个倒数日）
  calculateCountdown(anniversary) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 如果是倒数日模式且有 countdownDays 数组
    if (anniversary.isCountdownMode && anniversary.countdownDays && Array.isArray(anniversary.countdownDays)) {
      // 解析纪念日日期字符串，确保正确解析
      let startDate;
      if (typeof anniversary.date === 'string') {
        const [year, month, day] = anniversary.date.split('-').map(Number);
        startDate = new Date(year, month - 1, day);
      } else {
        startDate = new Date(anniversary.date);
      }
      startDate.setHours(0, 0, 0, 0);

      // 找出所有还未到达的倒数日
      const upcomingCountdowns = [];
      anniversary.countdownDays.forEach(days => {
        const targetDays = parseInt(days); // 确保是数字
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + targetDays);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          upcomingCountdowns.push({
            days: targetDays,
            diffDays: diffDays
          });
        }
      });

      // 如果有即将到来的倒数日，返回最近的一个
      if (upcomingCountdowns.length > 0) {
        upcomingCountdowns.sort((a, b) => a.diffDays - b.diffDays);
        const nearest = upcomingCountdowns[0];
        if (nearest.diffDays === 0) {
          return `今天 (${nearest.days}天)`;
        } else if (nearest.diffDays === 1) {
          return `还剩 1 天 (${nearest.days}天)`;
        } else {
          return `还剩${nearest.diffDays}天 (${nearest.days}天)`;
        }
      } else {
        // 所有倒数日都已过
        return '已过';
      }
    }

    // 普通纪念日模式（每年重复）
    const [year, month, day] = anniversary.date.split('-').map(Number);
    const anniversaryDate = new Date(year, month - 1, day);
    anniversaryDate.setHours(0, 0, 0, 0);

    // 设置今年的纪念日
    const thisYearAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());

    let diffTime;
    if (thisYearAnniversary >= today) {
      // 今年还没到
      diffTime = thisYearAnniversary.getTime() - today.getTime();
    } else {
      // 今年已过，计算明年的
      const nextYearAnniversary = new Date(today.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
      diffTime = nextYearAnniversary.getTime() - today.getTime();
    }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '还剩 1 天';
    } else {
      return `还剩${diffDays}天`;
    }
  },

  // 获取所有倒数日信息（用于显示列表）
  getAllCountdowns(anniversary) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!anniversary.isCountdownMode || !anniversary.countdownDays || !Array.isArray(anniversary.countdownDays)) {
      return [];
    }

    // 解析纪念日日期字符串
    const [year, month, day] = anniversary.date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);

    // 计算每个倒数日的剩余天数
    const countdowns = [];
    anniversary.countdownDays.forEach(days => {
      const targetDays = parseInt(days); // 确保是数字
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + targetDays);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status;
      if (diffDays < 0) {
        status = '已过';
      } else if (diffDays === 0) {
        status = '今天';
      } else if (diffDays === 1) {
        status = '还剩 1 天';
      } else {
        status = `还剩${diffDays}天`;
      }

      countdowns.push({
        days: targetDays,
        status: status,
        isPassed: diffDays < 0
      });
    });

    return countdowns;
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
    // 将 countdownDays 数组转换为 JSON 字符串传递
    const countdownDaysStr = anniversary.countdownDays ? encodeURIComponent(JSON.stringify(anniversary.countdownDays)) : '';
    const url = `/pages/add-anniversary/add-anniversary?anniversaryId=${anniversary._id}&name=${encodeURIComponent(anniversary.name)}&date=${anniversary.date.split('T')[0]}&isCountdown=${anniversary.isCountdownMode || false}&countdownDays=${countdownDaysStr}`;
    wx.navigateTo({
      url
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
