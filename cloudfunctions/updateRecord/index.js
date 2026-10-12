const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const { validateDate, validateRecordFields, validateRecordMetadata } = require('../shared/validators')
const { toDateString } = require('../shared/date')
const { writeEditLog } = require('../shared/edit-log')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordId, date, content, images, changeNote, title, tags } = event

  try {
    if (!recordId || typeof recordId !== 'string') {
      return { success: false, error: '记录 ID 无效' }
    }

    const dateErr = validateDate(date)
    if (dateErr) return { success: false, error: dateErr }

    const fieldsErr = validateRecordFields(content, images)
    if (fieldsErr) return { success: false, error: fieldsErr }
    const metadataErr = validateRecordMetadata(title, tags)
    if (metadataErr) return { success: false, error: metadataErr }

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
    const newTitle = title === undefined ? (existingRecord.data.title || '') : title
    const newTags = tags === undefined ? (existingRecord.data.tags || []) : tags

    // 旧记录第一次编辑时先保存原文，避免版本历史缺少初始内容。
    if (!existingRecord.data.version) {
      await db.collection('recordVersions').add({ data: {
        recordId, version: 1, date: toDateString(existingRecord.data.date),
        content: existingRecord.data.content || '', images: oldImages,
        title: existingRecord.data.title || '', tags: existingRecord.data.tags || [],
        editedBy: existingRecord.data._openid, editorNickname: existingRecord.data.authorNickname || '',
        editedAt: existingRecord.data.createdAt || now, changeType: 'create', changeNote: ''
      } })
    }

    const updateData = {
      date, content: content ? content.trim() : '', images: newImages,
      title: newTitle, tags: newTags, lastEditedBy: wxContext.OPENID,
      lastEditedAt: now, version: newVersion, editCount: _.inc(1), updatedAt: now
    }

    // 更新记录
    await db.collection('records').doc(recordId).update({
      data: updateData
    })

    // 创建版本记录
    await db.collection('recordVersions').add({
      data: {
        recordId,
        version: newVersion,
        date,
        title: newTitle,
        tags: newTags,
        content: content ? content.trim() : '',
        images: newImages,
        editedBy: wxContext.OPENID,
        editorNickname,
        editedAt: now,
        changeType: 'edit',
        changeNote: (changeNote && typeof changeNote === 'string') ? changeNote.trim().slice(0, 100) : ''
      }
    })

    // 图片仍被历史版本引用，随整条记录删除时统一清理。
    await writeEditLog(db, { recordId, recordType: 'record', openid: wxContext.OPENID,
      editorName: editorNickname, oldData: existingRecord.data, newData: updateData })

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
