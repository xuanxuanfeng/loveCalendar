const { callCloud } = require('../../utils/cloud')
const { formatTime } = require('../../utils/date')

Page({
  data: {
    recordId: '',
    versions: [],
    loading: true
  },

  onLoad(options) {
    if (options.recordId) {
      this.setData({ recordId: options.recordId })
      this.loadVersions(options.recordId)
    }
  },

  async loadVersions(recordId) {
    try {
      const res = await callCloud('getRecordVersions', { recordId })
      if (res.success) {
        const versions = (res.data || []).map(v => ({
          ...v,
          displayTime: formatTime(v.createdAt)
        }))
        this.setData({ versions, loading: false })
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载版本历史失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  }
})
