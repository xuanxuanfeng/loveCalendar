// components/page-header/page-header.js
Component({
  properties: {
    title: {
      type: String,
      value: ''
    }
  },

  methods: {
    onBack() {
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) });
    }
  }
});
