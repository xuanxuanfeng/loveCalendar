const { callCloud } = require('../../utils/cloud')

const DIFFICULTY_MAP = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

Page({
  data: {
    dish: null,
    isOwner: false,
    difficultyLabel: ''
  },

  onLoad(options) {
    if (options.id) {
      this.loadDish(options.id)
    }
  },

  async loadDish(id) {
    try {
      const dishRes = await wx.cloud.database().collection('dishes').doc(id).get()
      if (dishRes.data) {
        const dish = dishRes.data
        const openid = getApp().globalData.openid
        this.setData({
          dish,
          isOwner: dish._openid === openid,
          difficultyLabel: DIFFICULTY_MAP[dish.difficulty] || '简单'
        })
      }
    } catch (err) {
      console.error('加载菜品详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  editDish() {
    wx.navigateTo({ url: `/pages/add-dish/add-dish?id=${this.data.dish._id}` })
  },

  async deleteDish() {
    const that = this
    wx.showModal({
      title: '确认下架',
      content: `确定要下架"${this.data.dish.name}"吗？`,
      async success(res) {
        if (res.confirm) {
          try {
            const result = await callCloud('deleteDish', { dishId: that.data.dish._id })
            if (result.success) {
              wx.showToast({ title: '已下架', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1000)
            } else {
              wx.showToast({ title: result.error || '操作失败', icon: 'none' })
            }
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  }
})
