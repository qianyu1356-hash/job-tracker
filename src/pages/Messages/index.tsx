import { App, Button, Card, List, Space, Tabs, Tag } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useAppStore } from '../../store'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const typeConfig = {
  assessment: { icon: '📝', bg: '#FEF3C7', label: '测评提醒', targetLabel: '去测评' },
  interview: { icon: '🎯', bg: '#EDE9FE', label: '面试提醒', targetLabel: '查看面试' },
  status_change: { icon: '✅', bg: '#D1FAE5', label: '状态变更', targetLabel: '查看投递' },
  apply: { icon: '📨', bg: '#DBEAFE', label: '投递记录', targetLabel: '查看投递' },
}

export default function MessagesPage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const messages = useAppStore((s) => s.messages)
  const markMessageRead = useAppStore((s) => s.markMessageRead)
  const markAllMessagesRead = useAppStore((s) => s.markAllMessagesRead)
  const deleteMessage = useAppStore((s) => s.deleteMessage)
  const clearMessages = useAppStore((s) => s.clearMessages)

  const unreadCount = messages.filter((m) => !m.isRead).length

  const handleJump = async (id: string, target: string) => {
    try {
      await markMessageRead(id)
    } catch {
      // ignore read error
    }
    navigate(target)
  }

  const handleDeleteOne = (id: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定删除这条消息吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMessage(id)
          message.success('消息已删除')
        } catch (err) {
          message.error(err instanceof Error ? err.message : '删除失败')
        }
      },
    })
  }

  const handleClearAll = () => {
    modal.confirm({
      title: '确认清空',
      content: '确定清空全部消息吗？此操作不可恢复。',
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await clearMessages()
          message.success('已清空全部消息')
        } catch (err) {
          message.error(err instanceof Error ? err.message : '清空失败')
        }
      },
    })
  }

  const renderList = (items: typeof messages) =>
    items.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>暂无消息通知</div>
    ) : (
      <List
        dataSource={items}
        renderItem={(item) => {
          const cfg = typeConfig[item.type]
          return (
            <List.Item
              style={{
                background: item.isRead ? 'transparent' : '#EFF6FF',
                padding: '16px 24px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
              onClick={() => void handleJump(item.id, item.targetUrl)}
              extra={
                <Space>
                  <Button
                    type="link"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleJump(item.id, item.targetUrl)
                    }}
                  >
                    {cfg.targetLabel}
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteOne(item.id)
                    }}
                  />
                </Space>
              }
            >
              {!item.isRead && (
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#3B82F6',
                  }}
                />
              )}
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: cfg.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    {cfg.icon}
                  </div>
                }
                title={<span style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.title}</span>}
                description={
                  <div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>{item.description}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      {dayjs(item.createdAt).fromNow()} · <Tag style={{ fontSize: 11 }}>{cfg.label}</Tag>
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
    { key: 'unread', label: `未读 (${unreadCount})`, children: renderList(messages.filter((m) => !m.isRead)) },
    { key: 'assessment', label: '测评', children: renderList(messages.filter((m) => m.type === 'assessment')) },
    { key: 'interview', label: '面试', children: renderList(messages.filter((m) => m.type === 'interview')) },
  ]

  return (
    <Card
      title="消息通知"
      extra={
        <Space>
          <Button
            onClick={() => {
              void markAllMessagesRead()
                .then(() => message.success('已全部标为已读'))
                .catch((err: unknown) => message.error(err instanceof Error ? err.message : '操作失败'))
            }}
            disabled={unreadCount === 0}
          >
            全部标为已读
          </Button>
          <Button danger onClick={handleClearAll} disabled={messages.length === 0}>
            一键清空
          </Button>
        </Space>
      }
    >
      <Tabs items={tabs} />
    </Card>
  )
}
