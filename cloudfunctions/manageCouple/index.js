const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, partnerOpenid, coupleName } = event

  try {
    switch (action) {
      case 'create':
        // 创建情侣关系
        return await createCouple(wxContext.OPENID, partnerOpenid, coupleName)
      
      case 'get':
        // 获取情侣关系
        return await getCouple(wxContext.OPENID)
      
      case 'update':
        // 更新情侣关系
        return await updateCouple(event.coupleId, coupleName)
      
      case 'delete':
        // 删除情侣关系
        return await deleteCouple(event.coupleId, wxContext.OPENID)
      
      default:
        return {
          success: false,
          error: 'Invalid action'
        }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 创建情侣关系
async function createCouple(user1Openid, user2Openid, coupleName) {
  // 检查两个用户是否存在
  const user1 = await db.collection('users').where({
    _openid: user1Openid
  }).get()
  
  const user2 = await db.collection('users').where({
    _openid: user2Openid
  }).get()

  if (user1.data.length === 0 || user2.data.length === 0) {
    return {
      success: false,
      error: 'User not found'
    }
  }

  // 检查是否已经存在情侣关系
  const existingCouple = await db.collection('couples').where({
    $or: [
      { user1Openid: user1Openid, user2Openid: user2Openid },
      { user1Openid: user2Openid, user2Openid: user1Openid }
    ]
  }).get()

  if (existingCouple.data.length > 0) {
    return {
      success: false,
      error: 'Couple relationship already exists'
    }
  }

  // 创建情侣关系
  const result = await db.collection('couples').add({
    data: {
      user1Openid,
      user2Openid,
      coupleName: coupleName || '我们的纪念日',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
  })

  // 更新两个用户的profile，添加coupleId
  await db.collection('users').where({ _openid: user1Openid }).update({
    data: {
      'profile.coupleId': result._id,
      updatedAt: new Date()
    }
  })

  await db.collection('users').where({ _openid: user2Openid }).update({
    data: {
      'profile.coupleId': result._id,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    coupleId: result._id,
    coupleInfo: {
      user1Openid,
      user2Openid,
      coupleName: coupleName || '我们的纪念日'
    }
  }
}

// 获取情侣关系
async function getCouple(userOpenid) {
  const couple = await db.collection('couples').where({
    $or: [
      { user1Openid: userOpenid },
      { user2Openid: userOpenid }
    ],
    isActive: true
  }).get()

  if (couple.data.length === 0) {
    return {
      success: false,
      error: 'No couple relationship found'
    }
  }

  return {
    success: true,
    coupleInfo: couple.data[0]
  }
}

// 更新情侣关系
async function updateCouple(coupleId, coupleName) {
  const result = await db.collection('couples').doc(coupleId).update({
    data: {
      coupleName,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    updated: result.stats.updated > 0
  }
}

// 删除情侣关系
async function deleteCouple(coupleId, userOpenid) {
  const couple = await db.collection('couples').doc(coupleId).get()
  
  if (!couple.data || couple.data.user1Openid !== userOpenid && couple.data.user2Openid !== userOpenid) {
    return {
      success: false,
      error: 'Permission denied'
    }
  }

  const result = await db.collection('couples').doc(coupleId).update({
    data: {
      isActive: false,
      updatedAt: new Date()
    }
  })

  // 同时更新两个用户的coupleId为null
  await db.collection('users').where({ 
    $or: [
      { _openid: couple.data.user1Openid },
      { _openid: couple.data.user2Openid }
    ]
  }).update({
    data: {
      'profile.coupleId': null,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    deleted: result.stats.updated > 0
  }
}