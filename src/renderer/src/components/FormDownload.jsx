import { Button, Form, Input, Progress, Radio, Table, message } from 'antd'
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
  const type = Form.useWatch('type', form)

  useEffect(() => {
    const updateData = () => {
      dataRef.current = Object.values(dataMap)
      setData(dataRef.current)
    }

    ipcRenderer.on('download:progress', (event, { percentage, videoURL }) => {
      setLoading(true)
      if (dataMap?.videoURL) {
        // Nếu đã tồn tại, cập nhật phần trăm
        dataMap[videoURL].percentage = Math.round(percentage)
      } else {
        // Nếu chưa tồn tại, thêm một mục mới vào dataMap
        dataMap[videoURL] = { video: videoURL, percentage: Math.round(percentage) }
      }
      updateData()
    })

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

  const columns = [
    {
      title: 'STT',
      width: 60,
      dataIndex: 'stt',
      key: 'stt',

      render: (text, record, index) => {
        return <span>{index + 1}</span>
      }
    },
    {
      title: 'Video',
      dataIndex: 'video',
      key: 'video',
      render: (text, record) => {
        return (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {record.video}
          </span>
        )
      }
    },
    {
      title: '%',
      width: 80,
      dataIndex: 'percentage',
      key: 'percentage',
      render: (text, record) => {
        return <Progress size={'small'} percent={record?.percentage || 0} />
      }
    }
  ]

  return (
    <div
      style={{
        marginTop: 40,
        padding: 20
      }}
    >
      <Form
        hideRequiredMark
        form={form}
        labelCol={{
          span: 4
        }}
        disabled={loading}
        wrapperCol={{
          span: 20
        }}
      >
        <Form.Item
          label="Thư mục lưu"
          name="directory"
          rules={[
            {
              required: true
            }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name={'type'} label="Loại" initialValue={'LinkUrls'}>
          <Radio.Group>
            <Radio value="LinkUrls"> LinkUrls </Radio>
            <Radio value="PlayList"> PlayList </Radio>
          </Radio.Group>
        </Form.Item>
        {type === 'LinkUrls' ? (
          <Form.Item
            label="LinkUrls"
            name="linkUrls"
            rules={[
              {
                required: true
              }
            ]}
          >
            <TextArea rows={8} />
          </Form.Item>
        ) : null}

        <Button loading={loading} type="primary" style={{ minWidth: 200 }} onClick={startDownload}>
          Tải
        </Button>

        <h2
          style={{
            textAlign: 'center'
          }}
        >
          Logs
        </h2>
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          pagination={false}
          scroll={{ y: 500 }}
        ></Table>
      </Form>
    </div>
  )
}

export default FormDownload
