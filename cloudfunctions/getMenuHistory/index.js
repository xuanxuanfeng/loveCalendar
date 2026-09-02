const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10 } = event

  if (page < 1 || pageSize < 1 || pageSize > 50) {
    return { success: false, error: '分页参数不合法' }
  }

  try {
    const conditions = { status: 'decided' }
    const countResult = await db.collection('menus').where(conditions).count()
    const total = countResult.total

    const result = await db.collection('menus')
      .where(conditions)
      .orderBy('decidedAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    const menus = result.data.map(menu => {
      const decidedDish = menu.candidates.find(c => c.dishId === menu.decidedDishId)
      return {
        ...menu,
        decidedDishName: decidedDish ? decidedDish.dishName : '未找到'
      }
    })

    return { success: true, data: menus, total, page, pageSize }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
