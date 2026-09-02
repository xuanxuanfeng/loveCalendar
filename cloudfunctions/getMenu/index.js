const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { menuId, date, mealType } = event

  try {
    let menu = null

    if (menuId && typeof menuId === 'string') {
      const result = await db.collection('menus').doc(menuId).get()
      menu = result.data
    } else if (date && mealType) {
      const result = await db.collection('menus').where({ date, mealType }).limit(1).get()
      menu = result.data.length > 0 ? result.data[0] : null
    } else {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const result = await db.collection('menus').where({ date: todayStr }).limit(1).get()
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
