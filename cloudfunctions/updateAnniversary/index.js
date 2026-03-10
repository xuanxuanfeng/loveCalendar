const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { anniversaryId, name, date } = event

  try {
    // 查询纪念日是否存在
    const existingAnniversary = await db.collection('anniversaries').doc(anniversaryId).get()

    if (!existingAnniversary.data) {
      return {
        success: false,
        error: '纪念日不存在'
      }
    }

    // 检查用户权限：允许自己或情侣关系中的另一方修改
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
        error: '无权修改此纪念日'
      }
    }

    // 检查新名称是否与其他纪念日重复（排除当前纪念日）
    const sameNameAnniversary = await db.collection('anniversaries').where({
      _openid: wxContext.OPENID,
      name: name,
      _id: _.neq(anniversaryId)
    }).get()

    if (sameNameAnniversary.data.length > 0) {
      return {
        success: false,
        error: '纪念日名称已存在'
      }
    }

    // 更新纪念日
    const result = await db.collection('anniversaries').doc(anniversaryId).update({
      data: {
        name: name,
        date: new Date(`${date}T00:00:00+08:00`),
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      updated: result.stats.updated > 0,
      message: '纪念日更新成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
