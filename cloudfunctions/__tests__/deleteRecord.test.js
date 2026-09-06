const { createCloudMock, setOpenid, setCollectionData } = require('./helpers/mock-cloud')

function loadDeleteRecord() {
  jest.resetModules()
  const mockCloud = createCloudMock()
  jest.doMock('wx-server-sdk', () => mockCloud)
  return { main: require('../deleteRecord/index').main, mockCloud }
}

describe('deleteRecord', () => {
  const OWNER_OPENID = 'owner-openid'
  const PARTNER_OPENID = 'partner-openid'
  const OTHER_OPENID = 'other-openid'

  function setupExistingRecord(mockCloud, overrides = {}) {
    setCollectionData(mockCloud, 'records', {
      _id: 'existing-record',
      _openid: OWNER_OPENID,
      images: [],
      ...overrides,
    })
  }

  function setupCouple(mockCloud, user1 = OWNER_OPENID, user2 = PARTNER_OPENID) {
    setCollectionData(mockCloud, 'couples', [{ user1Openid: user1, user2Openid: user2, isActive: true }])
  }

  test('所有者删除成功', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud)

    const result = await main({ recordId: 'existing-record' }, {})

    expect(result.success).toBe(true)
    expect(result.deleted).toBe(true)

    const recordsCollection = mockCloud.database().collection('records')
    expect(recordsCollection.doc('existing-record').remove).toHaveBeenCalledTimes(1)
  })

  test('情侣方删除成功', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, PARTNER_OPENID)
    setupExistingRecord(mockCloud)
    setupCouple(mockCloud)

    const result = await main({ recordId: 'existing-record' }, {})

    expect(result.success).toBe(true)
    expect(result.deleted).toBe(true)
  })

  test('无权限者删除失败', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, OTHER_OPENID)
    setupExistingRecord(mockCloud)
    setCollectionData(mockCloud, 'couples', [])

    const result = await main({ recordId: 'existing-record' }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('无权删除此记录')
  })

  test('校验失败：recordId 为空', async () => {
    const { main } = loadDeleteRecord()

    const result = await main({ recordId: '' }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('记录 ID 无效')
  })

  test('校验失败：recordId 非字符串', async () => {
    const { main } = loadDeleteRecord()

    const result = await main({ recordId: null }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('记录 ID 无效')
  })

  test('校验失败：记录不存在', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setCollectionData(mockCloud, 'records', null)

    const result = await main({ recordId: 'nonexistent' }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('记录不存在')
  })

  test('删除含图片记录时调用 deleteImages', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud, { images: ['cloud://img1.png', 'cloud://img2.png'] })

    await main({ recordId: 'existing-record' }, {})

    expect(mockCloud.callFunction).toHaveBeenCalledTimes(1)
    expect(mockCloud.callFunction.mock.calls[0][0].name).toBe('deleteImages')
    expect(mockCloud.callFunction.mock.calls[0][0].data.imageUrls).toEqual(['cloud://img1.png', 'cloud://img2.png'])
  })

  test('删除无图片记录时不调用 deleteImages', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud, { images: [] })

    await main({ recordId: 'existing-record' }, {})

    expect(mockCloud.callFunction).not.toHaveBeenCalled()
  })

  test('图片删除失败不影响主流程', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, OWNER_OPENID)
    setupExistingRecord(mockCloud, { images: ['cloud://img1.png'] })
    mockCloud.callFunction.mockRejectedValueOnce(new Error('图片删除失败'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = await main({ recordId: 'existing-record' }, {})
    consoleSpy.mockRestore()

    expect(result.success).toBe(true)
    expect(result.deleted).toBe(true)
  })

  test('无情侣关系时仅所有者可删除', async () => {
    const { main, mockCloud } = loadDeleteRecord()
    setOpenid(mockCloud, PARTNER_OPENID)
    setupExistingRecord(mockCloud)
    setCollectionData(mockCloud, 'couples', [])

    const result = await main({ recordId: 'existing-record' }, {})

    expect(result.success).toBe(false)
    expect(result.error).toBe('无权删除此记录')
  })
})
