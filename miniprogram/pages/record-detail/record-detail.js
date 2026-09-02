// pages/record-detail/record-detail.js
const { formatDisplayDateFull, formatTime } = require('../../utils/date')

Page({
  data: {
    recordId: '',
    record: {},
    displayDate: '',
    displayTime: '',
    displayLastEditedAt: '',
    lastEditedByName: '',
    comments: [],
    newComment: ''
  },

  onLoad(options) {
    const recordId = options.recordId
    this.setData({ recordId })
    this.loadRecordDetail(recordId)
    this.loadComments(recordId)
  },

  async loadRecordDetail(recordId) {
    try {
      wx.showLoading({ title: '加载中...' })

      const result = await wx.cloud.callFunction({
        name: 'getRecordById',
        data: { recordId }
      })

      if (result.result.success) {
        const record = result.result.record
        this.setData({
          record,
          displayDate: formatDisplayDateFull(record.date),
          displayTime: formatTime(record.createdAt)
        })

        if (record.lastEditedAt && record.editCount > 0) {
          this.setData({
            displayLastEditedAt: formatTime(record.lastEditedAt)
          })
          this.resolveEditorName(record.lastEditedBy)
        }
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } catch (error) {
      console.error('加载记录详情失败:', error)
      wx.showToast({ title: '加载失败', icon: 'error' })
      setTimeout(() => wx.navigateBack(), 1500)
    } finally {
      wx.hideLoading()
    }
  },

  async resolveEditorName(openid) {
    if (!openid) return
    try {
      const userResult = await wx.cloud.callFunction({
        name: 'initUser',
        data: {}
      })
      // 如果编辑者就是当前用户，显示"我"
      if (userResult.result.openid === openid) {
        this.setData({ lastEditedByName: '我' })
        return
      }
      // 否则尝试从情侣信息获取
      const coupleResult = await wx.cloud.callFunction({
        name: 'manageCouple',
        data: { action: 'get' }
      })
      if (coupleResult.result.success) {
        const couple = coupleResult.result.coupleInfo
        const partnerOpenid = couple.user1Openid === openid ? couple.user2Openid : couple.user1Openid
        if (partnerOpenid === openid) {
          this.setData({ lastEditedByName: '对方' })
        }
      }
    } catch (e) {
      console.error('解析编辑者名称失败:', e)
    }
  },

  async loadComments(recordId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getRecordComments',
        data: { recordId: recordId || this.data.recordId }
      })

      if (result.result.success) {
        const comments = result.result.comments.map(c => ({
          ...c,
          displayTime: formatTime(c.createdAt)
        }))
        this.setData({ comments })
      }
    } catch (error) {
      console.error('加载评论失败:', error)
    }
  },

  onCommentInput(e) {
    this.setData({ newComment: e.detail.value })
  },

  async submitComment() {
    const content = this.data.newComment.trim()
    if (!content) return

    try {
      const result = await wx.cloud.callFunction({
        name: 'addRecordComment',
        data: {
          recordId: this.data.recordId,
          content
        }
      })

      if (result.result.success) {
        this.setData({ newComment: '' })
        this.loadComments()
      } else {
        wx.showToast({ title: result.result.error || '评论失败', icon: 'none' })
      }
    } catch (error) {
      console.error('提交评论失败:', error)
      wx.showToast({ title: '评论失败', icon: 'error' })
    }
  },

  viewVersions() {
    wx.navigateTo({
      url: `/pages/record-versions/record-versions?recordId=${this.data.recordId}`
    })
  },

  previewImage(e) {
    const { images, current } = e.currentTarget.dataset
    wx.previewImage({
      current: images[current],
      urls: images
    })
  },

  editRecord() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?recordId=${this.data.recordId}`
    })
  },

  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })

            const result = await wx.cloud.callFunction({
              name: 'deleteRecord',
              data: { recordId: this.data.recordId }
            })

            if (result.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            } else {
              wx.showToast({ title: '删除失败', icon: 'error' })
            }
          } catch (error) {
            console.error('删除记录失败:', error)
            wx.showToast({ title: '删除失败', icon: 'error' })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  }
})
