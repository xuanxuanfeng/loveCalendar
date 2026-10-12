const { calculateCountdown, getAllCountdowns } = require('../../../miniprogram/utils/countdown')

function daysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('calculateCountdown — 标准模式', () => {
  test('今天的纪念日显示"今天"', () => {
    const ann = { date: daysFromNow(0), isCountdownMode: false }
    expect(calculateCountdown(ann)).toBe('今天')
  })

  test('明天的纪念日显示"还剩 1 天"', () => {
    const ann = { date: daysFromNow(1), isCountdownMode: false }
    expect(calculateCountdown(ann)).toBe('还剩 1 天')
  })

  test('多天后显示"还剩N天"', () => {
    const ann = { date: daysFromNow(30), isCountdownMode: false }
    expect(calculateCountdown(ann)).toBe('还剩30天')
  })

  test('已过去的纪念日计算明年', () => {
    const ann = { date: daysFromNow(-10), isCountdownMode: false }
    const result = calculateCountdown(ann)
    expect(result).toMatch(/^还剩\d+天$/)
  })
})

describe('calculateCountdown — 倒数日模式', () => {
  test('倒数日今天到达显示"今天"', () => {
    const startDate = daysFromNow(-100)
    const ann = {
      date: startDate,
      isCountdownMode: true,
      countdownDays: [100]
    }
    expect(calculateCountdown(ann)).toBe('今天 (100天)')
  })

  test('倒数日明天到达显示"还剩 1 天"', () => {
    const startDate = daysFromNow(-99)
    const ann = {
      date: startDate,
      isCountdownMode: true,
      countdownDays: [100]
    }
    expect(calculateCountdown(ann)).toBe('还剩 1 天 (100天)')
  })

  test('多个倒数日取最近的', () => {
    const startDate = daysFromNow(-90)
    const ann = {
      date: startDate,
      isCountdownMode: true,
      countdownDays: [100, 200]
    }
    const result = calculateCountdown(ann)
    expect(result).toContain('100天')
  })

  test('所有倒数日已过显示"已过"', () => {
    const startDate = daysFromNow(-200)
    const ann = {
      date: startDate,
      isCountdownMode: true,
      countdownDays: [50, 100]
    }
    expect(calculateCountdown(ann)).toBe('已过')
  })
})

describe('getAllCountdowns', () => {
  test('非倒数日模式返回空数组', () => {
    const ann = { date: daysFromNow(0), isCountdownMode: false }
    expect(getAllCountdowns(ann)).toEqual([])
  })

  test('返回每个倒数日的状态', () => {
    const startDate = daysFromNow(-100)
    const ann = {
      date: startDate,
      isCountdownMode: true,
      countdownDays: [50, 100, 200]
    }
    const result = getAllCountdowns(ann)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ days: 50, status: '已过', isPassed: true })
    expect(result[1]).toEqual({ days: 100, status: '今天', isPassed: false })
    expect(result[2].status).toMatch(/^还剩\d+天$/)
    expect(result[2].isPassed).toBe(false)
  })

  test('缺少 countdownDays 返回空数组', () => {
    const ann = { date: daysFromNow(0), isCountdownMode: true }
    expect(getAllCountdowns(ann)).toEqual([])
  })
})
