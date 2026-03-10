// pages/add-anniversary/add-anniversary.js
Page({
  data: {
    anniversaryId: null,
    name: '',
    selectedDate: new Date().toISOString().split('T')[0],
    isEditing: false,
    isSaving: false
  },

  onLoad(options) {
    if (options.anniversaryId) {
      // 编辑模式
      this.setData({
        anniversaryId: options.anniversaryId,
        name: decodeURIComponent(options.name || ''),
        selectedDate: options.date || new Date().toISOString().split('T')[0],
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

  // 保存纪念日
  async saveAnniversary() {
    if (!this.data.name.trim()) {
      wx.showToast({
        title: '请输入纪念日名称',
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
          date: this.data.selectedDate
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
