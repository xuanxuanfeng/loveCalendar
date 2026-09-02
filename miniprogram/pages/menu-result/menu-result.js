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
    isOwner: false,
    history: []
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    await Promise.all([this.loadTodayMenu(), this.loadHistory()])
  },

  async loadTodayMenu() {
    try {
      const today = getTodayStr()
      const res = await callCloud('getMenu', { date: today })
      if (res.success && res.data) {
        const menu = res.data
        const openid = getApp().globalData.openid
        const isOwner = menu._openid === openid

        const candidates = menu.candidates.map(c => {
          const voteCount = (menu.votes || []).filter(v => v.votes.includes(c.dishId)).length
          return { ...c, voteCount }
        })

        const votes = (menu.votes || []).map(v => ({
          ...v,
          choiceNames: v.votes.map(vid => {
            const d = menu.candidates.find(c => c.dishId === vid)
            return d ? d.dishName : ''
          }).filter(Boolean).join('、')
        }))

        this.setData({
          todayMenu: { ...menu, candidates, votes },
          mealTypeLabel: MEAL_TYPE_MAP[menu.mealType] || menu.mealType,
          isOwner
        })
      }
    } catch (err) {
      console.error('加载今日菜单失败:', err)
    }
  },

  async loadHistory() {
    try {
      const res = await callCloud('getMenuHistory', { pageSize: 10 })
      if (res.success) {
        const history = (res.data || []).map(m => ({
          ...m,
          mealTypeLabel: MEAL_TYPE_MAP[m.mealType] || m.mealType
        }))
        this.setData({ history })
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    }
  },

  async decideDish(e) {
    const dishId = e.currentTarget.dataset.dishid
    const menu = this.data.todayMenu
    if (!menu) return

    const dish = menu.candidates.find(c => c.dishId === dishId)
    const that = this

    wx.showModal({
      title: '确定选择',
      content: `确定今晚吃"${dish ? dish.dishName : ''}"吗？`,
      async success(res) {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '确定中...' })
            const result = await callCloud('decideMenu', { menuId: menu._id, dishId })
            wx.hideLoading()
            if (result.success) {
              wx.showToast({ title: '已确定', icon: 'success' })
              that.loadTodayMenu()
            } else {
              wx.showToast({ title: result.error || '操作失败', icon: 'none' })
            }
          } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  }
})
