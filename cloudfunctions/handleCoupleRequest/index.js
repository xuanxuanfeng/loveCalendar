const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, targetOpenid, requestId } = event

  try {
    switch (action) {
      case 'sendRequest':
        // 发送情侣关系请求
        return await sendCoupleRequest(wxContext.OPENID, targetOpenid)
      case 'acceptRequest':
        // 接受情侣关系请求
        return await acceptCoupleRequest(requestId, wxContext.OPENID)
      case 'rejectRequest':
        // 拒绝情侣关系请求
        return await rejectCoupleRequest(requestId, wxContext.OPENID)
      case 'getRequests':
        // 获取情侣关系请求
        return await getCoupleRequests(wxContext.OPENID)
      case 'cancelRequest':
        // 取消发送的请求
        return await cancelCoupleRequest(requestId, wxContext.OPENID)
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

// 发送情侣关系请求
async function sendCoupleRequest(senderOpenid, targetOpenid) {
  // 验证 targetOpenid 是否存在
  if (!targetOpenid) {
    return {
      success: false,
      error: '请输入对方 OpenID'
    }
  }

  // 检查是否是自己
  if (senderOpenid === targetOpenid) {
    return {
      success: false,
      error: '不能绑定自己'
    }
  }

  // 检查发送者和接收者是否存在
  const sender = await db.collection('users').where({
    _openid: senderOpenid
  }).get()

  const target = await db.collection('users').where({
    _openid: targetOpenid
  }).get()

  if (sender.data.length === 0) {
    return {
      success: false,
      error: '当前用户不存在，请先注册'
    }
  }

  if (target.data.length === 0) {
    return {
      success: false,
      error: '对方用户不存在，请让对方先打开小程序注册'
    }
  }

  // 检查是否已经是情侣关系
  const existingCouple = await db.collection('couples').where(_.or([
    { user1Openid: senderOpenid, user2Openid: targetOpenid, isActive: true },
    { user1Openid: targetOpenid, user2Openid: senderOpenid, isActive: true }
  ])).get()

  if (existingCouple.data.length > 0) {
    return {
      success: false,
      error: '已经是情侣关系'
    }
  }

  // 检查是否已经发送过请求
  const existingRequest = await db.collection('coupleRequests').where({
    senderOpenid: senderOpenid,
    targetOpenid: targetOpenid,
    status: 'pending'
  }).get()

  if (existingRequest.data.length > 0) {
    return {
      success: false,
      error: '已发送过请求，请等待对方处理'
    }
  }

  // 检查是否已经收到过来自对方的请求
  const incomingRequest = await db.collection('coupleRequests').where({
    senderOpenid: targetOpenid,
    targetOpenid: senderOpenid,
    status: 'pending'
  }).get()

  if (incomingRequest.data.length > 0) {
    // 如果收到过来自对方的请求，则直接建立情侣关系
    const coupleResult = await createCouple(senderOpenid, targetOpenid, '我们的纪念日')
    if (coupleResult.success) {
      // 更新请求状态为已接受
      await db.collection('coupleRequests').doc(incomingRequest.data[0]._id).update({
        data: {
          status: 'accepted',
          updatedAt: new Date()
        }
      })
      return {
        success: true,
        message: 'Couple relationship established',
        coupleInfo: coupleResult.coupleInfo
      }
    } else {
      return coupleResult
    }
  }

  // 创建情侣关系请求
  const result = await db.collection('coupleRequests').add({
    data: {
      senderOpenid,
      targetOpenid,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    requestId: result._id
  }
}

// 接受情侣关系请求
async function acceptCoupleRequest(requestId, accepterOpenid) {
  const request = await db.collection('coupleRequests').doc(requestId).get()

  if (!request.data) {
    return {
      success: false,
      error: '请求不存在'
    }
  }

  if (request.data.targetOpenid !== accepterOpenid) {
    return {
      success: false,
      error: '无权操作此请求'
    }
  }

  if (request.data.status !== 'pending') {
    return {
      success: false,
      error: '请求已被处理'
    }
  }

  // 检查是否已经存在情侣关系
  const existingCouple = await db.collection('couples').where(_.or([
    { user1Openid: request.data.senderOpenid, user2Openid: accepterOpenid, isActive: true },
    { user1Openid: accepterOpenid, user2Openid: request.data.senderOpenid, isActive: true }
  ])).get()

  if (existingCouple.data.length > 0) {
    return {
      success: false,
      error: '已经是情侣关系'
    }
  }

  // 创建情侣关系
  const coupleResult = await createCouple(request.data.senderOpenid, accepterOpenid, '我们的纪念日')
  if (coupleResult.success) {
    // 更新请求状态
    await db.collection('coupleRequests').doc(requestId).update({
      data: {
        status: 'accepted',
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: 'Couple relationship accepted',
      coupleInfo: coupleResult.coupleInfo
    }
  } else {
    return coupleResult
  }
}

// 拒绝情侣关系请求
async function rejectCoupleRequest(requestId, rejecterOpenid) {
  const request = await db.collection('coupleRequests').doc(requestId).get()

  if (!request.data) {
    return {
      success: false,
      error: '请求不存在'
    }
  }

  if (request.data.targetOpenid !== rejecterOpenid) {
    return {
      success: false,
      error: '无权操作此请求'
    }
  }

  if (request.data.status !== 'pending') {
    return {
      success: false,
      error: '请求已被处理'
    }
  }

  // 更新请求状态
  await db.collection('coupleRequests').doc(requestId).update({
    data: {
      status: 'rejected',
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: 'Request rejected'
  }
}

// 获取情侣关系请求
async function getCoupleRequests(userOpenid) {
  // 获取发送给当前用户的请求
  const incomingRequests = await db.collection('coupleRequests').where({
    targetOpenid: userOpenid,
    status: 'pending'
  }).orderBy('createdAt', 'desc').get()

  // 获取当前用户发送的请求
  const outgoingRequests = await db.collection('coupleRequests').where({
    senderOpenid: userOpenid,
    status: 'pending'
  }).orderBy('createdAt', 'desc').get()

  return {
    success: true,
    incomingRequests: incomingRequests.data,
    outgoingRequests: outgoingRequests.data
  }
}

// 取消发送的请求
async function cancelCoupleRequest(requestId, cancellerOpenid) {
  const request = await db.collection('coupleRequests').doc(requestId).get()

  if (!request.data) {
    return {
      success: false,
      error: '请求不存在'
    }
  }

  if (request.data.senderOpenid !== cancellerOpenid) {
    return {
      success: false,
      error: '无权操作此请求'
    }
  }

  if (request.data.status !== 'pending') {
    return {
      success: false,
      error: '请求已被处理'
    }
  }

  // 更新请求状态
  await db.collection('coupleRequests').doc(requestId).update({
    data: {
      status: 'cancelled',
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: 'Request cancelled'
  }
}

// 创建情侣关系的辅助函数
async function createCouple(user1Openid, user2Openid, coupleName) {
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

  // 更新两个用户的 profile，添加 coupleId
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
