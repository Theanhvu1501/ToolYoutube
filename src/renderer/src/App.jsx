import { TikTokFilled, YoutubeFilled } from '@ant-design/icons'
import { Segmented } from 'antd'
import { useState } from 'react'
import FormDownloadTiktok from './components/FormDownloadTiktok'
import FormDownloadYoutube from './components/FormDownloadYoutube'
function App() {
  const [type, setType] = useState('Youtube')
  return (
    <div>
      <Segmented
        defaultValue="Youtube"
        onChange={(value) => setType(value)}
        itemAc
        options={[
          {
            label: (
              <div
                style={{
                  padding: 4,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <YoutubeFilled />
                <div style={{ marginLeft: 10 }}>Youtube</div>
              </div>
            ),
            value: 'Youtube'
          },
          {
            label: (
              <div
                style={{
                  padding: 4,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <TikTokFilled />
                <div style={{ marginLeft: 10 }}>Tiktok</div>
              </div>
            ),
            value: 'Tiktok'
          }
        ]}
        block
      />
      {type === 'Youtube' ? <FormDownloadYoutube /> : <FormDownloadTiktok />}
    </div>
  )
}

export default App
