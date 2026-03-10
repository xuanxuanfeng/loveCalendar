const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, content, images } = event

  try {
    // 直接创建记录，只保存一份（使用当前用户的 openid）
    const result = await db.collection('records').add({
      data: {
        _openid: wxContext.OPENID,
        date: new Date(`${date}T00:00:00+08:00`),
        content: content || '',
        images: images || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      recordIds: [result._id],
      message: '记录创建成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
