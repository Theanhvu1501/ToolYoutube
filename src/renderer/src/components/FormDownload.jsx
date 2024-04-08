import { Button, Form, Input, Progress, Radio, Table, message } from 'antd'
import { cloneDeep } from 'lodash'
import { useEffect, useState } from 'react'
const { ipcRenderer } = window.require('electron')
const { TextArea } = Input

window.ipcRenderer = ipcRenderer
const FormDownload = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])

  const startDownload = async (e) => {
    e.preventDefault()
    const formValues = await form.validateFields()
    const urls = formValues?.linkUrls?.split('\n')
    setData(
      urls.map((i) => {
        return {
          video: i,
          percentage: 0
        }
      })
    )
    const directory = formValues.directory
    ipcRenderer.send('download', { urls, directory })
  }
  const [form] = Form.useForm()
  const type = Form.useWatch('type', form)

  useEffect(() => {
    ipcRenderer.on('download:progress', (event, { percentage, videoURL }) => {
      setLoading(true)
      if (data.length) {
        const dataClone = cloneDeep(data)
        const result = dataClone.find((i) => i.video === videoURL)
        result.percentage = Math.round(percentage)
        setData(dataClone)
      }
    })

    ipcRenderer.on('download:success', () => {
      setLoading(false)
    })

    ipcRenderer.on('download:error', (event, error) => {
      message.error(error)
      setLoading(false)
    })
  }, [data])

  const columns = [
    {
      title: 'STT',
      width: 40,
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
      width: 750,
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
      width: 100,
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
        <Table size="small" columns={columns} dataSource={data} pagination={false}></Table>
      </Form>
    </div>
  )
}

export default FormDownload
