const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { imageUrls } = event

  try {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return {
        success: true,
        deleted: 0
      }
    }

    if (imageUrls.length > 9) {
      return {
        success: false,
        error: '单次删除图片数量不能超过9张'
      }
    }

    for (const url of imageUrls) {
      if (typeof url !== 'string' || !url.startsWith('cloud://')) {
        return {
          success: false,
          error: '包含无效的图片地址'
        }
      }
    }

    // 验证图片属于当前用户或其情侣
    const openids = [wxContext.OPENID]

    const coupleResult = await db.collection('couples').where({
      $or: [
        { user1Openid: wxContext.OPENID },
        { user2Openid: wxContext.OPENID }
      ],
      isActive: true
    }).get()

    if (coupleResult.data.length > 0) {
      const couple = coupleResult.data[0]
      openids.push(
        couple.user1Openid === wxContext.OPENID ? couple.user2Openid : couple.user1Openid
      )
    }

    // 查询包含这些图片的记录，确认归属
    const recordsWithImages = await db.collection('records').where({
      _openid: _.in(openids),
      images: _.in(imageUrls)
    }).get()

    const ownedUrls = new Set()
    recordsWithImages.data.forEach(record => {
      if (Array.isArray(record.images)) {
        record.images.forEach(url => ownedUrls.add(url))
      }
    })

    const authorizedUrls = imageUrls.filter(url => ownedUrls.has(url))

    if (authorizedUrls.length === 0) {
      return {
        success: false,
        error: '无权删除这些图片'
      }
    }

    const result = await cloud.deleteFile({
      fileList: authorizedUrls
    })

    const deletedCount = result.fileList.filter(file => file.status === 0).length

    return {
      success: true,
      deleted: deletedCount,
      total: authorizedUrls.length,
      result: result.fileList
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
