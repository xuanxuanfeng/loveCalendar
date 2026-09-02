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
      return { success: false, error: '无权访问此记录' }
    }

    const versions = await db.collection('recordVersions').where({
      recordId
    }).orderBy('version', 'desc').get()

    return {
      success: true,
      versions: versions.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
