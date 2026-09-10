const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { menuId, dishId } = event

  if (!menuId || typeof menuId !== 'string') {
    return { success: false, error: '菜单ID不合法' }
  }
  if (!dishId || typeof dishId !== 'string') {
    return { success: false, error: '菜品ID不合法' }
  }

  try {
    const menuResult = await db.collection('menus').doc(menuId).get()
    const menu = menuResult.data
    if (!menu) {
      return { success: false, error: '菜单不存在' }
    }
    if (menu._openid !== wxContext.OPENID) {
      return { success: false, error: '只有发起人可以确定菜单' }
    }
    if (menu.status === 'decided') {
      return { success: false, error: '菜单已确定' }
    }

    const candidateIds = menu.candidates.map(c => c.dishId)
    if (!candidateIds.includes(dishId)) {
      return { success: false, error: '确定的菜品不在候选列表中' }
    }

    const now = new Date()
    await db.collection('menus').doc(menuId).update({
      data: {
        status: 'decided',
        decidedDishId: dishId,
        decidedBy: wxContext.OPENID,
        decidedAt: now,
        updatedAt: now
      }
    })

    await db.collection('dishes').where({ _id: dishId }).update({
      data: { likeCount: _.inc(1) }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
