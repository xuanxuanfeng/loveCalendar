const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { dishId } = event

  if (!dishId || typeof dishId !== 'string') {
    return { success: false, error: '菜品ID不合法' }
  }

  try {
    const existing = await db.collection('dishes').doc(dishId).get()
    if (!existing.data || existing.data._openid !== wxContext.OPENID) {
      return { success: false, error: '无权下架此菜品' }
    }

    await db.collection('dishes').doc(dishId).update({
      data: { isActive: false, updatedAt: new Date() }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
