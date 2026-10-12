async function getCoupleOpenids(db, openid) {
  const result = await db.collection('couples').where({
    $or: [{ user1Openid: openid }, { user2Openid: openid }],
    isActive: true
  }).get()
  if (!result.data.length) return [openid]
  const couple = result.data[0]
  return [couple.user1Openid, couple.user2Openid]
}

module.exports = { getCoupleOpenids }
