// pages/add-record/add-record.js
Page({
  data: {
    selectedDate: new Date().toISOString().split('T')[0],
    content: '',
    images: [], // 本地图片路径
    uploadedImages: [], // 已上传的图片 URL
    isSaving: false,
    recordId: null // 编辑模式下的记录 ID
  },

  onLoad(options) {
    // 获取传递的日期参数
    if (options.date) {
      // 确保日期格式正确
      this.setData({
        selectedDate: options.date
      });
    } else {
      // 如果没有传递日期，默认使用今天
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      this.setData({
        selectedDate: todayStr
      });
    }

    // 检查是否为编辑模式
    if (options.recordId) {
      this.setData({
        recordId: options.recordId
      });
      this.loadRecordDetail(options.recordId);
    }
  },

  // 加载记录详情（编辑模式）
  async loadRecordDetail(recordId) {
    try {
      wx.showLoading({ title: '加载中...' });

      const result = await wx.cloud.callFunction({
        name: 'getRecordById',
        data: { recordId }
      });

      if (result.result.success) {
        const record = result.result.record;
        // 确保日期格式正确
        const dateStr = typeof record.date === 'string' ?
          record.date.split('T')[0] :
          `${record.date.getFullYear()}-${(record.date.getMonth() + 1).toString().padStart(2, '0')}-${record.date.getDate().toString().padStart(2, '0')}`;

        // 处理图片 URL，确保它们是有效的云存储文件 ID
        const processedImages = Array.isArray(record.images) ? record.images.filter(url => url && typeof url === 'string') : [];

        this.setData({
          selectedDate: dateStr,
          content: record.content || '',
          uploadedImages: processedImages
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 日期选择变化
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  // 内容输入
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 选择图片
  async chooseImages() {
    if (this.data.images.length + this.data.uploadedImages.length >= 9) {
      wx.showToast({
        title: '最多只能上传 9 张图片',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await wx.chooseMedia({
        count: 9 - this.data.images.length - this.data.uploadedImages.length,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      });

      const newImages = result.tempFiles.map(file => ({
        url: file.tempFilePath,
        localPath: file.tempFilePath
      }));

      this.setData({
        images: [...this.data.images, ...newImages]
      });
    } catch (error) {
      console.error('选择图片失败:', error);
    }
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;

    // 合并已上传的图片 URL 和新选择的图片 URL
    const allImageUrls = [...this.data.uploadedImages, ...this.data.images.map(img => img.url)];

    wx.previewImage({
      current: allImageUrls[index],
      urls: allImageUrls
    });
  },

  // 删除已上传的图片
  removeUploadedImage(e) {
    const index = e.currentTarget.dataset.index;
    const newUploadedImages = [...this.data.uploadedImages];
    newUploadedImages.splice(index, 1);
    this.setData({
      uploadedImages: newUploadedImages
    });
  },

  // 删除新选择的图片
  removeNewImage(e) {
    const index = e.currentTarget.dataset.index;
    const newImages = [...this.data.images];
    newImages.splice(index, 1);
    this.setData({
      images: newImages
    });
  },

  // 上传图片到云存储
  async uploadImages() {
    const uploadedUrls = [];

    for (let i = 0; i < this.data.images.length; i++) {
      const image = this.data.images[i];
      try {
        wx.showLoading({
          title: `上传图片 ${i + 1}/${this.data.images.length}`,
          mask: true
        });

        // 上传到云存储
        const result = await wx.cloud.uploadFile({
          cloudPath: `records/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
          filePath: image.localPath
        });

        uploadedUrls.push(result.fileID);
      } catch (error) {
        console.error('上传图片失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: `第${i + 1}张图片上传失败`,
          icon: 'error'
        });
        throw error;
      }
    }

    wx.hideLoading();
    return uploadedUrls;
  },

  // 保存记录
  async saveRecord() {
    if (!this.data.content.trim() && this.data.images.length === 0 && this.data.uploadedImages.length === 0) {
      wx.showToast({
        title: '请输入内容或添加图片',
        icon: 'none'
      });
      return;
    }

    if (this.data.isSaving) {
      return;
    }

    try {
      this.setData({ isSaving: true });

      // 上传新选择的图片
      let allImageUrls = [...this.data.uploadedImages];
      if (this.data.images.length > 0) {
        const newImageUrls = await this.uploadImages();
        allImageUrls = [...allImageUrls, ...newImageUrls];
      }

      // 调用云函数保存记录
      const result = await wx.cloud.callFunction({
        name: this.data.recordId ? 'updateRecord' : 'createRecord',
        data: {
          recordId: this.data.recordId,
          date: this.data.selectedDate,
          content: this.data.content.trim(),
          images: allImageUrls
        }
      });

      if (result.result.success) {
        wx.showToast({
          title: this.data.recordId ? '更新成功' : '保存成功',
          icon: 'success'
        });

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: this.data.recordId ? '更新失败' : '保存失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('保存记录失败:', error);
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
