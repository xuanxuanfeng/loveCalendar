// utils/countdown.js - 纪念日倒数日计算（消除 index.js 和 anniversaries.js 的重复代码）

const { parseDate } = require('./date')

function calculateCountdown(anniversary) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (anniversary.isCountdownMode && anniversary.countdownDays && Array.isArray(anniversary.countdownDays)) {
    const startDate = parseDate(anniversary.date)
    startDate.setHours(0, 0, 0, 0)

    const upcomingCountdowns = []
    anniversary.countdownDays.forEach(days => {
      const targetDays = parseInt(days)
      const targetDate = new Date(startDate)
      targetDate.setDate(targetDate.getDate() + targetDays)
      const diffTime = targetDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays >= 0) {
        upcomingCountdowns.push({ days: targetDays, diffDays })
      }
    })

    if (upcomingCountdowns.length > 0) {
      upcomingCountdowns.sort((a, b) => a.diffDays - b.diffDays)
      const nearest = upcomingCountdowns[0]
      if (nearest.diffDays === 0) {
        return `今天 (${nearest.days}天)`
      } else if (nearest.diffDays === 1) {
        return `还剩 1 天 (${nearest.days}天)`
      } else {
        return `还剩${nearest.diffDays}天 (${nearest.days}天)`
      }
    } else {
      return '已过'
    }
  }

  const [year, month, day] = anniversary.date.split('-').map(Number)
  const anniversaryDate = new Date(year, month - 1, day)
  anniversaryDate.setHours(0, 0, 0, 0)

  const thisYearAnniversary = new Date(today.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate())

  let diffTime
  if (thisYearAnniversary >= today) {
    diffTime = thisYearAnniversary.getTime() - today.getTime()
  } else {
    const nextYearAnniversary = new Date(today.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate())
    diffTime = nextYearAnniversary.getTime() - today.getTime()
  }

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '还剩 1 天'
  } else {
    return `还剩${diffDays}天`
  }
}

function getAllCountdowns(anniversary) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!anniversary.isCountdownMode || !anniversary.countdownDays || !Array.isArray(anniversary.countdownDays)) {
    return []
  }

  const startDate = parseDate(anniversary.date)
  startDate.setHours(0, 0, 0, 0)

  const countdowns = []
  anniversary.countdownDays.forEach(days => {
    const targetDays = parseInt(days)
    const targetDate = new Date(startDate)
    targetDate.setDate(targetDate.getDate() + targetDays)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let status
    if (diffDays < 0) {
      status = '已过'
    } else if (diffDays === 0) {
      status = '今天'
    } else if (diffDays === 1) {
      status = '还剩 1 天'
    } else {
      status = `还剩${diffDays}天`
    }

    countdowns.push({
      days: targetDays,
      status,
      isPassed: diffDays < 0
    })
  })

  return countdowns
}

module.exports = {
  calculateCountdown,
  getAllCountdowns
}
