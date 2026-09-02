const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { startDate, endDate } = event

  try {
    if (!startDate || !DATE_REGEX.test(startDate)) {
      return { success: false, error: '开始日期格式无效' }
    }
    if (!endDate || !DATE_REGEX.test(endDate)) {
      return { success: false, error: '结束日期格式无效' }
    }

    // 获取用户情侣关系
    const coupleResult = await db.collection('couples').where({
      $or: [
        { user1Openid: wxContext.OPENID },
        { user2Openid: wxContext.OPENID }
      ],
      isActive: true
    }).get()

    let openidsToQuery = [wxContext.OPENID] // 默认只查询自己的数据

    if (coupleResult.data.length > 0) {
      // 如果有情侣关系，查询情侣双方的数据
      const couple = coupleResult.data[0]
      openidsToQuery = [couple.user1Openid, couple.user2Openid]
    }

    // 查询指定日期范围内的记录（情侣双方的）
    const recordsResult = await db.collection('records').where({
      _openid: _.in(openidsToQuery),
      date: _.gte(new Date(`${startDate}T00:00:00+08:00`)).and(_.lte(new Date(`${endDate}T00:00:00+08:00`))) // 确保使用中国时区
    }).get()

    // 查询指定日期范围内的纪念日（情侣双方的）
    const anniversariesResult = await db.collection('anniversaries').where({
      _openid: _.in(openidsToQuery),
      date: _.gte(new Date(`${startDate}T00:00:00+08:00`)).and(_.lte(new Date(`${endDate}T00:00:00+08:00`))) // 确保使用中国时区
    }).get()

    // 按日期组织记录数据
    const recordsByDate = {}
    recordsResult.data.forEach(record => {
      // 将日期转换为本地格式字符串，确保时区正确
      const date = new Date(record.date.getTime() + record.date.getTimezoneOffset() * 60000 + 8 * 3600000); // 转换为北京时间
      const dateKey = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = []
      }
      recordsByDate[dateKey].push({
        _id: record._id,
        content: record.content,
        images: record.images,
        createdAt: record.createdAt,
        authorOpenid: record._openid // 添加作者信息
      })
    })

    // 按日期组织纪念日数据
    const anniversariesByDate = {}
    anniversariesResult.data.forEach(anniversary => {
      // 将日期转换为本地格式字符串，确保时区正确
      const date = new Date(anniversary.date.getTime() + anniversary.date.getTimezoneOffset() * 60000 + 8 * 3600000); // 转换为北京时间
      const dateKey = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
      if (!anniversariesByDate[dateKey]) {
        anniversariesByDate[dateKey] = []
      }
      anniversariesByDate[dateKey].push({
        _id: anniversary._id,
        name: anniversary.name,
        date: anniversary.date,
        authorOpenid: anniversary._openid // 添加作者信息
      })
    })

    return {
      success: true,
      recordsByDate,
      anniversariesByDate,
      hasCouple: coupleResult.data.length > 0
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}