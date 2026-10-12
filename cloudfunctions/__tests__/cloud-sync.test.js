const { createCloudMock, setOpenid, setCollectionData } = require('./helpers/mock-cloud')
const { validateDate } = require('../shared/validators')
const { toDateString } = require('../shared/date')

function load(name) {
  jest.resetModules()
  const mockCloud = createCloudMock()
  jest.doMock('wx-server-sdk', () => mockCloud)
  return { main: require(`../${name}/index`).main, mockCloud }
}

test('日期校验拒绝不存在的日期，支持闰年', () => {
  expect(validateDate('2026-02-29')).toBeTruthy()
  expect(validateDate('2026-04-31')).toBeTruthy()
  expect(validateDate('2024-02-29')).toBeNull()
})

test('字符串和北京时间 Date 日期均保持原日', () => {
  expect(toDateString('2026-10-09')).toBe('2026-10-09')
  expect(toDateString(new Date('2026-10-09T00:00:00+08:00'))).toBe('2026-10-09')
  expect(toDateString(null)).toBe('')
})

test('日历查询同时包含字符串和 Date 日期，返回同一个日期分组', async () => {
  const { main, mockCloud } = load('getCalendarData')
  setCollectionData(mockCloud, 'records', [
    { _id: 'string', date: '2026-10-09', content: '旧数据' },
    { _id: 'date', date: new Date('2026-10-09T00:00:00+08:00'), content: 'Date 数据' }
  ])
  const result = await main({ startDate: '2026-10-01', endDate: '2026-10-31' })
  expect(result.success).toBe(true)
  expect(result.recordsByDate['2026-10-09']).toHaveLength(2)
  const query = mockCloud._collections.records._state.whereData
  expect(query.date.__or[0].__gte).toBe('2026-10-01')
  expect(query.date.__or[1].__gte).toEqual(new Date('2026-10-01T00:00:00+08:00'))
  expect(query._openid.__in).toEqual(['test-openid'])
})

test('旧记录首次编辑保存初始版本、元数据和旧编辑日志', async () => {
  const { main, mockCloud } = load('updateRecord')
  setCollectionData(mockCloud, 'records', { _openid: 'test-openid', date: '2026-10-08', content: '原文', images: ['cloud://old'], title: '标题', tags: ['标签'] })
  const result = await main({ recordId: 'legacy', date: '2026-10-09', content: '新文', images: [] })
  expect(result.success).toBe(true)
  const snapshots = mockCloud._collections.recordVersions.add.mock.calls.map(call => call[0].data)
  expect(snapshots).toHaveLength(2)
  expect(snapshots[0]).toMatchObject({ version: 1, content: '原文', images: ['cloud://old'] })
  expect(snapshots[1]).toMatchObject({ version: 2, title: '标题', tags: ['标签'] })
  expect(mockCloud._collections.editLogs.add).toHaveBeenCalled()
  expect(mockCloud.deleteFile).not.toHaveBeenCalled()
})

test('删除记录清理去重后的历史图片、版本和评论', async () => {
  const { main, mockCloud } = load('deleteRecord')
  setCollectionData(mockCloud, 'records', { _openid: 'test-openid', images: ['cloud://current'] })
  setCollectionData(mockCloud, 'recordVersions', [{ images: ['cloud://old', 'cloud://current'] }])
  expect((await main({ recordId: 'record' })).success).toBe(true)
  expect(mockCloud.deleteFile).toHaveBeenCalledWith({ fileList: ['cloud://current', 'cloud://old'] })
  expect(mockCloud._collections.recordVersions.remove).toHaveBeenCalled()
  expect(mockCloud._collections.recordComments.remove).toHaveBeenCalled()
})

test('微信 SDK stats.removed 返回值仍执行版本和评论清理', async () => {
  const { main, mockCloud } = load('deleteRecord')
  setCollectionData(mockCloud, 'records', { _openid: 'test-openid', images: [] })
  mockCloud._collections.records._state.removeResult = { stats: { removed: 1 } }
  expect(await main({ recordId: 'record' })).toMatchObject({ success: true, deleted: true })
  expect(mockCloud._collections.recordVersions.remove).toHaveBeenCalled()
  expect(mockCloud._collections.recordComments.remove).toHaveBeenCalled()
})

test.each(['getMenu', 'voteMenu'])('%s 拒绝通过 ID 操作他人的菜单', async name => {
  const { main, mockCloud } = load(name)
  setCollectionData(mockCloud, 'menus', { _id: 'private', _openid: 'stranger', status: 'voting', candidates: [{ dishId: 'random' }] })
  const result = await main({ menuId: 'private', votes: ['random'] })
  expect(result.success).toBe(false)
  expect(result.error).toMatch(/无权/)
  expect(mockCloud._collections.menuVotes).toBeUndefined()
})

test('单候选菜单创建按情侣范围查重', async () => {
  const { main, mockCloud } = load('createMenu')
  setCollectionData(mockCloud, 'couples', [{ user1Openid: 'test-openid', user2Openid: 'partner' }])
  const result = await main({ date: '2026-10-09', mealType: 'dinner', candidates: [{ dishId: 'random', dishName: '随便' }] })
  expect(result.success).toBe(true)
  expect(mockCloud._collections.menus._state.whereData._openid.__in).toEqual(['test-openid', 'partner'])
})

test('确定 random 菜单不会更新菜品集合', async () => {
  const { main, mockCloud } = load('decideMenu')
  setOpenid(mockCloud, 'owner')
  setCollectionData(mockCloud, 'menus', { _openid: 'owner', status: 'voting', candidates: [{ dishId: 'random' }] })
  expect((await main({ menuId: 'menu', dishId: 'random' })).success).toBe(true)
  expect(mockCloud._collections.dishes).toBeUndefined()
})
