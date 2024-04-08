import { Button, Form, Input, Radio } from 'antd'
const { ipcRenderer } = window.require('electron')
const { TextArea } = Input

window.ipcRenderer = ipcRenderer
const FormDownload = () => {
  const startDownload = (e) => {
    e.preventDefault()
    const formValues = form.validateFields()
    const urls = formValues.linkUrls
    const directory = formValues.directory
    ipcRenderer.send('download', { urls, directory })
  }
  const [form] = Form.useForm()
  const type = Form.useWatch('type', form)
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

        <Button type="primary" style={{ minWidth: 200 }} onClick={startDownload}>
          Tải
        </Button>
      </Form>
    </div>
  )
}

export default FormDownload
