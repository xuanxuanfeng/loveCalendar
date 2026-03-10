const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { phone } = event

  try {
    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return {
        success: false,
        error: '手机号格式不正确'
      }
    }

    // 通过手机号查找用户
    const user = await db.collection('users').where({
      phone: phone
    }).get()

    if (user.data.length === 0) {
      return {
        success: false,
        error: '该手机号未注册，请让对方先打开小程序完成注册'
      }
    }

    // 检查是否是自己
    if (user.data[0]._openid === wxContext.OPENID) {
      return {
        success: false,
        error: '不能绑定自己'
      }
    }

    return {
      success: true,
      openid: user.data[0]._openid,
      userInfo: {
        nickname: user.data[0].profile?.nickname || '',
        avatar: user.data[0].profile?.avatar || ''
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
