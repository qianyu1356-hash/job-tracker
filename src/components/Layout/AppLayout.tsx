import { useState } from 'react'
import { Layout, Menu, Badge, Button, App as AntApp } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  SendOutlined,
  FormOutlined,
  CalendarOutlined,
  FolderOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../../store'
import { api, clearAuthToken } from '../../api/client'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '首页' },
  { key: '/applications', icon: <SendOutlined />, label: '投递管理' },
  { key: '/assessments', icon: <FormOutlined />, label: '测评管理' },
  { key: '/interviews', icon: <CalendarOutlined />, label: '面试管理' },
  { key: '/materials', icon: <FolderOutlined />, label: '材料库' },
  { key: '/resume', icon: <FileTextOutlined />, label: '简历管理' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const unreadCount = useAppStore((s) => s.unreadCount())
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/auth/logout', {})
    } catch {
      // ignore logout request errors
    } finally {
      clearAuthToken()
      message.success('已退出登录')
      window.location.href = '/login'
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: '#fff',
          borderRight: '1px solid #E2E8F0',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            fontSize: 18,
            fontWeight: 600,
            color: '#3B82F6',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          求职看板
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ border: 'none', marginTop: 8 }}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />

        <div
          onClick={() => navigate('/messages')}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: location.pathname === '/messages' ? '#3B82F6' : '#64748B',
            background: location.pathname === '/messages' ? '#EFF6FF' : 'transparent',
            borderRight: location.pathname === '/messages' ? '3px solid #3B82F6' : 'none',
          }}
        >
          <Badge count={unreadCount} size="small">
            <BellOutlined style={{ fontSize: 16 }} />
          </Badge>
          <span style={{ fontSize: 14 }}>消息通知</span>
        </div>

        <div style={{ padding: '16px 24px' }}>
          <Button
            block
            icon={<LogoutOutlined />}
            loading={loggingOut}
            onClick={() => {
              void logout()
            }}
          >
            退出登录
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: 240, background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)' }}>
        <Content style={{ padding: 24, minHeight: '100vh' }}>{children}</Content>
      </Layout>
    </Layout>
  )
}
