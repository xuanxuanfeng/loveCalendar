const { callCloud } = require('../../utils/cloud')

const CATEGORIES = ['家常菜', '硬菜', '汤', '主食', '小吃', '饮品']
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
]

Page({
  data: {
    isEdit: false,
    dishId: '',
    name: '',
    category: '家常菜',
    categories: CATEGORIES,
    difficultyOptions: DIFFICULTY_OPTIONS,
    difficultyIndex: 0,
    estimatedTime: '',
    description: '',
    ingredients: '',
    tags: [],
    tagInput: '',
    imageUrl: '',
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, dishId: options.id })
      wx.setNavigationBarTitle({ title: '编辑菜品' })
      this.loadDish(options.id)
    }
  },

  async loadDish(id) {
    try {
      const res = await wx.cloud.database().collection('dishes').doc(id).get()
      if (res.data) {
        const dish = res.data
        const diffIdx = DIFFICULTY_OPTIONS.findIndex(d => d.value === dish.difficulty)
        this.setData({
          name: dish.name,
          category: dish.category,
          difficultyIndex: diffIdx >= 0 ? diffIdx : 0,
          estimatedTime: dish.estimatedTime ? String(dish.estimatedTime) : '',
          description: dish.description || '',
          ingredients: dish.ingredients || '',
          tags: dish.tags || [],
          imageUrl: dish.imageUrl || ''
        })
      }
    } catch (err) {
      console.error('加载菜品失败:', err)
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  selectCategory(e) { this.setData({ category: e.currentTarget.dataset.category }) },
  onDifficultyChange(e) { this.setData({ difficultyIndex: e.detail.value }) },
  onTimeInput(e) { this.setData({ estimatedTime: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },
  onIngredientsInput(e) { this.setData({ ingredients: e.detail.value }) },
  onTagInput(e) { this.setData({ tagInput: e.detail.value }) },

  addTag() {
    const tag = this.data.tagInput.trim()
    if (!tag || this.data.tags.length >= 5) return
    if (this.data.tags.includes(tag)) {
      this.setData({ tagInput: '' })
      return
    }
    this.setData({ tags: [...this.data.tags, tag], tagInput: '' })
  },

  removeTag(e) {
    const idx = e.currentTarget.dataset.index
    const tags = [...this.data.tags]
    tags.splice(idx, 1)
    this.setData({ tags })
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })
      const tempFilePath = res.tempFiles[0].tempFilePath
      wx.showLoading({ title: '上传中...' })
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `dishes/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
        filePath: tempFilePath
      })
      wx.hideLoading()
      this.setData({ imageUrl: uploadRes.fileID })
    } catch (err) {
      wx.hideLoading()
      console.error('上传图片失败:', err)
    }
  },

  removeImage() {
    this.setData({ imageUrl: '' })
  },

  async submitDish() {
    const { name, category, description, ingredients, tags, imageUrl, estimatedTime, isEdit, dishId } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }

    const difficulty = DIFFICULTY_OPTIONS[this.data.difficultyIndex].value
    const params = {
      name: name.trim(),
      category,
      description: description.trim(),
      ingredients: ingredients.trim(),
      tags,
      imageUrl,
      difficulty,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : 0
    }

    this.setData({ submitting: true })
    try {
      wx.showLoading({ title: isEdit ? '保存中...' : '上架中...' })
      const cloudFn = isEdit ? 'updateDish' : 'createDish'
      if (isEdit) params.dishId = dishId

      const res = await callCloud(cloudFn, params)
      wx.hideLoading()
      this.setData({ submitting: false })

      if (res.success) {
        wx.showToast({ title: isEdit ? '已保存' : '上架成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      } else {
        wx.showToast({ title: res.error || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  }
})
