const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const { toDateString } = require('../shared/date')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId } = event

  try {
    if (!recordId || typeof recordId !== 'string') {
      return { success: false, error: '记录 ID 无效' }
    }

    // 查询指定 ID 的记录
    const result = await db.collection('records').doc(recordId).get()

    if (!result.data) {
      return {
        success: false,
        error: '记录不存在'
      }
    }

    const record = result.data

    // 检查访问权限：自己创建的或情侣共享的
    let hasPermission = record._openid === wxContext.OPENID

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
        if (record._openid === couple.user1Openid || record._openid === couple.user2Openid) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      return {
        success: false,
        error: '无权访问此记录'
      }
    }

    // 确保日期字段格式正确
    if (record.date) {
      record.date = toDateString(record.date)
    }

    return {
      success: true,
      record: record
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
