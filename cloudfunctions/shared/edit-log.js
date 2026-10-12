const { toDateString } = require('./date')

// 保留旧客户端 getEditLogs 所使用的修改日志，同时记录新的版本历史。
async function writeEditLog(db, { recordId, recordType, openid, editorName, oldData, newData }) {
  const fieldNames = { date: '日期', content: '内容', images: '图片', title: '标题', tags: '标签', name: '名称', isCountdownMode: '倒数日模式', countdownDays: '倒数天数' }
  const changes = []
  for (const field of Object.keys(newData)) {
    if (!fieldNames[field]) continue
    const oldValue = field === 'date' ? toDateString(oldData[field]) : oldData[field]
    const newValue = field === 'date' ? toDateString(newData[field]) : newData[field]
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, fieldName: fieldNames[field], oldValue: oldValue === undefined ? '' : oldValue, newValue })
    }
  }
  if (!changes.length) return
  await db.collection('editLogs').add({ data: {
    recordId, recordType, editorOpenid: openid, editorName: editorName || '未知用户',
    editTime: new Date(), changes
  } })
}

module.exports = { writeEditLog }
