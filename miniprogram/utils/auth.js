// utils/auth.js - 权限判断工具

async function waitForUser() {
  const app = getApp()
  return app.waitForUser()
}

async function ensureLoggedIn() {
  const openid = await waitForUser()
  if (!openid) {
    wx.showToast({ title: '请先登录', icon: 'error' })
    return null
  }
  return openid
}

module.exports = {
  waitForUser,
  ensureLoggedIn
}
