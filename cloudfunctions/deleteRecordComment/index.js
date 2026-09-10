const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { commentId } = event

  try {
    if (!commentId || typeof commentId !== 'string') {
      return { success: false, error: '评论 ID 无效' }
    }

    const commentResult = await db.collection('recordComments').doc(commentId).get()
    const comment = commentResult.data

    if (!comment) {
      return { success: false, error: '评论不存在' }
    }

    if (comment.authorOpenid !== wxContext.OPENID) {
      return { success: false, error: '只能删除自己的评论' }
    }

    await db.collection('recordComments').doc(commentId).remove()

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
