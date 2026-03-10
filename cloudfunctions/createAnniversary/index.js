const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, date } = event

  try {
    // 检查纪念日名称是否已存在（对于当前用户）
    const existingAnniversary = await db.collection('anniversaries').where({
      _openid: wxContext.OPENID,
      name: name
    }).get()

    if (existingAnniversary.data.length > 0) {
      return {
        success: false,
        error: '纪念日名称已存在'
      }
    }

    // 创建纪念日，只保存一份
    const result = await db.collection('anniversaries').add({
      data: {
        _openid: wxContext.OPENID,
        name: name,
        date: new Date(`${date}T00:00:00+08:00`),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      anniversaryIds: [result._id],
      message: '纪念日创建成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
