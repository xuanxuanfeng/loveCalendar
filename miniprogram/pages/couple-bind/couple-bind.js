// pages/couple-bind/couple-bind.js
Page({
  data: {
    myOpenId: '',
    partnerOpenId: '',
    coupleStatus: {
      hasCouple: false,
      partnerNickname: ''
    },
    incomingRequests: [],
    outgoingRequests: [],
    hasRequests: false,
    inviteFromOpenId: ''
  },

  onLoad(options) {
    this.loadMyOpenId();
    this.loadCoupleStatus();
    this.loadRequests();

    if (options.fromOpenId) {
      this.setData({ inviteFromOpenId: options.fromOpenId });
    }
  },

  onShow() {
    this.loadMyOpenId();
    this.loadCoupleStatus();
    this.loadRequests();
  },

  onShareAppMessage() {
    return {
      title: '来和我一起记录美好时光吧！',
      path: `/pages/couple-bind/couple-bind?fromOpenId=${this.data.myOpenId}`,
      imageUrl: '/images/tab/couple-active.png'
    };
  },

  // 加载自己的 OpenID
  async loadMyOpenId() {
    wx.showLoading({ title: '加载中...' });

    try {
      const result = await wx.cloud.callFunction({
        name: 'getOpenId'
      });

      if (result.result) {
        this.setData({
          myOpenId: result.result.openid || ''
        });
      }
    } catch (error) {
      console.error('加载 OpenID 失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 复制 OpenID
  copyOpenId() {
    if (!this.data.myOpenId) {
      wx.showToast({
        title: 'OpenID 为空',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.myOpenId,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // OpenID 输入事件
  onOpenIdInput(e) {
    this.setData({
      partnerOpenId: e.detail.value
    });
  },

  // 加载情侣状态
  async loadCoupleStatus() {
    wx.showLoading({ title: '加载中...' });

    try {
      const result = await wx.cloud.callFunction({
        name: 'manageCouple',
        data: {
          action: 'get'
        }
      });

      if (result.result.success) {
        this.setData({
          coupleStatus: {
            hasCouple: true,
            partnerNickname: result.result.coupleInfo.partnerNickname || '对方'
          }
        });
      } else {
        this.setData({
          coupleStatus: {
            hasCouple: false,
            partnerNickname: ''
          }
        });
      }
    } catch (error) {
      console.error('加载情侣状态失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载请求列表
  async loadRequests() {
    wx.showLoading({ title: '加载中...' });

    try {
      const result = await wx.cloud.callFunction({
        name: 'handleCoupleRequest',
        data: {
          action: 'getRequests'
        }
      });

      if (result.result.success) {
        this.setData({
          incomingRequests: result.result.incomingRequests || [],
          outgoingRequests: result.result.outgoingRequests || [],
          hasRequests: (result.result.incomingRequests || []).length > 0 || (result.result.outgoingRequests || []).length > 0
        });
      }
    } catch (error) {
      console.error('加载请求列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 处理绑定请求
  async handleBind() {
    if (!this.data.partnerOpenId) {
      wx.showToast({
        title: '请输入对方 OpenID',
        icon: 'none'
      });
      return;
    }

    // 验证 OpenID 格式（简单验证长度）
    if (this.data.partnerOpenId.length < 10) {
      wx.showToast({
        title: 'OpenID 格式不正确',
        icon: 'none'
      });
      return;
    }

    // 检查是否输入自己的 OpenID
    if (this.data.partnerOpenId === this.data.myOpenId) {
      wx.showToast({
        title: '不能绑定自己',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '发送请求中...' });

    try {
      // 通过 OpenID 发送绑定请求
      const result = await wx.cloud.callFunction({
        name: 'handleCoupleRequest',
        data: {
          action: 'sendRequest',
          targetOpenid: this.data.partnerOpenId
        }
      });

      if (result.result.success) {
        // 检查是否已经有来自对方的请求（双向奔赴）
        if (result.result.message === 'Couple relationship established') {
          wx.showToast({
            title: '绑定成功！',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '请求发送成功',
            icon: 'success'
          });
        }

        // 清空输入框
        this.setData({
          partnerOpenId: ''
        });

        // 重新加载状态和请求列表
        setTimeout(() => {
          this.loadCoupleStatus();
          this.loadRequests();
        }, 1000);
      } else {
        wx.showToast({
          title: result.result.error || '发送失败',
          icon: 'error',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('发送绑定请求失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 处理接受请求
  async handleAccept(e) {
    const requestId = e.currentTarget.dataset.requestId;

    wx.showModal({
      title: '确认接受',
      content: '确定要接受这个情侣绑定请求吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            const result = await wx.cloud.callFunction({
              name: 'handleCoupleRequest',
              data: {
                action: 'acceptRequest',
                requestId: requestId
              }
            });

            if (result.result.success) {
              wx.showToast({
                title: '接受成功',
                icon: 'success'
              });

              // 重新加载状态
              setTimeout(() => {
                this.loadCoupleStatus();
                this.loadRequests();
              }, 1000);
            } else {
              wx.showToast({
                title: result.result.error || '接受失败',
                icon: 'error'
              });
            }
          } catch (error) {
            console.error('接受请求失败:', error);
            wx.showToast({
              title: '接受失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 处理拒绝请求
  async handleReject(e) {
    const requestId = e.currentTarget.dataset.requestId;

    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个情侣绑定请求吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            const result = await wx.cloud.callFunction({
              name: 'handleCoupleRequest',
              data: {
                action: 'rejectRequest',
                requestId: requestId
              }
            });

            if (result.result.success) {
              wx.showToast({
                title: '拒绝成功',
                icon: 'success'
              });

              // 重新加载请求列表
              setTimeout(() => {
                this.loadRequests();
              }, 1000);
            } else {
              wx.showToast({
                title: result.result.error || '拒绝失败',
                icon: 'error'
              });
            }
          } catch (error) {
            console.error('拒绝请求失败:', error);
            wx.showToast({
              title: '拒绝失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 处理取消请求
  async handleCancel(e) {
    const requestId = e.currentTarget.dataset.requestId;

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个情侣绑定请求吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            const result = await wx.cloud.callFunction({
              name: 'handleCoupleRequest',
              data: {
                action: 'cancelRequest',
                requestId: requestId
              }
            });

            if (result.result.success) {
              wx.showToast({
                title: '取消成功',
                icon: 'success'
              });

              // 重新加载请求列表
              setTimeout(() => {
                this.loadRequests();
              }, 1000);
            } else {
              wx.showToast({
                title: result.result.error || '取消失败',
                icon: 'error'
              });
            }
          } catch (error) {
            console.error('取消请求失败:', error);
            wx.showToast({
              title: '取消失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 处理解除绑定
  async handleUnbind() {
    wx.showModal({
      title: '确认解除',
      content: '确定要解除情侣绑定关系吗？解除后将无法共享数据。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });

          try {
            // 获取当前情侣关系 ID
            const coupleResult = await wx.cloud.callFunction({
              name: 'manageCouple',
              data: {
                action: 'get'
              }
            });

            if (coupleResult.result.success) {
              const result = await wx.cloud.callFunction({
                name: 'manageCouple',
                data: {
                  action: 'delete',
                  coupleId: coupleResult.result.coupleInfo._id
                }
              });

              if (result.result.success) {
                wx.showToast({
                  title: '解除成功',
                  icon: 'success'
                });

                // 重新加载状态
                setTimeout(() => {
                  this.loadCoupleStatus();
                  this.loadRequests();
                }, 1000);
              } else {
                wx.showToast({
                  title: result.result.error || '解除失败',
                  icon: 'error'
                });
              }
            } else {
              wx.showToast({
                title: coupleResult.result.error || '获取关系信息失败',
                icon: 'error'
              });
            }
          } catch (error) {
            console.error('解除绑定失败:', error);
            wx.showToast({
              title: '解除失败',
              icon: 'error'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  async handleInviteAccept() {
    const fromOpenId = this.data.inviteFromOpenId;
    if (!fromOpenId) return;

    wx.showLoading({ title: '处理中...' });

    try {
      const result = await wx.cloud.callFunction({
        name: 'handleCoupleRequest',
        data: {
          action: 'sendRequest',
          targetOpenid: fromOpenId
        }
      });

      if (result.result.success) {
        if (result.result.message === 'Couple relationship established') {
          wx.showToast({ title: '绑定成功！', icon: 'success' });
        } else {
          wx.showToast({ title: '请求已发送', icon: 'success' });
        }
        this.setData({ inviteFromOpenId: '' });
        setTimeout(() => {
          this.loadCoupleStatus();
          this.loadRequests();
        }, 1000);
      } else {
        wx.showToast({ title: result.result.error || '操作失败', icon: 'error' });
      }
    } catch (error) {
      console.error('接受邀请失败:', error);
      wx.showToast({ title: '操作失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  dismissInvite() {
    this.setData({ inviteFromOpenId: '' });
  },

  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN');
  }
});
