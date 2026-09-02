const { callCloud } = require('../../utils/cloud')
const { getTodayStr } = require('../../utils/date')

const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '小吃' }
]

Page({
  data: {
    date: '',
    mealType: 'dinner',
    mealTypes: MEAL_TYPES,
    selectedCandidates: [],
    submitting: false
  },

  onLoad(options) {
    this.setData({ date: getTodayStr() })
    if (options.candidates) {
      try {
        const candidates = JSON.parse(decodeURIComponent(options.candidates))
        this.setData({ selectedCandidates: candidates })
      } catch (e) {
        console.error('解析候选菜品失败:', e)
      }
    }
  },

  onShow() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage.options && currentPage.options.refreshCandidates) {
      try {
        const eventChannel = this.getOpenerEventChannel()
        if (eventChannel) {
          eventChannel.on('selectedDishes', (data) => {
            this.setData({ selectedCandidates: data })
          })
        }
      } catch (e) {}
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  selectMealType(e) {
    this.setData({ mealType: e.currentTarget.dataset.value })
  },

  removeCandidate(e) {
    const idx = e.currentTarget.dataset.index
    const candidates = [...this.data.selectedCandidates]
    candidates.splice(idx, 1)
    this.setData({ selectedCandidates: candidates })
  },

  goPickDishes() {
    wx.navigateTo({ url: '/pages/dish-list/dish-list?pickMode=1' })
  },

  async submitMenu() {
    const { date, mealType, selectedCandidates } = this.data
    if (selectedCandidates.length < 2) {
      wx.showToast({ title: '至少选择2个候选菜品', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      wx.showLoading({ title: '创建中...' })
      const res = await callCloud('createMenu', {
        date,
        mealType,
        candidates: selectedCandidates.map(c => ({
          dishId: c.dishId,
          dishName: c.dishName,
          imageUrl: c.imageUrl || null
        }))
      })
      wx.hideLoading()
      this.setData({ submitting: false })

      if (res.success) {
        wx.showToast({ title: '菜单已发起', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      } else {
        wx.showToast({ title: res.error || '创建失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ submitting: false })
      wx.showToast({ title: '创建失败', icon: 'none' })
    }
  }
})
