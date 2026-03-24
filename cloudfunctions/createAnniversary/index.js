const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, date, isCountdownMode, countdownDays } = event

  try {
    // 检查纪念日名称是否已存在（对于当前用户）
    const existingAnniversary = await db.collection('anniversaries').where({
      _openid: wxContext.OPENID,
      name: name
    }).get()

    if (existingAnniversary.data.length > 0) {
      return {
        success: false,
        error: '纪念日名称已存在'
      }
    }

    // 创建纪念日，只保存一份
    const anniversaryData = {
      _openid: wxContext.OPENID,
      name: name,
      date: new Date(`${date}T00:00:00+08:00`),
      isCountdownMode: isCountdownMode || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 如果是倒数日模式，添加 countdownDays 数组字段（确保是数字数组）
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
