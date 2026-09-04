const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const { validateDate, validateAnniversaryFields } = require('../shared/validators')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, date, isCountdownMode, countdownDays } = event

  try {
    const annErr = validateAnniversaryFields(name, countdownDays, isCountdownMode)
    if (annErr) return { success: false, error: annErr }

    const dateErr = validateDate(date)
    if (dateErr) return { success: false, error: dateErr }

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
