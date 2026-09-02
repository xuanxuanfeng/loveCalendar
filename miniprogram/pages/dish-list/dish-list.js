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
    hasMore: false
  },

  onLoad(options) {
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

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/dish-detail/dish-detail?id=${id}` })
  }
})
