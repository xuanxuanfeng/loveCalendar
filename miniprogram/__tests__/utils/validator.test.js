const { isValidDate, isValidContent, isValidImages, isValidName } = require('../../utils/validator')

describe('isValidDate', () => {
  test('合法日期通过', () => {
    expect(isValidDate('2024-01-15')).toBe(true)
  })

  test('闰年2月29日通过', () => {
    expect(isValidDate('2024-02-29')).toBe(true)
  })

  test('非闰年2月29日拒绝', () => {
    expect(isValidDate('2023-02-29')).toBe(false)
  })

  test('格式错误拒绝', () => {
    expect(isValidDate('2024/01/15')).toBe(false)
    expect(isValidDate('2024-1-15')).toBe(false)
    expect(isValidDate('not-a-date')).toBe(false)
  })

  test('空字符串拒绝', () => {
    expect(isValidDate('')).toBe(false)
  })

  test('13月拒绝', () => {
    expect(isValidDate('2024-13-01')).toBe(false)
  })
})

describe('isValidContent', () => {
  test('合法内容通过', () => {
    expect(isValidContent('这是一段内容')).toBe(true)
  })

  test('空字符串通过', () => {
    expect(isValidContent('')).toBe(true)
  })

  test('非字符串拒绝', () => {
    expect(isValidContent(123)).toBe(false)
    expect(isValidContent(null)).toBe(false)
    expect(isValidContent(undefined)).toBe(false)
  })

  test('超过默认最大长度拒绝', () => {
    expect(isValidContent('a'.repeat(1001))).toBe(false)
  })

  test('自定义最大长度', () => {
    expect(isValidContent('abc', 3)).toBe(true)
    expect(isValidContent('abcd', 3)).toBe(false)
  })
})

describe('isValidImages', () => {
  test('合法数组通过', () => {
    expect(isValidImages(['a.png', 'b.png'])).toBe(true)
  })

  test('空数组通过', () => {
    expect(isValidImages([])).toBe(true)
  })

  test('非数组拒绝', () => {
    expect(isValidImages('not-array')).toBe(false)
    expect(isValidImages(null)).toBe(false)
  })

  test('超过默认9张拒绝', () => {
    const arr = Array(10).fill('img.png')
    expect(isValidImages(arr)).toBe(false)
  })

  test('自定义最大数量', () => {
    expect(isValidImages(['a', 'b'], 2)).toBe(true)
    expect(isValidImages(['a', 'b', 'c'], 2)).toBe(false)
  })
})

describe('isValidName', () => {
  test('合法名称通过', () => {
    expect(isValidName('纪念日')).toBe(true)
  })

  test('纯空格拒绝', () => {
    expect(isValidName('   ')).toBe(false)
  })

  test('空字符串拒绝', () => {
    expect(isValidName('')).toBe(false)
  })

  test('非字符串拒绝', () => {
    expect(isValidName(123)).toBe(false)
    expect(isValidName(null)).toBe(false)
  })

  test('超过50字符拒绝', () => {
    expect(isValidName('a'.repeat(51))).toBe(false)
  })

  test('恰好50字符通过', () => {
    expect(isValidName('a'.repeat(50))).toBe(true)
  })
})
