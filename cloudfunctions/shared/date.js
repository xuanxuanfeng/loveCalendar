// 新数据使用 YYYY-MM-DD，读取时兼容旧的北京时间 Date 字段。
function toDateString(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10)
}

function dateRangeCondition(command, startDate, endDate) {
  return command.or([
    command.gte(startDate).and(command.lte(endDate)),
    command.gte(new Date(`${startDate}T00:00:00+08:00`))
      .and(command.lte(new Date(`${endDate}T23:59:59.999+08:00`)))
  ])
}

module.exports = { toDateString, dateRangeCondition }
