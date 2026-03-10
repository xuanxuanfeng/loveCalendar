const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { anniversaryId } = event

  try {
    // 查询纪念日是否存在
    const existingAnniversary = await db.collection('anniversaries').doc(anniversaryId).get()

    if (!existingAnniversary.data) {
      return {
        success: false,
        error: '纪念日不存在'
      }
    }

    // 检查用户权限：允许自己或情侣关系中的另一方删除
    let hasPermission = existingAnniversary.data._openid === wxContext.OPENID

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
        // 检查纪念日是否属于情侣关系中的另一方
        if (existingAnniversary.data._openid === couple.user1Openid || existingAnniversary.data._openid === couple.user2Openid) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      return {
        success: false,
        error: '无权删除此纪念日'
      }
    }

    // 删除纪念日
    const result = await db.collection('anniversaries').doc(anniversaryId).remove()

    return {
      success: true,
      deleted: result.deleted > 0
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
