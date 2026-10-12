const simulate = require('miniprogram-simulate')
const path = require('path')

// 按组件方式渲染页面模板，验证嵌套循环生成的真实 dataset 和事件冒泡。
let pageDefinition
const originalPage = global.Page
global.Page = definition => {
  pageDefinition = definition
  const { data, ...methods } = definition
  Component({ data, methods })
}
const pageId = simulate.load(path.resolve(__dirname, '../../../miniprogram/pages/day-detail/day-detail'), {
  rootPath: path.resolve(__dirname, '../../../miniprogram')
})
global.Page = originalPage

describe('日详情图片预览', () => {
  let originalPreview
  let originalNavigate

  beforeEach(() => {
    originalPreview = wx.previewImage
    originalNavigate = wx.navigateTo
    wx.previewImage = jest.fn()
    wx.navigateTo = jest.fn()
  })

  afterEach(() => {
    wx.previewImage = originalPreview
    wx.navigateTo = originalNavigate
  })

  test('点击不同记录的图片使用各自列表，且不触发详情跳转', async () => {
    const page = simulate.render(pageId)
    page.attach(document.createElement('div'))
    const firstImages = ['cloud://first', 'cloud://second']
    const secondImages = ['cloud://other']
    page.setData({ records: [
      { _id: 'first', images: firstImages },
      { _id: 'second', images: secondImages }
    ] })
    const images = page.querySelectorAll('.record-image')
    expect(images).toHaveLength(3)
    for (const image of images) {
      image.dispatchEvent('tap', { bubbles: true })
      await simulate.sleep()
    }
    expect(wx.previewImage.mock.calls.map(call => call[0])).toEqual([
      { current: firstImages[0], urls: firstImages },
      { current: firstImages[1], urls: firstImages },
      { current: secondImages[0], urls: secondImages }
    ])
    expect(wx.navigateTo).not.toHaveBeenCalled()
    page.detach()
  })

  test('点击记录文字仍能打开详情', async () => {
    const page = simulate.render(pageId)
    page.attach(document.createElement('div'))
    page.setData({ records: [{ _id: 'record', images: [] }] })
    page.querySelector('.record-content').dispatchEvent('tap')
    await simulate.sleep()
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/record-detail/record-detail?recordId=record' })
    page.detach()
  })

  test.each([{}, { images: [] }, { images: ['cloud://first'], current: 2 }])('无效图片数据不抛异常或打开预览：%j', dataset => {
    expect(() => pageDefinition.previewImage({ currentTarget: { dataset } })).not.toThrow()
    expect(wx.previewImage).not.toHaveBeenCalled()
  })
})
