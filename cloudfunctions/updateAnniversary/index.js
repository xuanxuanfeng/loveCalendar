const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const { validateDate, validateAnniversaryFields } = require('../shared/validators')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { anniversaryId, name, date, isCountdownMode, countdownDays } = event

  try {
    if (!anniversaryId || typeof anniversaryId !== 'string') {
      return { success: false, error: '纪念日 ID 无效' }
    }

    const annErr = validateAnniversaryFields(name, countdownDays, isCountdownMode)
    if (annErr) return { success: false, error: annErr }

    const dateErr = validateDate(date)
    if (dateErr) return { success: false, error: dateErr }

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
