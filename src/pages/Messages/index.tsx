import { App, Card, List, Tag, Button, Tabs } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const typeConfig = {
  assessment: { icon: '📝', bg: '#FEF3C7', label: '测评提醒', targetLabel: '去测评 →', target: '/assessments' },
  interview: { icon: '🎯', bg: '#EDE9FE', label: '面试提醒', targetLabel: '查看面试 →', target: '/interviews' },
  status_change: { icon: '✅', bg: '#D1FAE5', label: '状态变更', targetLabel: '查看投递 →', target: '/applications' },
  apply: { icon: '📤', bg: '#DBEAFE', label: '投递记录', targetLabel: '查看投递 →', target: '/applications' },
}

export default function MessagesPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const messages = useAppStore(s => s.messages)
  const markMessageRead = useAppStore(s => s.markMessageRead)
  const markAllMessagesRead = useAppStore(s => s.markAllMessagesRead)

  const unreadCount = messages.filter(m => !m.isRead).length

  const handleClick = (id: string, target: string) => {
    markMessageRead(id)
    navigate(target)
  }

  const renderList = (items: typeof messages) => (
    items.length === 0
      ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>🔔 暂无消息通知</div>
      : <List
          dataSource={items}
          renderItem={msg => {
            const cfg = typeConfig[msg.type]
            return (
              <List.Item
                style={{
                  background: msg.isRead ? 'transparent' : '#EFF6FF',
                  padding: '16px 24px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
                onClick={() => handleClick(msg.id, msg.targetUrl)}
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={e => { e.stopPropagation(); handleClick(msg.id, msg.targetUrl) }}
                  >
                    {cfg.targetLabel}
                  </Button>
                }
              >
                {!msg.isRead && (
                  <div style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 8, height: 8, borderRadius: '50%', background: '#3B82F6'
                  }} />
                )}
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                    }}>
                      {cfg.icon}
                    </div>
                  }
                  title={
                    <span style={{ fontWeight: msg.isRead ? 'normal' : 600 }}>
                      {msg.title}
                    </span>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>{msg.description}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>
                        {dayjs(msg.createdAt).fromNow()} · <Tag style={{ fontSize: 11 }}>{cfg.label}</Tag>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )
          }}
        />
  )

  const tabs = [
    { key: 'all', label: `全部 (${messages.length})`, children: renderList(messages) },
    { key: 'unread', label: `未读 (${unreadCount})`, children: renderList(messages.filter(m => !m.isRead)) },
    { key: 'assessment', label: '测评', children: renderList(messages.filter(m => m.type === 'assessment')) },
    { key: 'interview', label: '面试', children: renderList(messages.filter(m => m.type === 'interview')) },
  ]

  return (
    <Card
      title="消息通知"
      extra={
        <Button
          onClick={() => { markAllMessagesRead(); message.success('已全部标为已读') }}
          disabled={unreadCount === 0}
        >
          全部标为已读
        </Button>
      }
    >
      <Tabs items={tabs} />
    </Card>
  )
}
