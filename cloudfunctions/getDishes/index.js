const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const CATEGORIES = ['家常菜', '硬菜', '汤', '主食', '小吃', '饮品']

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { category, keyword, onlyMine, page = 1, pageSize = 20 } = event

  if (category && !CATEGORIES.includes(category)) {
    return { success: false, error: '分类不合法' }
  }
  if (page < 1 || pageSize < 1 || pageSize > 50) {
    return { success: false, error: '分页参数不合法' }
  }

  try {
    const conditions = { isActive: true }

    if (category) {
      conditions.category = category
    }
    if (onlyMine) {
      conditions._openid = wxContext.OPENID
    }
    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      conditions.name = db.RegExp({ regexp: keyword.trim(), options: 'i' })
    }

    const countResult = await db.collection('dishes').where(conditions).count()
    const total = countResult.total

    const result = await db.collection('dishes')
      .where(conditions)
      .orderBy('likeCount', 'desc')
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return { success: true, data: result.data, total, page, pageSize }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
