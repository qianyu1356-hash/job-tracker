import { App, Card, Form, Input, Select, Button, Switch, Space, Divider, Radio, Flex } from 'antd'

const jobTypeOptions = [
  { label: '🔥 秋招冲刺中', value: 'autumn_sprint' },
  { label: '🌱 春招准备中', value: 'spring_prepare' },
  { label: '💼 实习寻找中', value: 'intern_seeking' },
  { label: '✅ 已确定去向', value: 'confirmed' },
  { label: '⏸ 暂停求职', value: 'paused' },
]

export default function SettingsPage() {
  const { message } = App.useApp()
  const [profileForm] = Form.useForm()

  return (
    <Flex vertical gap="large" style={{ width: '100%' }}>

      {/* 个人信息 */}
        <Card id="profile" title="个人信息">
          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{ name: '张同学', school: '北京大学', major: '计算机科学与技术', year: '2026', email: 'zhang@pku.edu.cn' }}
            onFinish={() => message.success('个人信息已更新')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, max: 20 }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="手机号" rules={[{ pattern: /^1\d{10}$/, message: '请输入有效手机号' }]}>
                <Input placeholder="138****8888" />
              </Form.Item>
              <Form.Item name="school" label="学校">
                <Input />
              </Form.Item>
              <Form.Item name="major" label="专业">
                <Input />
              </Form.Item>
              <Form.Item name="year" label="届别">
                <Select options={['2024', '2025', '2026', '2027', '2028'].map(y => ({ label: `${y}届`, value: y }))} />
              </Form.Item>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
                <Input />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit">保存修改</Button>
          </Form>
        </Card>

        {/* 求职状态 */}
        <Card id="status" title="求职状态">
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>当前求职阶段，帮助系统为你优化提醒策略</p>
          <Radio.Group
            defaultValue="autumn_sprint"
            onChange={() => message.success('求职状态已更新')}
          >
            <Space wrap>
              {jobTypeOptions.map(opt => (
                <Radio.Button key={opt.value} value={opt.value} style={{ borderRadius: 8, marginBottom: 8 }}>
                  {opt.label}
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </Card>

        {/* 通知提醒 */}
        <Card id="notify" title="通知提醒">
          {[
            { label: '测评截止提醒', desc: '在测评截止前提前提醒', hasTime: true, timeOptions: ['提前 1 天', '提前 3 小时', '提前 1 小时'], defaultTime: '提前 1 天' },
            { label: '测评紧急提醒', desc: '截止前 3 小时再次提醒', hasTime: false },
            { label: '面试前提醒', desc: '在面试开始前提前提醒', hasTime: true, timeOptions: ['提前 1 小时', '提前 30 分钟', '提前 15 分钟'], defaultTime: '提前 1 小时' },
            { label: '面试临近提醒', desc: '面试开始前 15 分钟再次提醒', hasTime: false },
            { label: '新消息通知', desc: '收到测评邀请、面试通知时提醒', hasTime: false },
          ].map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{item.desc}</div>
                </div>
                <Space>
                  {item.hasTime && (
                    <Select
                      defaultValue={item.defaultTime}
                      style={{ width: 130 }}
                      options={(item.timeOptions || []).map(t => ({ label: t, value: t }))}
                      onChange={() => message.success('设置已保存')}
                    />
                  )}
                  <Switch defaultChecked onChange={() => message.success('设置已保存')} />
                </Space>
              </div>
              {idx < 4 && <Divider style={{ margin: 0 }} />}
            </div>
          ))}
        </Card>

        {/* 账号安全 */}
        <Card
          id="danger"
          title={<span style={{ color: '#DC2626' }}>账号安全</span>}
          style={{ border: '1px solid #FEE2E2' }}
        >
          {[
            { label: '修改密码', desc: '定期更换密码保护账号安全', btnText: '修改密码', onClick: () => message.info('修改密码功能开发中') },
            { label: '清空所有数据', desc: '删除全部投递、测评、面试记录，不可恢复', btnText: '清空数据', danger: true, onClick: () => message.warning('清空数据功能开发中') },
            { label: '注销账号', desc: '永久删除账号及所有数据', btnText: '注销账号', danger: true, onClick: () => message.warning('注销账号功能开发中') },
          ].map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{item.desc}</div>
                </div>
                <Button danger={item.danger} onClick={item.onClick}>{item.btnText}</Button>
              </div>
              {idx < 2 && <Divider style={{ margin: 0 }} />}
            </div>
          ))}
        </Card>

      </Flex>
  )
}
