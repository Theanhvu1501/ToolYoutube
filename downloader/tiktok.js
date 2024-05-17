'use strict'

const EventEmitter = require('events')
const puppeteer = require('puppeteer')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { chunk, last } = require('lodash')
const Tiktok = require('@tobyg74/tiktok-api-dl')

class TiktokDownloader extends EventEmitter {
  constructor() {
    super()
    this._throttleValue = 500
  }

  generateUrlProfile(username) {
    var baseUrl = 'https://www.tiktok.com/'
    if (username.includes('@')) {
      baseUrl = `${baseUrl}${username}`
    } else {
      baseUrl = `${baseUrl}@${username}`
    }
    return baseUrl
  }

  async getListVideoByUsername(username) {
    var baseUrl = await this.generateUrlProfile(username)
    const browser = await puppeteer.launch({
      headless: false
    })
    const page = await browser.newPage()
    page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36'
    )
    await page.goto(baseUrl)
    var listVideo = []
    var loop = true
    while (loop) {
      listVideo = await page.evaluate(() => {
        const listVideo = document.querySelectorAll('a')
        const videoUrls2 = Array.from(listVideo)
          .map((item) => item.href)
          .filter((href) => href.includes('/video/'))
          .filter((value, index, self) => self.indexOf(value) === index)
        return videoUrls2
      })
      const previousHeight = await page.evaluate('document.body.scrollHeight')
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
      await page
        .waitForFunction(`document.body.scrollHeight > ${previousHeight}`, {
          timeout: 10000
        })
        .catch(() => {
          loop = false
        })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    await browser.close()
    return listVideo
  }

  handleProgress(percentage, title, videoURL, lengthSeconds, totalVideo) {
    this.emit('progress', { percentage, title, videoURL, lengthSeconds, totalVideo })
  }

  handleError() {
    this.emit('error', new Error("Can't process video."))
  }

  handleFinish({ title }) {
    setTimeout(() => {
      this.emit('finish', {
        videoTitle: title
      })
    }, this._throttleValue)
  }

  async downloadVideo(url, directoryPath, totalVideo) {
    try {
      const { result } = await Tiktok.Downloader(url, {
        version: 'v3' //  version: "v1" | "v2" | "v3"
      })
      const fileName = `${result?.desc?.replace(/[«»?|"']/g, '')?.trim()}.mp4`
      const filePath = path.join(directoryPath, fileName)
      const response = await axios({
        url: result.video_hd,
        method: 'GET',
        responseType: 'stream'
      })
      const writer = fs.createWriteStream(filePath)

      let downloadedBytes = 0
      const totalBytes = parseInt(response.headers['content-length'], 10)

      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length
        const progress = (downloadedBytes / totalBytes) * 100
        const percentage = progress.toFixed(2)
        this.handleProgress(
          percentage,
          result?.description,
          url,
          result?.video?.duration,
          totalVideo
        )
      })

      response.data.pipe(writer)
      await new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.handleFinish({ description: result?.description })
          writer.close()
          resolve()
        })
        writer.on('error', (error) => {
          writer.close()
          this.handleError(error)
          reject()
        })
      })
    } catch (error) {
      console.log(`[debug - url]: `, url)
      console.log(`[debug - error]: `, error)
    }
  }

  async downloadWithUserName(username, directory, listUrls) {
    if (username) {
      const directoryPath = `${directory}/${username}`
      if (!fs.existsSync(`${directoryPath}`)) {
        fs.mkdirSync(`${directoryPath}`, {
          recursive: true
        })
      }
      const listVideo = await this.getListVideoByUsername(username)
      this.downloadListVideo(listVideo, directoryPath)
    } else {
      this.downloadListVideo(listUrls, directory)
    }
  }

  async downloadListVideo(listVideo, directory) {
    const totalVideo = listVideo.length
    // chunk data using lodash
    const chunkData = chunk(listVideo, 5)
    for (const chunk of chunkData) {
      await Promise.all(
        chunk.map(async (video) => {
          await this.downloadVideo(video, directory, totalVideo)
        })
      )
    }
  }
}

module.exports = TiktokDownloader
