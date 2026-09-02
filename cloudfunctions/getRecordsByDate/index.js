const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date } = event

  try {
    if (!date || !DATE_REGEX.test(date)) {
      return { success: false, error: '日期格式无效，应为 YYYY-MM-DD' }
    }

    // 检查是否有情侣关系（查询 user1Openid 或 user2Openid 包含当前用户的记录）
    const coupleResult = await db.collection('couples').where({
      $or: [
        { user1Openid: wxContext.OPENID },
        { user2Openid: wxContext.OPENID }
      ],
      isActive: true
    }).get()

    let queryOpenids = [wxContext.OPENID]

    if (coupleResult.data.length > 0) {
      // 有情侣关系，使用双方的 openid 查询
      const couple = coupleResult.data[0]
      queryOpenids = [couple.user1Openid, couple.user2Openid]
    }

    // 查询指定日期的记录
    const dateObj = new Date(`${date}T00:00:00.000+08:00`)
    
    const records = await db.collection('records').where({
      _openid: _.in(queryOpenids),
      date: dateObj
    }).orderBy('createdAt', 'desc').get()

    // 去重：如果同一条记录在情侣双方都有，只保留一条
    const uniqueRecords = []
    const seenContent = new Set()

    for (const record of records.data) {
      // 使用 content + date 作为唯一标识
      const key = `${record.date}-${record.content}`
      if (!seenContent.has(key)) {
        seenContent.add(key)
        uniqueRecords.push(record)
      }
    }

    return {
      success: true,
      records: uniqueRecords
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
