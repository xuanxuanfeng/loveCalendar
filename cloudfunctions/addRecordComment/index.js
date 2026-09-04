const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const { validateCommentContent } = require('../shared/validators')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId, content } = event

  try {
    if (!recordId || typeof recordId !== 'string') {
      return { success: false, error: '记录 ID 无效' }
    }

    const commentErr = validateCommentContent(content)
    if (commentErr) return { success: false, error: commentErr }

    // 验证记录存在且有访问权限
    const record = await db.collection('records').doc(recordId).get()

    if (!record.data) {
      return { success: false, error: '记录不存在' }
    }

    let hasPermission = record.data._openid === wxContext.OPENID

    if (!hasPermission) {
      const coupleResult = await db.collection('couples').where({
        $or: [
          { user1Openid: wxContext.OPENID },
          { user2Openid: wxContext.OPENID }
        ],
        isActive: true
      }).get()

      if (coupleResult.data.length > 0) {
        const couple = coupleResult.data[0]
        if (record.data._openid === couple.user1Openid || record.data._openid === couple.user2Openid) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      return { success: false, error: '无权评论此记录' }
    }

    // 获取评论者信息
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()
    const profile = (userResult.data.length > 0 && userResult.data[0].profile) || {}

    const result = await db.collection('recordComments').add({
      data: {
        recordId,
        authorOpenid: wxContext.OPENID,
        authorNickname: profile.nickname || '',
        authorAvatar: profile.avatar || '',
        content: content.trim(),
        createdAt: new Date()
      }
    })

    return {
      success: true,
      commentId: result._id,
      message: '评论成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
