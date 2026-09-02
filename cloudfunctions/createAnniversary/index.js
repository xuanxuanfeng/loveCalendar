const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_NAME_LENGTH = 50
const MAX_COUNTDOWN_DAYS = 20

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, date, isCountdownMode, countdownDays } = event

  try {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return { success: false, error: '纪念日名称不能为空' }
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      return { success: false, error: `名称不能超过${MAX_NAME_LENGTH}字` }
    }

    if (!date || !DATE_REGEX.test(date)) {
      return { success: false, error: '日期格式无效，应为 YYYY-MM-DD' }
    }

    if (isCountdownMode && countdownDays) {
      if (!Array.isArray(countdownDays) || countdownDays.length > MAX_COUNTDOWN_DAYS) {
        return { success: false, error: `倒数日数量不能超过${MAX_COUNTDOWN_DAYS}个` }
      }
      for (const d of countdownDays) {
        const num = parseInt(d)
        if (isNaN(num) || num < 1) {
          return { success: false, error: '倒数日天数必须为正整数' }
        }
      }
    }

    const existingAnniversary = await db.collection('anniversaries').where({
      _openid: wxContext.OPENID,
      name: name.trim()
    }).get()

    if (existingAnniversary.data.length > 0) {
      return {
        success: false,
        error: '纪念日名称已存在'
      }
    }

    const anniversaryData = {
      _openid: wxContext.OPENID,
      name: name.trim(),
      date: new Date(`${date}T00:00:00+08:00`),
      isCountdownMode: isCountdownMode || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (isCountdownMode && countdownDays && Array.isArray(countdownDays) && countdownDays.length > 0) {
      anniversaryData.countdownDays = countdownDays.map(d => parseInt(d))
    }

    const result = await db.collection('anniversaries').add({
      data: anniversaryData
    })

    return {
      success: true,
      anniversaryIds: [result._id],
      message: '纪念日创建成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
