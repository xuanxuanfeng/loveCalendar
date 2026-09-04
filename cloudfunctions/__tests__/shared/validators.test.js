const {
  validateDate,
  validateRecordFields,
  validateAnniversaryFields,
  validateDishName,
  validateDishCategory,
  validateDishDifficulty,
  validateCommentContent,
  validateCloudUrl
} = require('../../shared/validators')

describe('validateDate', () => {
  test('合法日期返回 null', () => {
    expect(validateDate('2024-01-15')).toBeNull()
  })

  test('空值返回错误', () => {
    expect(validateDate('')).toBeTruthy()
    expect(validateDate(null)).toBeTruthy()
  })

  test('格式错误返回错误', () => {
    expect(validateDate('2024/01/15')).toBeTruthy()
  })
})

describe('validateRecordFields', () => {
  test('合法内容和图片返回 null', () => {
    expect(validateRecordFields('内容', ['cloud://a.png'])).toBeNull()
  })

  test('内容超长返回错误', () => {
    expect(validateRecordFields('a'.repeat(1001), [])).toBeTruthy()
  })

  test('图片超过9张返回错误', () => {
    const imgs = Array(10).fill('cloud://a.png')
    expect(validateRecordFields('', imgs)).toBeTruthy()
  })

  test('图片URL非cloud协议返回错误', () => {
    expect(validateRecordFields('', ['https://bad.png'])).toBeTruthy()
  })

  test('null/undefined 内容和图片返回 null', () => {
    expect(validateRecordFields(null, null)).toBeNull()
    expect(validateRecordFields(undefined, undefined)).toBeNull()
  })
})

describe('validateAnniversaryFields', () => {
  test('合法名称返回 null', () => {
    expect(validateAnniversaryFields('纪念日', null, false)).toBeNull()
  })

  test('空名称返回错误', () => {
    expect(validateAnniversaryFields('', null, false)).toBeTruthy()
    expect(validateAnniversaryFields('   ', null, false)).toBeTruthy()
  })

  test('名称超长返回错误', () => {
    expect(validateAnniversaryFields('a'.repeat(51), null, false)).toBeTruthy()
  })

  test('倒数日数量超限返回错误', () => {
    const days = Array(21).fill(100)
    expect(validateAnniversaryFields('纪念日', days, true)).toBeTruthy()
  })

  test('倒数日非正整数返回错误', () => {
    expect(validateAnniversaryFields('纪念日', [0], true)).toBeTruthy()
    expect(validateAnniversaryFields('纪念日', [-1], true)).toBeTruthy()
  })

  test('合法倒数日返回 null', () => {
    expect(validateAnniversaryFields('纪念日', [100, 200], true)).toBeNull()
  })
})

describe('validateDishName', () => {
  test('合法名称返回 null', () => {
    expect(validateDishName('番茄炒蛋')).toBeNull()
    expect(validateDishName('Pizza')).toBeNull()
  })

  test('空名称返回错误', () => {
    expect(validateDishName('')).toBeTruthy()
  })

  test('特殊字符返回错误', () => {
    expect(validateDishName('番茄@#')).toBeTruthy()
  })
})

describe('validateDishCategory', () => {
  test('合法分类返回 null', () => {
    expect(validateDishCategory('家常菜')).toBeNull()
  })

  test('非法分类返回错误', () => {
    expect(validateDishCategory('其他')).toBeTruthy()
  })
})

describe('validateDishDifficulty', () => {
  test('合法难度返回 null', () => {
    expect(validateDishDifficulty('easy')).toBeNull()
  })

  test('非法难度返回错误', () => {
    expect(validateDishDifficulty('extreme')).toBeTruthy()
  })

  test('空值返回 null（可选字段）', () => {
    expect(validateDishDifficulty('')).toBeNull()
    expect(validateDishDifficulty(null)).toBeNull()
  })
})

describe('validateCommentContent', () => {
  test('合法评论返回 null', () => {
    expect(validateCommentContent('好棒')).toBeNull()
  })

  test('空评论返回错误', () => {
    expect(validateCommentContent('')).toBeTruthy()
    expect(validateCommentContent('   ')).toBeTruthy()
  })

  test('超长评论返回错误', () => {
    expect(validateCommentContent('a'.repeat(501))).toBeTruthy()
  })
})

describe('validateCloudUrl', () => {
  test('cloud:// 协议返回 null', () => {
    expect(validateCloudUrl('cloud://env.xxx/img.png')).toBeNull()
  })

  test('非 cloud:// 协议返回错误', () => {
    expect(validateCloudUrl('https://example.com/img.png')).toBeTruthy()
  })

  test('非字符串返回错误', () => {
    expect(validateCloudUrl(123)).toBeTruthy()
  })
})
