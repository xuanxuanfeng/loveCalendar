const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_CONTENT_LENGTH = 1000
const MAX_IMAGES = 9

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, content, images } = event

  try {
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

    if ((!content || !content.trim()) && (!images || images.length === 0)) {
      return { success: false, error: '请输入内容或添加图片' }
    }

    // 获取用户信息作为作者快照
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    const profile = (userResult.data.length > 0 && userResult.data[0].profile) || {}
    const authorNickname = profile.nickname || ''
    const authorAvatar = profile.avatar || ''

    const now = new Date()

    const result = await db.collection('records').add({
      data: {
        _openid: wxContext.OPENID,
        authorOpenid: wxContext.OPENID,
        authorNickname,
        authorAvatar,
        date: new Date(`${date}T00:00:00+08:00`),
        content: content ? content.trim() : '',
        images: images || [],
        lastEditedBy: wxContext.OPENID,
        lastEditedAt: now,
        version: 1,
        editCount: 0,
        createdAt: now,
        updatedAt: now
      }
    })

    // 创建第一条版本记录
    await db.collection('recordVersions').add({
      data: {
        recordId: result._id,
        version: 1,
        content: content ? content.trim() : '',
        images: images || [],
        editedBy: wxContext.OPENID,
        editorNickname: authorNickname,
        editedAt: now,
        changeType: 'create',
        changeNote: ''
      }
    })

    return {
      success: true,
      recordIds: [result._id],
      message: '记录创建成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
