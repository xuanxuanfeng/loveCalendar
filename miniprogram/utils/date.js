// utils/date.js - 日期工具函数（统一本地时间处理，避免时区问题）

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayStr() {
  return formatDate(new Date())
}

function parseDate(dateStr) {
  if (!dateStr) return new Date()
  if (typeof dateStr === 'string') {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateStr)
}

function formatDisplayDate(dateString) {
  if (!dateString) return ''
  const date = parseDate(dateString)
  const monthNum = date.getMonth() + 1
  const dayNum = date.getDate()
  return `${monthNum}月${dayNum}日`
}

function formatDisplayDateFull(dateString) {
  if (!dateString) return ''
  const date = parseDate(dateString)
  const yearNum = date.getFullYear()
  const monthNum = date.getMonth() + 1
  const dayNum = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${yearNum}年${monthNum}月${dayNum}日 周${weekday}`
}

function formatDisplayDateWithWeekday(dateString) {
  if (!dateString) return ''
  const date = parseDate(dateString)
  const monthNum = date.getMonth() + 1
  const dayNum = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${monthNum}月${dayNum}日 周${weekday}`
}

function formatTime(timeInput) {
  if (!timeInput) return ''
  const date = new Date(timeInput)
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${hour}:${minute}`
}

function formatDateTime(timeInput) {
  if (!timeInput) return ''
  const date = new Date(timeInput)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

function getFirstDayOfMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function getLastDayOfMonth(year, month) {
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

module.exports = {
  formatDate,
  getTodayStr,
  parseDate,
  formatDisplayDate,
  formatDisplayDateFull,
  formatDisplayDateWithWeekday,
  formatTime,
  formatDateTime,
  getFirstDayOfMonth,
  getLastDayOfMonth
}
