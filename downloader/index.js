'use strict'

const ytdl = require('ytdl-core')
const fs = require('fs')
const path = require('path')
const { last, chunk } = require('lodash')
const { default: axios } = require('axios')
const EventEmitter = require('events')
// Array of YouTube video URLs
const { throttle } = require('throttle-debounce')
class Downloader extends EventEmitter {
  constructor() {
    super()
    this._throttleValue = 500
  }

  validateURL = (url) => {
    let isValid

    try {
      isValid = ytdl.validateURL(url)
    } catch (error) {
      return this.handleError(error)
    }

    // Throw error if the video URL is invalid
    if (!isValid) {
      // We use nextTick so the .on() calls can be async
      process.nextTick(() => {
        this.emit('error', new Error('Invalid URL'))
        this.removeAllListeners()
      })
    }

    return isValid
  }

  handleProgress = (_, downloaded, total, title, videoURL, lengthSeconds, thumbnailURL) => {
    const percentage = (downloaded / total) * 100
    this.emit('progress', { percentage, title, videoURL, lengthSeconds, thumbnailURL })
  }

  handleError = () => {
    this.emit('error', new Error("Can't process video."))
  }

  handleFinish = ({ title }) => {
    setTimeout(() => {
      this.emit('finish', {
        videoTitle: title
      })
    }, this._throttleValue)
  }

  downloadVideo = async (videoURL, directory) => {
    if (!this.validateURL(videoURL)) return
    try {
      if (!fs.existsSync(`${directory}/Video`)) {
        fs.mkdirSync(`${directory}/Video`, {
          recursive: true
        })
      }
      if (!fs.existsSync(`${directory}/Thumb`)) {
        fs.mkdirSync(`${directory}/Thumb`, {
          recursive: true
        })
      }

      const info = await ytdl.getInfo(videoURL)
      const { title, lengthSeconds } = info.videoDetails
      const thumbnailURL = last(info.videoDetails.thumbnails).url
      const formatsWithAudio720p = info.formats.filter(
        (format) => format.hasAudio && format.hasVideo && format.quality === 'hd720'
      )

      const filePathVideo = path.join(`${directory}/Video`, `${title.replace(/[«»?|"']/g, '')}.mp4`)
      const filePathThumb = path.join(`${directory}/Thumb`, `${title.replace(/[«»?|"']/g, '')}.jpg`)
      if (formatsWithAudio720p.length > 0) {
        //Download video
        const video = ytdl(videoURL, { format: 'hd720' })
        const videoFileStream = fs.createWriteStream(filePathVideo)
        await new Promise((resolve, reject) => {
          video
            .on('error', (error) => {
              this.handleError(error)
              reject(error)
            })
            .on(
              'progress',
              throttle(this._throttleValue, (_, downloaded, total) =>
                this.handleProgress(
                  _,
                  downloaded,
                  total,
                  title,
                  videoURL,
                  lengthSeconds,
                  thumbnailURL
                )
              )
            )
            .pipe(videoFileStream)
            .on('finish', () => {
              this.handleFinish({ title }) // Xử lý khi tải xong video
              videoFileStream.close() // Đóng file stream sau khi tải xong
              resolve()
            })
        })

        //Download thumb

        const response = await axios.get(thumbnailURL, {
          responseType: 'stream'
        })
        response.data.pipe(fs.createWriteStream(filePathThumb)) // Save thumbnail as .jpg file
      } else {
        console.error(`Video format not found for ${title}`)
      }
    } catch (error) {
      console.error(`Error downloading ${videoURL}: ${error}`)
    }
  }

  downloadVideos = async (urls, directory) => {
    const dataChunk = chunk(urls, 5)
    for (const d of dataChunk) {
      await Promise.all(
        d.map((v) => {
          return this.downloadVideo(v, directory)
        })
      )
    }
  }
}

module.exports = Downloader
