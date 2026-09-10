const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const { validateDate } = require('../shared/validators')
const { MEAL_TYPES } = require('../shared/constants')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, mealType, candidates } = event

  const dateErr = validateDate(date)
  if (dateErr) return { success: false, error: '日期格式不合法' }
  if (!mealType || !MEAL_TYPES.includes(mealType)) {
    return { success: false, error: '餐次类型不合法' }
  }
  if (!Array.isArray(candidates) || candidates.length < 2 || candidates.length > 10) {
    return { success: false, error: '候选菜品数量不合法（2-10个）' }
  }

  const cleanCandidates = []
  for (const c of candidates) {
    if (!c.dishId || typeof c.dishId !== 'string') {
      return { success: false, error: '候选菜品ID不合法' }
    }
    if (!c.dishName || typeof c.dishName !== 'string' || c.dishName.length > 30) {
      return { success: false, error: '候选菜品名称不合法' }
    }
    cleanCandidates.push({
      dishId: c.dishId,
      dishName: c.dishName,
      imageUrl: (c.imageUrl && typeof c.imageUrl === 'string') ? c.imageUrl : null
    })
  }

  try {
    const existing = await db.collection('menus').where({
      date,
      mealType,
      status: _.neq('cancelled')
    }).get()

    if (existing.data.length > 0) {
      return { success: false, error: '该餐次已有菜单' }
    }

    const now = new Date()
    const menuData = {
      _openid: wxContext.OPENID,
      date,
      mealType,
      candidates: cleanCandidates,
      status: 'voting',
      decidedDishId: null,
      decidedBy: null,
      decidedAt: null,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.collection('menus').add({ data: menuData })
    return { success: true, menuId: result._id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
