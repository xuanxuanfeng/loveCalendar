const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_CONTENT_LENGTH = 1000
const MAX_IMAGES = 9

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId, date, content, images } = event

  try {
    if (!recordId || typeof recordId !== 'string') {
      return { success: false, error: '记录 ID 无效' }
    }

    if (!date || !DATE_REGEX.test(date)) {
      return { success: false, error: '日期格式无效，应为 YYYY-MM-DD' }
    }

    if (content !== undefined && content !== null) {
      if (typeof content !== 'string' || content.length > MAX_CONTENT_LENGTH) {
        return { success: false, error: `内容不能超过${MAX_CONTENT_LENGTH}字` }
      }
    }

    if (images !== undefined && images !== null) {
      if (!Array.isArray(images) || images.length > MAX_IMAGES) {
        return { success: false, error: `图片数量不能超过${MAX_IMAGES}张` }
      }
      for (const url of images) {
        if (typeof url !== 'string' || !url.startsWith('cloud://')) {
          return { success: false, error: '包含无效的图片地址' }
        }
      }
    }

    const existingRecord = await db.collection('records').doc(recordId).get()

    if (!existingRecord.data) {
      return {
        success: false,
        error: '记录不存在'
      }
    }

    let hasPermission = existingRecord.data._openid === wxContext.OPENID

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
        if (existingRecord.data._openid === couple.user1Openid || existingRecord.data._openid === couple.user2Openid) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      return {
        success: false,
        error: '无权修改此记录'
      }
    }

    const result = await db.collection('records').doc(recordId).update({
      data: {
        date: new Date(`${date}T00:00:00+08:00`),
        content: content ? content.trim() : '',
        images: images || [],
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      updated: result.stats.updated > 0,
      message: '记录更新成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
