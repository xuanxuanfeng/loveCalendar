const { createCloudMock, setOpenid, setCollectionData } = require('./helpers/mock-cloud')

function loadUpdateRecord() {
  jest.resetModules()
  const mockCloud = createCloudMock()
  jest.doMock('wx-server-sdk', () => mockCloud)
  return { main: require('../updateRecord/index').main, mockCloud }
}

describe('updateRecord', () => {
  const OWNER_OPENID = 'owner-openid'
  const PARTNER_OPENID = 'partner-openid'
  const OTHER_OPENID = 'other-openid'

  function setupExistingRecord(mockCloud, overrides = {}) {
    setCollectionData(mockCloud, 'records', {
      _id: 'existing-record',
      _openid: OWNER_OPENID,
      content: '原始内容',
      images: ['cloud://old1.png', 'cloud://old2.png'],
      version: 1,
      ...overrides,
    })
  }

  function setupUserProfile(mockCloud) {
    setCollectionData(mockCloud, 'users', [{ profile: { nickname: '编辑者', avatar: 'cloud://avatar.png' } }])
  }

  function setupCouple(mockCloud, user1 = OWNER_OPENID, user2 = PARTNER_OPENID) {
    setCollectionData(mockCloud, 'couples', [{ user1Openid: user1, user2Openid: user2, isActive: true }])
  }

  test('所有者更新成功', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud)
    setupUserProfile(mockCloud)

    const result = await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '更新后的内容',
      images: ['cloud://old1.png', 'cloud://old2.png'],
    }, {})

    expect(result.success).toBe(true)
    expect(result.updated).toBe(true)

    const recordsCollection = mockCloud.database().collection('records')
    expect(recordsCollection.doc('existing-record').update).toHaveBeenCalledTimes(1)
  })

  test('情侣方更新成功', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, PARTNER_OPENID)
    setupExistingRecord(mockCloud)
    setupUserProfile(mockCloud)
    setupCouple(mockCloud)

    const result = await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '情侣更新',
      images: [],
    }, {})

    expect(result.success).toBe(true)
    expect(result.updated).toBe(true)
  })

  test('无权限者更新失败', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OTHER_OPENID)
    setupExistingRecord(mockCloud)
    setCollectionData(mockCloud, 'couples', [])

    const result = await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '非法更新',
      images: [],
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('无权修改此记录')
  })

  test('校验失败：recordId 为空', async () => {
    const { main } = loadUpdateRecord()

    const result = await main({
      recordId: '',
      date: '2026-09-06',
      content: '内容',
      images: [],
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('记录 ID 无效')
  })

  test('校验失败：recordId 非字符串', async () => {
    const { main } = loadUpdateRecord()

    const result = await main({
      recordId: 123,
      date: '2026-09-06',
      content: '内容',
      images: [],
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('记录 ID 无效')
  })

  test('校验失败：记录不存在', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setCollectionData(mockCloud, 'records', null)

    const result = await main({
      recordId: 'nonexistent',
      date: '2026-09-06',
      content: '内容',
      images: [],
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('记录不存在')
  })

  test('校验失败：日期格式错误', async () => {
    const { main } = loadUpdateRecord()

    const result = await main({
      recordId: 'existing-record',
      date: '20260906',
      content: '内容',
      images: [],
    }, {})

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/日期/)
  })

  test('版本号和编辑计数递增', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud, { version: 3 })
    setupUserProfile(mockCloud)

    await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '新版本',
      images: [],
    }, {})

    const recordsCollection = mockCloud.database().collection('records')
    const updateCall = recordsCollection.doc('existing-record').update.mock.calls[0][0]
    expect(updateCall.data.version).toBe(4)
    expect(updateCall.data.editCount).toEqual({ __inc: 1 })
  })

  test('创建版本记录含 changeNote', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud)
    setupUserProfile(mockCloud)

    await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '更新',
      images: [],
      changeNote: '修正错别字',
    }, {})

    const versionsCollection = mockCloud.database().collection('recordVersions')
    expect(versionsCollection.add).toHaveBeenCalledTimes(1)
    const versionData = versionsCollection.add.mock.calls[0][0].data
    expect(versionData.changeType).toBe('edit')
    expect(versionData.changeNote).toBe('修正错别字')
  })

  test('changeNote 截断到100字符', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud)
    setupUserProfile(mockCloud)

    const longNote = 'a'.repeat(150)
    await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '更新',
      images: [],
      changeNote: longNote,
    }, {})

    const versionsCollection = mockCloud.database().collection('recordVersions')
    const versionData = versionsCollection.add.mock.calls[0][0].data
    expect(versionData.changeNote.length).toBe(100)
  })

  test('清理被移除的旧图片', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud, { images: ['cloud://old1.png', 'cloud://old2.png'] })
    setupUserProfile(mockCloud)

    await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '更新',
      images: ['cloud://old1.png'],
    }, {})

    expect(mockCloud.deleteFile).toHaveBeenCalledTimes(1)
    expect(mockCloud.deleteFile.mock.calls[0][0].fileList).toEqual(['cloud://old2.png'])
  })

  test('无图片变更时不调用 deleteFile', async () => {
    const { main, mockCloud } = loadUpdateRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud, { images: ['cloud://same.png'] })
    setupUserProfile(mockCloud)

    await main({
      recordId: 'existing-record',
      date: '2026-09-06',
      content: '更新',
      images: ['cloud://same.png'],
    }, {})

    expect(mockCloud.deleteFile).not.toHaveBeenCalled()
  })
})
