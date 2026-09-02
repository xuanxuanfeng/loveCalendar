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
  const { recordId, date, content, images, changeNote } = event

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
      return { success: false, error: '记录不存在' }
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
      return { success: false, error: '无权修改此记录' }
    }

    // 获取编辑者信息
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()
    const profile = (userResult.data.length > 0 && userResult.data[0].profile) || {}
    const editorNickname = profile.nickname || ''

    const now = new Date()
    const oldImages = existingRecord.data.images || []
    const newImages = images || []
    const newVersion = (existingRecord.data.version || 1) + 1

    // 更新记录
    await db.collection('records').doc(recordId).update({
      data: {
        date: new Date(`${date}T00:00:00+08:00`),
        content: content ? content.trim() : '',
        images: newImages,
        lastEditedBy: wxContext.OPENID,
        lastEditedAt: now,
        version: newVersion,
        editCount: _.inc(1),
        updatedAt: now
      }
    })

    // 创建版本记录
    await db.collection('recordVersions').add({
      data: {
        recordId,
        version: newVersion,
        content: content ? content.trim() : '',
        images: newImages,
        editedBy: wxContext.OPENID,
        editorNickname,
        editedAt: now,
        changeType: 'edit',
        changeNote: (changeNote && typeof changeNote === 'string') ? changeNote.trim().slice(0, 100) : ''
      }
    })

    // 清理被移除的旧图片
    const removedImages = oldImages.filter(url => !newImages.includes(url))
    if (removedImages.length > 0) {
      try {
        await cloud.deleteFile({ fileList: removedImages })
      } catch (e) {
        console.error('清理旧图片失败:', e)
      }
    }

    return {
      success: true,
      updated: true,
      message: '记录更新成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
