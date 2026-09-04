const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { validateDishName, validateDishCategory, validateDishDifficulty, validateCloudUrl } = require('../shared/validators')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { name, description, category, tags, imageUrl, difficulty, estimatedTime, ingredients } = event

  const nameErr = validateDishName(name)
  if (nameErr) return { success: false, error: nameErr }

  const catErr = validateDishCategory(category)
  if (catErr) return { success: false, error: catErr }

  const diffErr = validateDishDifficulty(difficulty)
  if (diffErr) return { success: false, error: diffErr }

  if (estimatedTime !== undefined && (typeof estimatedTime !== 'number' || estimatedTime < 0 || estimatedTime > 999)) {
    return { success: false, error: '预估时间不合法（0-999分钟）' }
  }
  if (description && (typeof description !== 'string' || description.length > 200)) {
    return { success: false, error: '描述不能超过200字' }
  }
  if (ingredients && (typeof ingredients !== 'string' || ingredients.length > 200)) {
    return { success: false, error: '食材描述不能超过200字' }
  }
  if (tags && (!Array.isArray(tags) || tags.length > 5 || tags.some(t => typeof t !== 'string' || t.length > 10))) {
    return { success: false, error: '标签不合法（最多5个，每个10字内）' }
  }
  if (imageUrl) {
    const urlErr = validateCloudUrl(imageUrl)
    if (urlErr) return { success: false, error: urlErr }
  }

  try {
    const userResult = await db.collection('users').where({ _openid: wxContext.OPENID }).get()
    const profile = (userResult.data.length > 0 && userResult.data[0].profile) || {}

    const now = new Date()
    const dishData = {
      _openid: wxContext.OPENID,
      authorOpenid: wxContext.OPENID,
      authorNickname: profile.nickname || '',
      name: name.trim(),
      description: (description || '').trim(),
      category,
      tags: tags || [],
      imageUrl: imageUrl || null,
      difficulty: difficulty || 'easy',
      estimatedTime: estimatedTime || 0,
      ingredients: (ingredients || '').trim(),
      isActive: true,
      likeCount: 0,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.collection('dishes').add({ data: dishData })
    return { success: true, dishId: result._id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
