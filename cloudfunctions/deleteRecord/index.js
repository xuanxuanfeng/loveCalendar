const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId } = event

  try {
    if (!recordId || typeof recordId !== 'string') {
      return { success: false, error: '记录 ID 无效' }
    }

    // 查询记录是否存在
    const existingRecord = await db.collection('records').doc(recordId).get()

    if (!existingRecord.data) {
      return {
        success: false,
        error: '记录不存在'
      }
    }

    // 检查用户权限：允许自己或情侣关系中的另一方删除
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
        error: '无权删除此记录'
      }
    }

    const record = existingRecord.data

    // 删除记录
    const deleteResult = await db.collection('records').doc(recordId).remove()

    // 如果记录包含图片，删除相关图片
    if (record.images && record.images.length > 0) {
      try {
        await cloud.callFunction({
          name: 'deleteImages',
          data: {
            imageUrls: record.images
          }
        })
      } catch (imageDeleteError) {
        console.error('删除图片失败:', imageDeleteError)
      }
    }

    return {
      success: true,
      deleted: deleteResult.deleted > 0
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
