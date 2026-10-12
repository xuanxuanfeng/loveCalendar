const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const { validateDate } = require('../shared/validators')
const { toDateString } = require('../shared/date')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date } = event

  try {
    const dateErr = validateDate(date)
    if (dateErr) return { success: false, error: dateErr }

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
      date: _.in([date, dateObj])
    }).orderBy('createdAt', 'desc').get()

    // 去重（按 _id，防止情侣查询中同一记录出现多次）
    const uniqueRecords = []
    const seenIds = new Set()

    for (const record of records.data) {
      if (!seenIds.has(record._id)) {
        seenIds.add(record._id)
        uniqueRecords.push({ ...record, date: toDateString(record.date) })
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
