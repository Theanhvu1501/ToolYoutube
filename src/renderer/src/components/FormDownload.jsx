import { ClockCircleOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Divider, Form, Input, List, Progress, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
const { ipcRenderer } = window.require('electron')
const { TextArea } = Input
let dataMap = {}
window.ipcRenderer = ipcRenderer
const FormDownload = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const dataRef = useRef(data)

  const startDownload = async (e) => {
    e.preventDefault()
    setLoading(true)
    dataMap = {}
    const formValues = await form.validateFields()
    const urls = formValues?.linkUrls?.split('\n')
    const directory = formValues.directory
    ipcRenderer.send('download', { urls, directory })
  }
  const [form] = Form.useForm()

  useEffect(() => {
    const updateData = () => {
      dataRef.current = Object.values(dataMap)
      setData(dataRef.current)
    }

    ipcRenderer.on(
      'download:progress',
      (event, { percentage, title, videoURL, lengthSeconds, thumbnailURL }) => {
        setLoading(true)
        if (dataMap?.videoURL) {
          // Nếu đã tồn tại, cập nhật phần trăm
          dataMap[videoURL].percentage = Math.round(percentage)
        } else {
          const hours = Math.floor(lengthSeconds / 3600) // Số giờ
          const minutes = Math.floor((lengthSeconds % 3600) / 60) // Số phút
          const remainingSeconds = lengthSeconds % 60 // Số giây còn lại

          dataMap[videoURL] = {
            video: videoURL,
            percentage: Math.round(percentage),
            title,
            thumbnailURL,
            time: `${hours}:${minutes}:${remainingSeconds}`
          }
        }
        updateData()
      }
    )

    ipcRenderer.on('download:success', () => {
      setLoading(false)
    })

    ipcRenderer.on('download:error', (event, error) => {
      message.error(error)
      setLoading(false)
    })

    return () => {
      ipcRenderer.removeAllListeners('download:progress')
      ipcRenderer.removeAllListeners('download:success')
      ipcRenderer.removeAllListeners('download:error')
    }
  }, [])

  return (
    <div
      style={{
        paddingTop: 35
      }}
    >
      <Form
        hideRequiredMark
        form={form}
        labelCol={{
          span: 3
        }}
        disabled={loading}
        wrapperCol={{
          span: 21
        }}
      >
        <div
          style={{
            height: 400,
            padding: '16px'
          }}
        >
          <List
            itemLayout="horizontal"
            dataSource={data}
            style={{
              height: 385,
              overflow: 'scroll'
            }}
            renderItem={(item) => (
              <List.Item>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 10,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ marginRight: 10 }}>
                    <img
                      src={item.thumbnailURL}
                      style={{ width: 150, height: 80, objectFit: 'cover' }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}
                  >
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        width: 750,
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        color: '#C5C3C1',
                        marginTop: 10,
                        marginBottom: 7,
                        paddingLeft: 20,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ClockCircleOutlined style={{ verticalAlign: 'middle' }} />
                      <span style={{ marginLeft: 8, marginRight: 20 }}>{item.time}</span>
                      <LinkOutlined style={{ verticalAlign: 'middle' }} />
                      <span style={{ marginLeft: 8 }}>
                        <a>{item.video}</a>
                      </span>
                    </div>
                    <Progress
                      size={'small'}
                      style={{ paddingLeft: 20 }}
                      percent={item?.percentage || 0}
                    />
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
        <div
          style={{
            backgroundColor: '#F0F0F0',
            padding: 30
          }}
        >
          <Form.Item
            label="Link videos"
            name="linkUrls"
            rules={[
              {
                required: true
              }
            ]}
          >
            <TextArea rows={8} />
          </Form.Item>
          <Divider />
          <Form.Item
            label="Choose"
            name="directory"
            rules={[
              {
                required: true
              }
            ]}
          >
            <Input />
          </Form.Item>
          <div
            style={{
              marginTop: 20,
              textAlign: 'right'
            }}
          >
            <Button
              loading={loading}
              type="primary"
              style={{ minWidth: 200 }}
              onClick={startDownload}
            >
              Download videos
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default FormDownload
