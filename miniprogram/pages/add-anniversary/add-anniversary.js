// pages/add-anniversary/add-anniversary.js
Page({
  data: {
    anniversaryId: null,
    name: '',
    selectedDate: new Date().toISOString().split('T')[0],
    isCountdownMode: false,
    countdownDaysInput: '',
    countdownDaysList: [],
    isEditing: false,
    isSaving: false
  },

  onLoad(options) {
    if (options.anniversaryId) {
      // 编辑模式 - 从 URL 参数中获取倒数日信息
      let countdownDaysList = [];
      if (options.countdownDays) {
        try {
          // 尝试解析 JSON 数组
          countdownDaysList = JSON.parse(decodeURIComponent(options.countdownDays));
        } catch (e) {
          // 如果是旧格式，尝试解析为单个数字
          const days = parseInt(options.countdownDays);
          if (!isNaN(days)) {
            countdownDaysList = [days];
          }
        }
      }
      
      this.setData({
        anniversaryId: options.anniversaryId,
        name: decodeURIComponent(options.name || ''),
        selectedDate: options.date || new Date().toISOString().split('T')[0],
        isCountdownMode: options.isCountdown === 'true',
        countdownDaysList: countdownDaysList,
        isEditing: true
      });
    } else if (options.date) {
      // 从日期详情页面跳转过来，设置默认日期
      this.setData({
        selectedDate: options.date,
        name: '', // 默认名称为空
        isEditing: false
      });
    } else {
      // 新增模式，使用今天日期
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      this.setData({
        selectedDate: todayStr,
        name: '',
        isEditing: false
      });
    }
  },

  // 纪念日名称输入
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // 日期选择变化
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  // 倒数日模式切换
  onCountdownModeChange(e) {
    this.setData({
      isCountdownMode: e.detail.value
    });
  },

  // 倒数日天数输入
  onCountdownDaysInput(e) {
    this.setData({
      countdownDaysInput: e.detail.value
    });
  },

  // 添加倒数日天数
  addCountdownDay() {
    const days = parseInt(this.data.countdownDaysInput);
    if (!this.data.countdownDaysInput || isNaN(days) || days <= 0) {
      wx.showToast({
        title: '请输入有效的天数',
        icon: 'none'
      });
      return;
    }

    // 检查是否已存在
    if (this.data.countdownDaysList.includes(days)) {
      wx.showToast({
        title: '该天数已存在',
        icon: 'none'
      });
      return;
    }

    // 添加并排序
    const newList = [...this.data.countdownDaysList, days].sort((a, b) => a - b);
    this.setData({
      countdownDaysList: newList,
      countdownDaysInput: ''
    });
  },

  // 快捷添加倒数日天数
  addQuickCountdownDay(e) {
    const days = e.currentTarget.dataset.days;
    
    // 检查是否已存在
    if (this.data.countdownDaysList.includes(days)) {
      wx.showToast({
        title: '该天数已存在',
        icon: 'none'
      });
      return;
    }

    // 添加并排序
    const newList = [...this.data.countdownDaysList, days].sort((a, b) => a - b);
    this.setData({
      countdownDaysList: newList
    });
  },

  // 删除倒数日天数
  removeCountdownDay(e) {
    const index = e.currentTarget.dataset.index;
    const newList = this.data.countdownDaysList.filter((_, i) => i !== index);
    this.setData({
      countdownDaysList: newList
    });
  },

  // 保存纪念日
  async saveAnniversary() {
    if (!this.data.name.trim()) {
      wx.showToast({
        title: '请输入纪念日名称',
        icon: 'none'
      });
      return;
    }

    // 如果是倒数日模式，验证至少有一个天数
    if (this.data.isCountdownMode && this.data.countdownDaysList.length === 0) {
      wx.showToast({
        title: '请至少添加一个倒数日天数',
        icon: 'none'
      });
      return;
    }

    if (this.data.isSaving) {
      return;
    }

    try {
      this.setData({ isSaving: true });

      const result = await wx.cloud.callFunction({
        name: this.data.isEditing ? 'updateAnniversary' : 'createAnniversary',
        data: {
          anniversaryId: this.data.anniversaryId,
          name: this.data.name.trim(),
          date: this.data.selectedDate,
          isCountdownMode: this.data.isCountdownMode,
          countdownDays: this.data.isCountdownMode ? this.data.countdownDaysList : null
        }
      });

      if (result.result.success) {
        wx.showToast({
          title: this.data.isEditing ? '更新成功' : '添加成功',
          icon: 'success'
        });

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: this.data.isEditing ? '更新失败' : '添加失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('保存纪念日失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
})
