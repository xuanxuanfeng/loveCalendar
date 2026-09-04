const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const { validateDate, validateRecordFields } = require('../shared/validators')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId, date, content, images, changeNote } = event

  try {
    if (!recordId || typeof recordId !== 'string') {
      return { success: false, error: '记录 ID 无效' }
    }

    const dateErr = validateDate(date)
    if (dateErr) return { success: false, error: dateErr }

    const fieldsErr = validateRecordFields(content, images)
    if (fieldsErr) return { success: false, error: fieldsErr }

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
