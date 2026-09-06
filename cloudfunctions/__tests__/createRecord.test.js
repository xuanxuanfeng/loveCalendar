const { createCloudMock, setOpenid, setCollectionData, setCollectionAddResult } = require('./helpers/mock-cloud')

function loadCreateRecord() {
  jest.resetModules()
  const mockCloud = createCloudMock()
  jest.doMock('wx-server-sdk', () => mockCloud)
  return { main: require('../createRecord/index').main, mockCloud }
}

describe('createRecord', () => {
  test('创建成功：含内容和图片', async () => {
    const { main, mockCloud } = loadCreateRecord()
    setCollectionData(mockCloud, 'users', [{ profile: { nickname: '测试用户', avatar: 'cloud://avatar.png' } }])
    setCollectionAddResult(mockCloud, 'records', { _id: 'new-record-id' })

    const result = await main({
      date: '2026-09-06',
      content: '今天的记录',
      images: ['cloud://img1.png']
    }, {})

    expect(result.success).toBe(true)
    expect(result.recordIds).toEqual(['new-record-id'])
    expect(result.message).toBe('记录创建成功')

    const recordsCollection = mockCloud.database().collection('records')
    expect(recordsCollection.add).toHaveBeenCalledTimes(1)
    const addData = recordsCollection.add.mock.calls[0][0].data
    expect(addData.date).toEqual(new Date('2026-09-06T00:00:00+08:00'))
    expect(addData.content).toBe('今天的记录')
    expect(addData.images).toEqual(['cloud://img1.png'])
    expect(addData.version).toBe(1)
    expect(addData.editCount).toBe(0)
  })

  test('创建成功：仅内容无图片', async () => {
    const { main, mockCloud } = loadCreateRecord()
    setCollectionData(mockCloud, 'users', [])
    setCollectionAddResult(mockCloud, 'records', { _id: 'record-2' })

    const result = await main({
      date: '2026-09-06',
      content: '纯文字记录',
      images: []
    }, {})

    expect(result.success).toBe(true)
    expect(result.recordIds).toEqual(['record-2'])
  })

  test('校验失败：日期格式错误', async () => {
    const { main } = loadCreateRecord()

    const result = await main({
      date: '2026/09/06',
      content: '内容',
      images: []
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/日期/)
  })

  test('校验失败：内容超长', async () => {
    const { main } = loadCreateRecord()

    const result = await main({
      date: '2026-09-06',
      content: 'a'.repeat(1001),
      images: []
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/内容/)
  })

  test('校验失败：图片超过9张', async () => {
    const { main } = loadCreateRecord()
    const images = Array.from({ length: 10 }, (_, i) => `cloud://img${i}.png`)

    const result = await main({
      date: '2026-09-06',
      content: '',
      images
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/图片/)
  })

  test('校验失败：内容和图片都为空', async () => {
    const { main } = loadCreateRecord()

    const result = await main({
      date: '2026-09-06',
      content: '',
      images: []
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('请输入内容或添加图片')
  })

  test('校验失败：图片 URL 不含 cloud:// 前缀', async () => {
    const { main } = loadCreateRecord()

    const result = await main({
      date: '2026-09-06',
      content: '内容',
      images: ['https://example.com/img.png']
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/图片/)
  })

  test('创建版本记录', async () => {
    const { main, mockCloud } = loadCreateRecord()
    setCollectionData(mockCloud, 'users', [])
    setCollectionAddResult(mockCloud, 'records', { _id: 'rec-1' })

    await main({ date: '2026-09-06', content: '测试', images: [] }, {})

    const versionsCollection = mockCloud.database().collection('recordVersions')
    expect(versionsCollection.add).toHaveBeenCalledTimes(1)
    const versionData = versionsCollection.add.mock.calls[0][0].data
    expect(versionData.recordId).toBe('rec-1')
    expect(versionData.version).toBe(1)
    expect(versionData.changeType).toBe('create')
  })

  test('异常处理：数据库操作抛出异常', async () => {
    const { main, mockCloud } = loadCreateRecord()
    setCollectionData(mockCloud, 'users', [])
    mockCloud.database().collection('records').add.mockRejectedValueOnce(new Error('数据库错误'))

    const result = await main({ date: '2026-09-06', content: '测试', images: [] }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('数据库错误')
  })
})
