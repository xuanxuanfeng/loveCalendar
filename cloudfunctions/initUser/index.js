const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, phone, nickname, avatar } = event

  try {
    // 检查用户是否已存在
    const existingUser = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    if (existingUser.data.length > 0) {
      // 如果用户已存在，可以选择更新手机号
      if (action === 'updatePhone' && phone) {
        await db.collection('users').where({
          _openid: wxContext.OPENID
        }).update({
          data: {
            phone: phone,
            updatedAt: new Date()
          }
        })
        return {
          success: true,
          message: '手机号更新成功',
          openid: wxContext.OPENID
        }
      }

      // 如果用户已存在，直接返回用户信息
      return {
        success: true,
        isNewUser: false,
        userInfo: existingUser.data[0],
        openid: wxContext.OPENID
      }
    } else {
      // 如果用户不存在，创建新用户
      const userData = {
        _openid: wxContext.OPENID,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          nickname: nickname || '',
          avatar: avatar || '',
          coupleId: null // 默认没有配对
        }
      }

      // 如果有手机号，添加到用户数据中
      if (phone) {
        userData.phone = phone
      }

      const result = await db.collection('users').add({
        data: userData
      })

      return {
        success: true,
        isNewUser: true,
        userId: result._id,
        openid: wxContext.OPENID
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}