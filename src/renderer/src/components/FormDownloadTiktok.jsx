import {
  BarsOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  LinkOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import { Button, Divider, Form, Input, List, Progress, Segmented, message } from 'antd'
import { compact, uniq } from 'lodash'
import { useEffect, useRef, useState } from 'react'
const { ipcRenderer } = window.require('electron')
const { TextArea } = Input
let dataMap = {}
window.ipcRenderer = ipcRenderer
const FormDownloadTiktok = () => {
  const [loading, setLoading] = useState(false)
  const [totalVideo, setTotalVideo] = useState(0)

  const [data, setData] = useState([])
  const dataRef = useRef(data)

  const startDownload = async (e) => {
    e.preventDefault()
    setData([])
    const formValues = await form.validateFields()

    dataMap = {}
    setLoading(true)
    const { username, directory } = formValues
    const listUrls = uniq(compact(formValues?.linkUrls?.split('\n')))
    ipcRenderer.send('downloadTiktok', { username, directory, listUrls })
  }
  const [form] = Form.useForm()
  const urls = Form.useWatch('linkUrls', form)
  const type = Form.useWatch('type', form)

  useEffect(() => {
    const updateData = () => {
      dataRef.current = Object.values(dataMap)
      setData(dataRef.current)
    }

    ipcRenderer.on(
      'downloadTiktok:progress',
      (event, { percentage, title, videoURL, lengthSeconds, totalVideo }) => {
        setTotalVideo(totalVideo)
        setLoading(true)
        if (dataMap?.videoURL) {
          // Nếu đã tồn tại, cập nhật phần trăm
          dataMap[videoURL].percentage = Math.round(percentage)
        } else {
          const seconds = Math.round(lengthSeconds / 1000)
          const hours = Math.floor(seconds / 3600) // Số giờ
          const minutes = Math.floor((seconds % 3600) / 60) // Số phút
          const remainingSeconds = seconds % 60 // Số giây còn lại

          dataMap[videoURL] = {
            video: videoURL,
            percentage: Math.round(percentage),
            title,
            time: `${hours}:${minutes}:${remainingSeconds}`
          }
        }
        updateData()
      }
    )

    ipcRenderer.on('downloadTiktok:success', () => {
      setLoading(false)
    })

    ipcRenderer.on('downloadTiktok:error', (event, error) => {
      message.error(error)
    })

    return () => {
      ipcRenderer.removeAllListeners('downloadTiktok:progress')
      ipcRenderer.removeAllListeners('downloadTiktok:success')
      ipcRenderer.removeAllListeners('downloadTiktok:error')
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
        wrapperCol={{
          span: 21
        }}
      >
        <div
          style={{
            height: 345,
            padding: '16px'
          }}
        >
          <div>
            <span style={{ color: 'black', fontSize: 20, fontWeight: 'bold' }}>Số video tải :</span>
            <DownloadOutlined style={{ width: 20, height: 20, marginLeft: 10 }} />
            <span
              style={{ color: '#3f8600', fontSize: 20 }}
            >{`${data?.length} / ${totalVideo}`}</span>
            {type === 'linkUrls' && (
              <span style={{ color: 'black', fontSize: 14, marginLeft: 8, fontWeight: 'bold' }}>
                {`(Tổng: ${urls?.split('\n')?.length || 0}, Trùng: ${
                  (urls?.split('\n')?.length || 0) - (uniq(compact(urls?.split('\n')))?.length || 0)
                })`}
              </span>
            )}
          </div>

          <List
            itemLayout="horizontal"
            dataSource={data}
            rowKey={'videoURL'}
            style={{
              height: 327,
              overflow: 'scroll'
            }}
            renderItem={(item) => (
              <List.Item key={item?.videoURL}>
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
            padding: 30,
            marginTop: 12
          }}
        >
          <Form.Item
            label=""
            name="type"
            rules={[
              {
                required: true
              }
            ]}
            initialValue={'username'}
          >
            <Segmented
              options={[
                { label: 'User', value: 'username', icon: <UserAddOutlined /> },
                { label: 'List', value: 'linkUrls', icon: <BarsOutlined /> }
              ]}
              defaultValue="username"
              onChange={(e) => {
                if (e === 'linkUrls') {
                  form.setFieldsValue({
                    username: ''
                  })
                } else {
                  form.setFieldsValue({
                    linkUrls: ''
                  })
                }
              }}
            ></Segmented>
          </Form.Item>

          <Form.Item label="User Name" name="username" initialValue={'mf_reddit'}>
            <Input disabled={type === 'linkUrls'} placeholder="Nhập username... vd: @ng_nv1" />
          </Form.Item>

          <Form.Item label={`Link Urls`} name={`linkUrls`}>
            <TextArea disabled={type === 'username'} rows={5} placeholder={`Nhập link urls`} />
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
            initialValue={'D:\\Tiktok'}
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

export default FormDownloadTiktok
