const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const NAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9\s]{1,30}$/

const MAX_CONTENT_LENGTH = 1000
const MAX_IMAGES = 9
const MAX_NAME_LENGTH = 50
const MAX_COUNTDOWN_DAYS = 20
const MAX_COMMENT_LENGTH = 500

const CATEGORIES = ['家常菜', '硬菜', '汤', '主食', '小吃', '饮品']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

module.exports = {
  DATE_REGEX,
  NAME_REGEX,
  MAX_CONTENT_LENGTH,
  MAX_IMAGES,
  MAX_NAME_LENGTH,
  MAX_COUNTDOWN_DAYS,
  MAX_COMMENT_LENGTH,
  CATEGORIES,
  DIFFICULTIES,
  MEAL_TYPES
}
