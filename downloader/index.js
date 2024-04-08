'use strict'

const ytdl = require('ytdl-core')
const fs = require('fs')
const { last } = require('lodash')
const { default: axios } = require('axios')
const EventEmitter = require('events')
// Array of YouTube video URLs
const videoURLs = ['https://www.youtube.com/watch?v=fr5-33--zPk']
class Downloader extends EventEmitter {
  constructor() {
    super()
  }
  async downloadVideo(videoURL, directory) {
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
        video.pipe(fs.createWriteStream(`${directory}\\Video\\${title}.mp4`)) // Save video as .mp4 file
        video.on('end', () => console.log(`Downloaded video with sound: ${title}`)) // Log when download is complete

        //Download thumb
        const thumbnailURL = last(info.videoDetails.thumbnails).url
        const response = await axios.get(thumbnailURL, {
          responseType: 'stream'
        })
        const thumbnailFileName = `${title}.jpg`
        response.data.pipe(fs.createWriteStream(`${directory}\\Thumb\\${thumbnailFileName}`)) // Save thumbnail as .jpg file
      } else {
        console.error(`Video format not found for ${title}`)
      }
    } catch (error) {
      console.error(`Error downloading ${videoURL}: ${error}`)
    }
  }

  // Function to download multiple videos
  async downloadVideos(urls, directory) {
    await Promise.all(
      urls.map((v) => {
        this.downloadVideo(v, directory)
      })
    )
  }
}

module.exports = Downloader
