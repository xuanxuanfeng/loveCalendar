const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { menuId, date, mealType } = event

  try {
    const coupleResult = await db.collection('couples').where({
      $or: [
        { user1Openid: wxContext.OPENID },
        { user2Openid: wxContext.OPENID }
      ],
      isActive: true
    }).get()

    const queryOpenids = coupleResult.data.length > 0
      ? [coupleResult.data[0].user1Openid, coupleResult.data[0].user2Openid]
      : [wxContext.OPENID]

    let menu = null

    if (menuId && typeof menuId === 'string') {
      const result = await db.collection('menus').doc(menuId).get()
      menu = result.data
    } else if (date && mealType) {
      const result = await db.collection('menus').where({
        date, mealType, _openid: _.in(queryOpenids)
      }).limit(1).get()
      menu = result.data.length > 0 ? result.data[0] : null
    } else if (date) {
      const result = await db.collection('menus').where({
        date, _openid: _.in(queryOpenids)
      }).limit(1).get()
      menu = result.data.length > 0 ? result.data[0] : null
    } else {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const result = await db.collection('menus').where({
        date: todayStr, _openid: _.in(queryOpenids)
      }).limit(1).get()
      menu = result.data.length > 0 ? result.data[0] : null
    }

    if (!menu) {
      return { success: true, data: null }
    }

    const votesResult = await db.collection('menuVotes').where({ menuId: menu._id }).get()
    const votes = votesResult.data

    return { success: true, data: { ...menu, votes } }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
