const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9\s]{1,30}$/
const CATEGORIES = ['家常菜', '硬菜', '汤', '主食', '小吃', '饮品']
const DIFFICULTIES = ['easy', 'medium', 'hard']

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { dishId, name, description, category, tags, imageUrl, difficulty, estimatedTime, ingredients } = event

  if (!dishId || typeof dishId !== 'string') {
    return { success: false, error: '菜品ID不合法' }
  }
  if (name !== undefined && (typeof name !== 'string' || !NAME_REGEX.test(name.trim()))) {
    return { success: false, error: '菜品名称不合法' }
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return { success: false, error: '分类不合法' }
  }
  if (difficulty !== undefined && !DIFFICULTIES.includes(difficulty)) {
    return { success: false, error: '难度不合法' }
  }

  try {
    const existing = await db.collection('dishes').doc(dishId).get()
    if (!existing.data || existing.data._openid !== wxContext.OPENID) {
      return { success: false, error: '无权修改此菜品' }
    }

    const updateData = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime
    if (ingredients !== undefined) updateData.ingredients = ingredients.trim()

    await db.collection('dishes').doc(dishId).update({ data: updateData })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
