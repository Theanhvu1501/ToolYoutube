'use strict'

const ytdl = require('ytdl-core')
const fs = require('fs')
const { last, chunk } = require('lodash')
const { default: axios } = require('axios')
const EventEmitter = require('events')
// Array of YouTube video URLs
const { throttle } = require('throttle-debounce')
class Downloader extends EventEmitter {
  constructor() {
    super()
    this._throttleValue = 100
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

  handleProgress = (_, downloaded, total, videoURL) => {
    const percentage = (downloaded / total) * 100
    this.emit('progress', { percentage, videoURL })
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
      const info = await ytdl.getInfo(videoURL)
      const title = info.videoDetails.title
      const formatsWithAudio720p = info.formats.filter(
        (format) => format.hasAudio && format.hasVideo && format.quality === 'hd720'
      )
      if (formatsWithAudio720p.length > 0) {
        //Download video
        const format = formatsWithAudio720p[0]
        const video = ytdl(videoURL, { format: format })
        video
          .on('error', this.handleError)
          .on(
            'progress',
            throttle(this._throttleValue, (_, downloaded, total) =>
              this.handleProgress(_, downloaded, total, videoURL)
            )
          )
          .pipe(fs.createWriteStream(`${directory}/Video/${title}.mp4`))
          .on('finish', () => this.handleFinish({ title })) // Log when download is complete

        //Download thumb
        const thumbnailURL = last(info.videoDetails.thumbnails).url
        const response = await axios.get(thumbnailURL, {
          responseType: 'stream'
        })
        const thumbnailFileName = `${title}.jpg`
        response.data.pipe(fs.createWriteStream(`${directory}/Thumb/${thumbnailFileName}`)) // Save thumbnail as .jpg file
      } else {
        console.error(`Video format not found for ${title}`)
      }
    } catch (error) {
      console.error(`Error downloading ${videoURL}: ${error}`)
    }
  }

  // Function to download multiple videos
  downloadVideos = async (urls, directory) => {
    const dataChunk = chunk(urls, 10)
    dataChunk.forEach(async (d) => {
      await Promise.all(
        d.map((v) => {
          this.downloadVideo(v, directory)
        })
      )
    })
  }
}

module.exports = Downloader
