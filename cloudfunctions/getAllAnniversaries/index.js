const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const { toDateString } = require('../shared/date')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
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

    // 查询所有纪念日
    const result = await db.collection('anniversaries').where({
      _openid: _.in(queryOpenids)
    }).orderBy('date', 'asc').get()

    // 去重：按 _id 去重（避免重复查询同一对情侣时出现重复记录）
    const seen = new Set()
    const uniqueAnniversaries = []

    for (const anniversary of result.data) {
      if (!seen.has(anniversary._id)) {
        seen.add(anniversary._id)
        uniqueAnniversaries.push(anniversary)
      }
    }

    // 将日期转换为本地格式字符串
    const anniversaries = uniqueAnniversaries.map(anniversary => {
      return {
        ...anniversary,
        date: toDateString(anniversary.date)
      }
    })

    return {
      success: true,
      anniversaries: anniversaries
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
