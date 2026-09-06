function createCollectionMock() {
  const collectionState = {
    whereData: null,
    docId: null,
    rawData: null,
    addResult: null,
    updateResult: null,
    removeResult: null,
  }
  const docCache = {}

  const chain = {
    where(query) {
      collectionState.whereData = query
      return chain
    },
    doc(id) {
      collectionState.docId = id
      if (!docCache[id]) {
        docCache[id] = {
          get: jest.fn().mockImplementation(() => {
            const raw = collectionState.rawData
            if (raw === null || raw === undefined) return Promise.resolve({ data: null })
            if (Array.isArray(raw)) return Promise.resolve({ data: raw[0] || null })
            return Promise.resolve({ data: raw })
          }),
          update: jest.fn().mockImplementation((opts) => {
            return Promise.resolve(collectionState.updateResult || { updated: 1 })
          }),
          remove: jest.fn().mockImplementation(() => {
            return Promise.resolve(collectionState.removeResult || { deleted: 1 })
          }),
        }
      }
      return docCache[id]
    },
    get: jest.fn().mockImplementation(() => {
      const raw = collectionState.rawData
      if (raw === null || raw === undefined) return Promise.resolve({ data: [] })
      if (Array.isArray(raw)) return Promise.resolve({ data: raw })
      return Promise.resolve({ data: [raw] })
    }),
    add: jest.fn().mockImplementation((opts) => {
      return Promise.resolve(collectionState.addResult || { _id: 'mock-id-' + Date.now() })
    }),
    update: jest.fn().mockImplementation((opts) => {
      return Promise.resolve(collectionState.updateResult || { updated: 1 })
    }),
    _state: collectionState,
  }

  return chain
}

function createCloudMock() {
  const collections = {}
  const cloudMock = {
    DYNAMIC_CURRENT_ENV: 'mock-env',
    init: jest.fn(),
    getWXContext: jest.fn().mockReturnValue({
      OPENID: 'test-openid',
      UNIONID: 'test-unionid',
    }),
    database: jest.fn().mockReturnValue({
      command: {
        inc: jest.fn((val) => ({ __inc: val })),
        set: jest.fn((val) => ({ __set: val })),
      },
      collection: jest.fn((name) => {
        if (!collections[name]) {
          collections[name] = createCollectionMock()
        }
        return collections[name]
      }),
    }),
    deleteFile: jest.fn().mockResolvedValue({ fileList: [] }),
    callFunction: jest.fn().mockResolvedValue({ result: {} }),
    _collections: collections,
  }

  return cloudMock
}

function setOpenid(mockCloud, openid) {
  mockCloud.getWXContext.mockReturnValue({
    OPENID: openid,
    UNIONID: 'test-unionid',
  })
}

function setCollectionData(cloudMock, collectionName, data) {
  const collection = cloudMock._collections[collectionName] || cloudMock.database().collection(collectionName)
  collection._state.rawData = data
}

function setCollectionAddResult(cloudMock, collectionName, result) {
  const collection = cloudMock._collections[collectionName] || cloudMock.database().collection(collectionName)
  collection._state.addResult = result
}

module.exports = {
  createCloudMock,
  setOpenid,
  setCollectionData,
  setCollectionAddResult,
  createCollectionMock,
}
