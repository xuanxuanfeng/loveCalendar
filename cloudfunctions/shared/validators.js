const {
  DATE_REGEX,
  NAME_REGEX,
  MAX_CONTENT_LENGTH,
  MAX_IMAGES,
  MAX_NAME_LENGTH,
  MAX_COUNTDOWN_DAYS,
  MAX_COMMENT_LENGTH,
  CATEGORIES,
  DIFFICULTIES
} = require('./constants')

function validateDate(date) {
  if (!date || !DATE_REGEX.test(date)) {
    return '日期格式无效，应为 YYYY-MM-DD'
  }
  return null
}

function validateRecordFields(content, images) {
  if (content !== undefined && content !== null) {
    if (typeof content !== 'string' || content.length > MAX_CONTENT_LENGTH) {
      return `内容不能超过${MAX_CONTENT_LENGTH}字`
    }
  }
  if (images !== undefined && images !== null) {
    if (!Array.isArray(images) || images.length > MAX_IMAGES) {
      return `图片数量不能超过${MAX_IMAGES}张`
    }
    for (const url of images) {
      if (typeof url !== 'string' || !url.startsWith('cloud://')) {
        return '包含无效的图片地址'
      }
    }
  }
  return null
}

function validateAnniversaryFields(name, countdownDays, isCountdownMode) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return '纪念日名称不能为空'
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return `名称不能超过${MAX_NAME_LENGTH}字`
  }
  if (isCountdownMode && countdownDays) {
    if (!Array.isArray(countdownDays) || countdownDays.length > MAX_COUNTDOWN_DAYS) {
      return `倒数日数量不能超过${MAX_COUNTDOWN_DAYS}个`
    }
    for (const d of countdownDays) {
      const num = parseInt(d)
      if (isNaN(num) || num < 1) {
        return '倒数日天数必须为正整数'
      }
    }
  }
  return null
}

function validateDishName(name) {
  if (!name || typeof name !== 'string' || !NAME_REGEX.test(name.trim())) {
    return '菜品名称不合法（1-30字，仅中英文数字）'
  }
  return null
}

function validateDishCategory(category) {
  if (!category || !CATEGORIES.includes(category)) {
    return '分类不合法'
  }
  return null
}

function validateDishDifficulty(difficulty) {
  if (difficulty && !DIFFICULTIES.includes(difficulty)) {
    return '难度不合法'
  }
  return null
}

function validateCommentContent(content) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return '评论内容不能为空'
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return `评论内容不能超过${MAX_COMMENT_LENGTH}字`
  }
  return null
}

function validateCloudUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('cloud://')) {
    return '图片地址不合法'
  }
  return null
}

module.exports = {
  validateDate,
  validateRecordFields,
  validateAnniversaryFields,
  validateDishName,
  validateDishCategory,
  validateDishDifficulty,
  validateCommentContent,
  validateCloudUrl
}
