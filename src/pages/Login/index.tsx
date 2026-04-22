import { useState } from 'react'
import { App, Button, Card, Form, Input, Tabs, Typography } from 'antd'
import { api, setAuthToken } from '../../api/client'

export default function LoginPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await api.post<{ token: string }>('/auth/login', values)
      setAuthToken(res.token)
      message.success('登录成功')
      window.location.href = '/'
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: { username: string; password: string; name?: string }) => {
    setLoading(true)
    try {
      const res = await api.post<{ token: string }>('/auth/register', values)
      setAuthToken(res.token)
      message.success('注册成功')
      window.location.href = '/'
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #EFF6FF 0%, #F8FAFC 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, borderRadius: 12 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          求职申请看板
        </Typography.Title>
        <Typography.Text type="secondary">多人版登录</Typography.Text>

        <Tabs
          style={{ marginTop: 18 }}
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form form={loginForm} layout="vertical" onFinish={(v) => void handleLogin(v)}>
                  <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input placeholder="请输入用户名" autoComplete="username" />
                  </Form.Item>
                  <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password placeholder="请输入密码" autoComplete="current-password" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    登录
                  </Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={(v) => void handleRegister(v)}>
                  <Form.Item name="name" label="姓名（可选）">
                    <Input placeholder="例如：李四" />
                  </Form.Item>
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少 3 位' },
                    ]}
                  >
                    <Input placeholder="3~32 位英文/数字" autoComplete="username" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 6, message: '密码至少 6 位' },
                    ]}
                  >
                    <Input.Password placeholder="至少 6 位" autoComplete="new-password" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>
                    注册并登录
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
