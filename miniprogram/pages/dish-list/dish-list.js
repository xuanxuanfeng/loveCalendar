const { callCloud } = require('../../utils/cloud')

const CATEGORIES = ['家常菜', '硬菜', '汤', '主食', '小吃', '饮品']

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: '',
    keyword: '',
    dishes: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: true,
    hasMore: false,
    pickMode: false,
    selectedDishIds: [],
    selectedDishes: []
  },

  onLoad(options) {
    const pickMode = options.pickMode === '1'
    this.setData({ pickMode })
    if (options.category) {
      this.setData({ activeCategory: options.category })
    }
    this.loadDishes()
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category, dishes: [], page: 1 })
    this.loadDishes()
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
  },

  doSearch() {
    this.setData({ dishes: [], page: 1 })
    this.loadDishes()
  },

  async loadDishes() {
    this.setData({ loading: true })
    try {
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize
      }
      if (this.data.activeCategory) params.category = this.data.activeCategory
      if (this.data.keyword.trim()) params.keyword = this.data.keyword.trim()

      const res = await callCloud('getDishes', params)
      if (res.success) {
        const newDishes = this.data.page === 1 ? res.data : [...this.data.dishes, ...res.data]
        this.setData({
          dishes: newDishes,
          total: res.total,
          hasMore: newDishes.length < res.total,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载菜品失败:', err)
      this.setData({ loading: false })
    }
  },

  loadMore() {
    if (!this.data.hasMore) return
    this.setData({ page: this.data.page + 1 })
    this.loadDishes()
  },

  toggleDishSelect(e) {
    const id = e.currentTarget.dataset.id
    const dish = this.data.dishes.find(d => d._id === id)
    if (!dish) return

    const idx = this.data.selectedDishIds.indexOf(id)
    let selectedDishIds, selectedDishes
    if (idx > -1) {
      selectedDishIds = this.data.selectedDishIds.filter(i => i !== id)
      selectedDishes = this.data.selectedDishes.filter(d => d.dishId !== id)
    } else {
      selectedDishIds = [...this.data.selectedDishIds, id]
      selectedDishes = [...this.data.selectedDishes, {
        dishId: dish._id,
        dishName: dish.name,
        imageUrl: dish.imageUrl || null
      }]
    }
    this.setData({ selectedDishIds, selectedDishes })
  },

  goDetail(e) {
    if (this.data.pickMode) return
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/dish-detail/dish-detail?id=${id}` })
  },

  confirmSelection() {
    if (this.data.selectedDishes.length === 0) {
      wx.showToast({ title: '请至少选择一个菜品', icon: 'none' })
      return
    }
    try {
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel) {
        eventChannel.emit('selectedDishes', this.data.selectedDishes)
      }
    } catch (e) {
      console.error('eventChannel 不可用:', e)
    }
    wx.navigateBack()
  }
})
