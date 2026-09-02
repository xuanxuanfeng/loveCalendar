const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_NAME_LENGTH = 50
const MAX_COUNTDOWN_DAYS = 20

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { anniversaryId, name, date, isCountdownMode, countdownDays } = event

  try {
    if (!anniversaryId || typeof anniversaryId !== 'string') {
      return { success: false, error: '纪念日 ID 无效' }
    }

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

    const existingAnniversary = await db.collection('anniversaries').doc(anniversaryId).get()

    if (!existingAnniversary.data) {
      return {
        success: false,
        error: '纪念日不存在'
      }
    }

    let hasPermission = existingAnniversary.data._openid === wxContext.OPENID

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

    const sameNameAnniversary = await db.collection('anniversaries').where({
      _openid: existingAnniversary.data._openid,
      name: name.trim(),
      _id: _.neq(anniversaryId)
    }).get()

    if (sameNameAnniversary.data.length > 0) {
      return {
        success: false,
        error: '纪念日名称已存在'
      }
    }

    const updateData = {
      name: name.trim(),
      date: new Date(`${date}T00:00:00+08:00`),
      isCountdownMode: isCountdownMode || false,
      updatedAt: new Date()
    }

    if (isCountdownMode && countdownDays && Array.isArray(countdownDays) && countdownDays.length > 0) {
      updateData.countdownDays = countdownDays.map(d => parseInt(d))
    } else {
      updateData.countdownDays = _.remove()
    }

    const result = await db.collection('anniversaries').doc(anniversaryId).update({
      data: updateData
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
