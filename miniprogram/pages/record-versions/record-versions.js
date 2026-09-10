const { callCloud } = require('../../utils/cloud')
const { formatDateTime } = require('../../utils/date')

Page({
  data: {
    recordId: '',
    versions: [],
    loading: true,
    activeVersion: null
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
        const versions = (res.versions || []).map(v => ({
          ...v,
          displayTime: formatDateTime(v.editedAt)
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
  },

  viewVersion(e) {
    const version = e.currentTarget.dataset.version
    this.setData({ activeVersion: version })
  },

  closeVersion() {
    this.setData({ activeVersion: null })
  },

  previewVersionImage(e) {
    const { url, urls } = e.currentTarget.dataset
    wx.previewImage({ current: url, urls })
  },

  preventBubble() {}
})
