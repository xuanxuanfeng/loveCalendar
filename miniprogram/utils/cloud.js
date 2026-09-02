// utils/cloud.js - 云函数调用封装（统一错误处理、loading 状态）

async function callCloud(name, data = {}, options = {}) {
  const { showLoading = true, loadingText = '加载中...' } = options

  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true })
  }

  try {
    const res = await wx.cloud.callFunction({ name, data })
    return res.result
  } catch (err) {
    console.error(`调用云函数 ${name} 失败:`, err)
    wx.showToast({ title: '网络异常', icon: 'none' })
    throw err
  } finally {
    if (showLoading) {
      wx.hideLoading()
    }
  }
}

module.exports = {
  callCloud
}
