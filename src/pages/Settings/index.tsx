import { useEffect, useState } from 'react'
import { App, Card, Form, Input, Select, Button, Switch, Space, Divider, Radio, Flex } from 'antd'
import { api } from '../../api/client'

type ProfilePayload = {
  name: string
  phone?: string
  school?: string
  major?: string
  graduationYear?: string
  email?: string
}

const jobTypeOptions = [
  { label: '秋招冲刺中', value: 'autumn_sprint' },
  { label: '春招准备中', value: 'spring_prepare' },
  { label: '实习寻找中', value: 'intern_seeking' },
  { label: '已确定去向', value: 'confirmed' },
  { label: '暂停求职', value: 'paused' },
]

export default function SettingsPage() {
  const { message } = App.useApp()
  const [profileForm] = Form.useForm()
  const [jobStatus, setJobStatus] = useState<string>('intern_seeking')
  const [loading, setLoading] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const [profile, status] = await Promise.all([
        api.get<ProfilePayload>('/settings/profile'),
        api.get<{ jobSeekingStatus: string }>('/settings/job-status'),
      ])
      profileForm.setFieldsValue({
        name: profile.name || '',
        phone: profile.phone || '',
        school: profile.school || '',
        major: profile.major || '',
        year: profile.graduationYear || '2026',
        email: profile.email || '',
      })
      setJobStatus(status.jobSeekingStatus || 'intern_seeking')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const saveProfile = async (values: any) => {
    setLoading(true)
    try {
      await api.patch('/settings/profile', {
        name: values.name,
        phone: values.phone,
        school: values.school,
        major: values.major,
        graduationYear: values.year,
        email: values.email,
      })
      message.success('个人信息已更新')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const updateJobStatus = async (value: string) => {
    setJobStatus(value)
    try {
      await api.patch('/settings/job-status', { jobSeekingStatus: value })
      message.success('求职状态已更新')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  return (
    <Flex vertical gap="large" style={{ width: '100%' }}>
      <Card id="profile" title="个人信息" loading={loading}>
        <Form form={profileForm} layout="vertical" onFinish={(values) => void saveProfile(values)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, max: 20 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="手机号" rules={[{ pattern: /^$|^1\d{10}$/, message: '请输入有效手机号' }]}>
              <Input placeholder="138****8888" />
            </Form.Item>
            <Form.Item name="school" label="学校">
              <Input />
            </Form.Item>
            <Form.Item name="major" label="专业">
              <Input />
            </Form.Item>
            <Form.Item name="year" label="届别">
              <Select options={['2024', '2025', '2026', '2027', '2028'].map((y) => ({ label: `${y}届`, value: y }))} />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
              <Input />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存修改
          </Button>
        </Form>
      </Card>

      <Card id="status" title="求职状态">
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>当前求职阶段，用于优化首页文案和提醒策略。</p>
        <Radio.Group value={jobStatus} onChange={(e) => void updateJobStatus(e.target.value)}>
          <Space wrap>
            {jobTypeOptions.map((opt) => (
              <Radio.Button key={opt.value} value={opt.value} style={{ borderRadius: 8, marginBottom: 8 }}>
                {opt.label}
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>
      </Card>

      <Card id="notify" title="通知提醒">
        {[
          { label: '测评截止提醒', desc: '测评截止前提醒', hasTime: true, timeOptions: ['提前 1 天', '提前 3 小时', '提前 1 小时'] },
          { label: '测评紧急提醒', desc: '截止前 3 小时再次提醒', hasTime: false },
          { label: '面试前提醒', desc: '面试开始前提醒', hasTime: true, timeOptions: ['提前 1 小时', '提前 30 分钟', '提前 15 分钟'] },
          { label: '新消息通知', desc: '收到系统消息时提醒', hasTime: false },
        ].map((item, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{item.desc}</div>
              </div>
              <Space>
                {item.hasTime && <Select defaultValue={item.timeOptions?.[0]} style={{ width: 130 }} options={(item.timeOptions || []).map((t) => ({ label: t, value: t }))} />}
                <Switch defaultChecked />
              </Space>
            </div>
            {idx < 3 && <Divider style={{ margin: 0 }} />}
          </div>
        ))}
      </Card>
    </Flex>
  )
}
