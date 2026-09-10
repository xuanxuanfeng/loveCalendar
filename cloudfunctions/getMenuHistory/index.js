const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { page = 1, pageSize = 10 } = event

  if (page < 1 || pageSize < 1 || pageSize > 50) {
    return { success: false, error: '分页参数不合法' }
  }

  try {
    const coupleResult = await db.collection('couples').where({
      $or: [
        { user1Openid: wxContext.OPENID },
        { user2Openid: wxContext.OPENID }
      ],
      isActive: true
    }).get()

    let queryOpenids = [wxContext.OPENID]
    if (coupleResult.data.length > 0) {
      const couple = coupleResult.data[0]
      queryOpenids = [couple.user1Openid, couple.user2Openid]
    }

    const conditions = {
      status: 'decided',
      _openid: _.in(queryOpenids)
    }
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
