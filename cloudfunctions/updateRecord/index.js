const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId, date, content, images } = event

  try {
    // 查询记录是否存在
    const existingRecord = await db.collection('records').doc(recordId).get()

    if (!existingRecord.data) {
      return {
        success: false,
        error: '记录不存在'
      }
    }

    // 检查用户权限：允许自己或情侣关系中的另一方修改
    let hasPermission = existingRecord.data._openid === wxContext.OPENID

    if (!hasPermission) {
      // 检查是否有情侣关系（查询 user1Openid 或 user2Openid 包含当前用户的记录）
      const coupleResult = await db.collection('couples').where({
        $or: [
          { user1Openid: wxContext.OPENID },
          { user2Openid: wxContext.OPENID }
        ],
        isActive: true
      }).get()

      if (coupleResult.data.length > 0) {
        const couple = coupleResult.data[0]
        // 检查记录是否属于情侣关系中的另一方
        if (existingRecord.data._openid === couple.user1Openid || existingRecord.data._openid === couple.user2Openid) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      return {
        success: false,
        error: '无权修改此记录'
      }
    }

    // 更新记录
    const result = await db.collection('records').doc(recordId).update({
      data: {
        date: new Date(`${date}T00:00:00+08:00`),
        content: content || '',
        images: images || [],
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      updated: result.stats.updated > 0,
      message: '记录更新成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
