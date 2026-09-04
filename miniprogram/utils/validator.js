// utils/validator.js - 输入校验工具

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

function isValidContent(content, maxLen = 1000) {
  if (typeof content !== 'string') return false
  return content.length <= maxLen
}

function isValidImages(images, maxCount = 9) {
  if (!Array.isArray(images)) return false
  return images.length <= maxCount
}

function isValidName(name) {
  if (typeof name !== 'string') return false
  return name.trim().length > 0 && name.length <= 50
}

module.exports = {
  isValidDate,
  isValidContent,
  isValidImages,
  isValidName
}
