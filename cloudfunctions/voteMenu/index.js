const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { getCoupleOpenids } = require('../shared/couple')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { menuId, votes, comment } = event

  if (!menuId || typeof menuId !== 'string') {
    return { success: false, error: '菜单ID不合法' }
  }
  if (!Array.isArray(votes) || votes.length < 1 || votes.length > 10) {
    return { success: false, error: '投票菜品数量不合法（1-10个）' }
  }
  if (comment !== undefined && (typeof comment !== 'string' || comment.length > 100)) {
    return { success: false, error: '留言不能超过100字' }
  }

  try {
    const menuResult = await db.collection('menus').doc(menuId).get()
    const menu = menuResult.data
    if (!menu) {
      return { success: false, error: '菜单不存在' }
    }
    const openids = await getCoupleOpenids(db, wxContext.OPENID)
    if (!openids.includes(menu._openid)) {
      return { success: false, error: '无权参与此菜单' }
    }
    if (menu.status !== 'voting') {
      return { success: false, error: '投票已结束' }
    }

    const candidateIds = menu.candidates.map(c => c.dishId)
    for (const voteId of votes) {
      if (!candidateIds.includes(voteId)) {
        return { success: false, error: '投票的菜品不在候选列表中' }
      }
    }

    const userResult = await db.collection('users').where({ _openid: wxContext.OPENID }).get()
    const profile = (userResult.data.length > 0 && userResult.data[0].profile) || {}

    const existingVote = await db.collection('menuVotes').where({
      menuId,
      voterOpenid: wxContext.OPENID
    }).get()

    if (existingVote.data.length > 0) {
      await db.collection('menuVotes').doc(existingVote.data[0]._id).update({
        data: {
          votes,
          comment: (comment || '').trim(),
          createdAt: new Date()
        }
      })
      return { success: true, voteId: existingVote.data[0]._id, updated: true }
    }

    const voteData = {
      menuId,
      voterOpenid: wxContext.OPENID,
      voterNickname: profile.nickname || '',
      votes,
      comment: (comment || '').trim(),
      createdAt: new Date()
    }

    const result = await db.collection('menuVotes').add({ data: voteData })
    return { success: true, voteId: result._id, updated: false }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
