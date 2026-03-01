Page({
  data: {
    prompt: '',
    imageUrl: '',
    loading: false,
    error: ''
  },

  onInput(e) {
    this.setData({
      prompt: e.detail.value
    })
  },

  async generateImage() {
    const prompt = this.data.prompt.trim()
    if (!prompt) {
      this.setData({ error: '请输入 prompt' })
      return
    }

    this.setData({ loading: true, error: '', imageUrl: '' })

    try {
      const response = await wx.request({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApp().globalData.openRouterApiKey}`,
          'HTTP-Referer': 'https://github.com/openclaw-dazhuang/myapp',
          'X-Title': 'My WeApp'
        },
        data: {
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt }
              ]
            }
          ],
          extra_json: {
            "responseModalities": "image"
          }
        }
      })

      console.log('API response:', response.data)

      if (response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content
        if (Array.isArray(content)) {
          for (const item of content) {
            if (item.type === 'image') {
              this.setData({ imageUrl: item.url })
              break
            }
          }
        }
      }

      if (!this.data.imageUrl) {
        this.setData({ error: '未能生成图片，请重试' })
      }
    } catch (err) {
      console.error('Error:', err)
      this.setData({ error: '请求失败: ' + (err.errMsg || '未知错误') })
    } finally {
      this.setData({ loading: false })
    }
  },

  saveImage() {
    if (!this.data.imageUrl) return
    
    wx.downloadFile({
      url: this.data.imageUrl,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            console.error('Save error:', err)
            if (err.errMsg && err.errMsg.includes('auth')) {
              wx.showModal({
                title: '提示',
                content: '需要授权保存到相册',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          }
        })
      },
      fail: (err) => {
        console.error('Download error:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  }
})