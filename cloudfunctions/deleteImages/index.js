const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { imageUrls } = event

  try {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return {
        success: true,
        deleted: 0
      }
    }

    // 删除云存储中的文件
    const result = await wx.cloud.deleteFile({
      fileList: imageUrls
    })

    const deletedCount = result.fileList.filter(file => file.status === 0).length

    return {
      success: true,
      deleted: deletedCount,
      total: imageUrls.length,
      result: result.fileList
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}