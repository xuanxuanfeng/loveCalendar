const {
  formatDate,
  getTodayStr,
  parseDate,
  formatDisplayDate,
  formatDisplayDateFull,
  formatDisplayDateWithWeekday,
  formatTime,
  getFirstDayOfMonth,
  getLastDayOfMonth
} = require('../../../miniprogram/utils/date')

describe('formatDate', () => {
  test('格式化为 YYYY-MM-DD', () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  test('补零月和日', () => {
    expect(formatDate(new Date(2024, 2, 9))).toBe('2024-03-09')
  })

  test('12月正确格式化', () => {
    expect(formatDate(new Date(2024, 11, 31))).toBe('2024-12-31')
  })
})

describe('getTodayStr', () => {
  test('返回今天的日期字符串', () => {
    const result = getTodayStr()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const parsed = new Date(result)
    const today = new Date()
    expect(parsed.getFullYear()).toBe(today.getFullYear())
    expect(parsed.getMonth()).toBe(today.getMonth())
    expect(parsed.getDate()).toBe(today.getDate())
  })
})

describe('parseDate', () => {
  test('解析 YYYY-MM-DD 字符串为本地时间', () => {
    const d = parseDate('2024-06-15')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(15)
  })

  test('空值返回今天', () => {
    const d = parseDate(null)
    const today = new Date()
    expect(d.getFullYear()).toBe(today.getFullYear())
    expect(d.getMonth()).toBe(today.getMonth())
    expect(d.getDate()).toBe(today.getDate())
  })

  test('非字符串直接构造 Date', () => {
    const ts = new Date(2024, 5, 1).getTime()
    const d = parseDate(ts)
    expect(d.getFullYear()).toBe(2024)
  })
})

describe('formatDisplayDate', () => {
  test('格式化为 M月D日', () => {
    expect(formatDisplayDate('2024-03-08')).toBe('3月8日')
  })

  test('空字符串返回空', () => {
    expect(formatDisplayDate('')).toBe('')
  })

  test('null 返回空', () => {
    expect(formatDisplayDate(null)).toBe('')
  })
})

describe('formatDisplayDateFull', () => {
  test('包含年月日和星期', () => {
    const result = formatDisplayDateFull('2024-01-01')
    expect(result).toMatch(/2024年1月1日 周/)
  })

  test('空值返回空', () => {
    expect(formatDisplayDateFull('')).toBe('')
  })
})

describe('formatDisplayDateWithWeekday', () => {
  test('格式化为 M月D日 周X', () => {
    const result = formatDisplayDateWithWeekday('2024-06-10')
    expect(result).toMatch(/6月10日 周/)
  })

  test('空值返回空', () => {
    expect(formatDisplayDateWithWeekday(null)).toBe('')
  })
})

describe('formatTime', () => {
  test('格式化时间为 HH:MM', () => {
    const d = new Date(2024, 0, 1, 9, 5)
    expect(formatTime(d)).toBe('09:05')
  })

  test('空值返回空', () => {
    expect(formatTime(null)).toBe('')
  })

  test('下午时间正确', () => {
    const d = new Date(2024, 0, 1, 14, 30)
    expect(formatTime(d)).toBe('14:30')
  })
})

describe('getFirstDayOfMonth', () => {
  test('返回月份第一天', () => {
    expect(getFirstDayOfMonth(2024, 3)).toBe('2024-03-01')
  })

  test('补零月份', () => {
    expect(getFirstDayOfMonth(2024, 11)).toBe('2024-11-01')
  })
})

describe('getLastDayOfMonth', () => {
  test('普通月30天', () => {
    expect(getLastDayOfMonth(2024, 6)).toBe('2024-06-30')
  })

  test('31天的月', () => {
    expect(getLastDayOfMonth(2024, 1)).toBe('2024-01-31')
  })

  test('闰年2月29天', () => {
    expect(getLastDayOfMonth(2024, 2)).toBe('2024-02-29')
  })

  test('非闰年2月28天', () => {
    expect(getLastDayOfMonth(2023, 2)).toBe('2023-02-28')
  })
})
