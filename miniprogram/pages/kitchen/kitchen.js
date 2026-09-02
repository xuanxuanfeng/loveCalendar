const { callCloud } = require('../../utils/cloud')
const { getTodayStr } = require('../../utils/date')

const MEAL_TYPE_MAP = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '小吃'
}

Page({
  data: {
    todayMenu: null,
    mealTypeLabel: '',
    selectedDishIds: [],
    myVote: null,
    myVoteNames: '',
    decidedDishName: '',
    myDishes: [],
    myDishCount: 0,
    history: []
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    await Promise.all([
      this.loadTodayMenu(),
      this.loadMyDishes(),
      this.loadHistory()
    ])
  },

  async loadTodayMenu() {
    try {
      const today = getTodayStr()
      const res = await callCloud('getMenu', { date: today })
      if (res.success && res.data) {
        const menu = res.data
        const myVote = (menu.votes || []).find(v => v.voterOpenid === getApp().globalData.openid)
        const selectedDishIds = myVote ? myVote.votes : []
        let decidedDishName = ''
        if (menu.status === 'decided' && menu.decidedDishId) {
          const dish = menu.candidates.find(c => c.dishId === menu.decidedDishId)
          decidedDishName = dish ? dish.dishName : '未知'
        }
        this.setData({
          todayMenu: menu,
          mealTypeLabel: MEAL_TYPE_MAP[menu.mealType] || menu.mealType,
          selectedDishIds,
          myVote,
          myVoteNames: myVote ? myVote.votes.map(vid => {
            const d = menu.candidates.find(c => c.dishId === vid)
            return d ? d.dishName : ''
          }).filter(Boolean).join('、') : '',
          decidedDishName
        })
      } else {
        this.setData({ todayMenu: null })
      }
    } catch (err) {
      console.error('加载今日菜单失败:', err)
    }
  },

  async loadMyDishes() {
    try {
      const res = await callCloud('getDishes', { onlyMine: true, pageSize: 5 })
      if (res.success) {
        this.setData({
          myDishes: res.data || [],
          myDishCount: res.total || 0
        })
      }
    } catch (err) {
      console.error('加载我的菜品失败:', err)
    }
  },

  async loadHistory() {
    try {
      const res = await callCloud('getMenuHistory', { pageSize: 5 })
      if (res.success) {
        this.setData({ history: res.data || [] })
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    }
  },

  toggleCandidate(e) {
    const dishId = e.currentTarget.dataset.dishid
    const menu = this.data.todayMenu
    if (!menu || menu.status !== 'voting') return

    const idx = this.data.selectedDishIds.indexOf(dishId)
    const selected = [...this.data.selectedDishIds]
    if (idx !== -1) {
      selected.splice(idx, 1)
    } else {
      selected.push(dishId)
    }
    this.setData({ selectedDishIds: selected })
  },

  async submitVote() {
    if (this.data.selectedDishIds.length === 0) return
    const menu = this.data.todayMenu
    if (!menu) return

    try {
      wx.showLoading({ title: '提交中...' })
      const res = await callCloud('voteMenu', {
        menuId: menu._id,
        votes: this.data.selectedDishIds
      })
      wx.hideLoading()
      if (res.success) {
        wx.showToast({ title: '选择成功', icon: 'success' })
        this.loadTodayMenu()
      } else {
        wx.showToast({ title: res.error || '提交失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
  },

  goAddDish() {
    wx.navigateTo({ url: '/pages/add-dish/add-dish' })
  },

  goDishList() {
    wx.navigateTo({ url: '/pages/dish-list/dish-list' })
  },

  goCreateMenu() {
    wx.navigateTo({ url: '/pages/menu-create/menu-create' })
  },

  goMenuResult() {
    wx.navigateTo({ url: '/pages/menu-result/menu-result' })
  },

  goDishDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/dish-detail/dish-detail?id=${id}` })
  }
})
