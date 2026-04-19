import { Card, Row, Col, Statistic, List, Tag, Empty } from 'antd'
import { ArrowUpOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function HomePage() {
  const navigate = useNavigate()
  const applications = useAppStore(s => s.applications)
  const messages = useAppStore(s => s.messages)

  const stats = {
    total: applications.length,
    assessment: applications.filter(a => a.status === 'assessment').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offered: applications.filter(a => a.status === 'offered').length,
  }

  // 今日任务：当天截止的测评 + 当天的面试
  const todayTasks = applications.flatMap(app => {
    const tasks: any[] = []
    app.assessments.forEach(a => {
      if (a.status === 'pending' && dayjs(a.deadline).isSame(dayjs(), 'day')) {
        tasks.push({ type: 'assessment', app, data: a })
      }
    })
    app.interviews.forEach(i => {
      if (i.status === 'upcoming' && dayjs(i.datetime).isSame(dayjs(), 'day')) {
        tasks.push({ type: 'interview', app, data: i })
      }
    })
    return tasks
  }).sort((a, b) => {
    const timeA = a.type === 'assessment' ? a.data.deadline : a.data.datetime
    const timeB = b.type === 'assessment' ? b.data.deadline : b.data.datetime
    return dayjs(timeA).valueOf() - dayjs(timeB).valueOf()
  }).slice(0, 5)

  const recentMessages = messages.slice(0, 4)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>欢迎回来，张同学 👋</h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          今天是 {dayjs().format('YYYY年M月D日，dddd')} · 继续加油，好机会就在前方
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="投递总数"
              value={stats.total}
              suffix={<Tag color="green" icon={<ArrowUpOutlined />}>本周 +8</Tag>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/assessments')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="待完成测评"
              value={stats.assessment}
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>3个今日截止</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/interviews')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="面试中"
              value={stats.interviewing}
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>1个今日面试</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="已获 Offer"
              value={stats.offered}
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>转化率 {((stats.offered / stats.total) * 100).toFixed(1)}%</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 今日任务 + 消息通知 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={<span>⏰ 今日任务</span>}
            extra={<a onClick={() => navigate('/assessments')}>查看全部 <RightOutlined /></a>}
          >
            {todayTasks.length === 0 ? (
              <Empty description="暂无今日任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={todayTasks}
                renderItem={task => {
                  const isUrgent = task.type === 'assessment' && dayjs(task.data.deadline).diff(dayjs(), 'hour') <= 3
                  return (
                    <List.Item
                      style={{
                        borderLeft: `3px solid ${isUrgent ? '#EF4444' : '#3B82F6'}`,
                        paddingLeft: 12,
                        background: isUrgent ? '#FEF2F2' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(task.type === 'assessment' ? '/assessments' : '/interviews')}
                    >
                      <List.Item.Meta
                        title={`${task.app.company} - ${task.type === 'assessment' ? task.data.name : task.data.round}`}
                        description={
                          <div>
                            <div>{task.app.position}</div>
                            <div style={{ color: isUrgent ? '#EF4444' : '#3B82F6', fontWeight: 500 }}>
                              {task.type === 'assessment'
                                ? `⏱ ${dayjs(task.data.deadline).format('HH:mm')} 截止`
                                : `✓ 今天 ${dayjs(task.data.datetime).format('HH:mm')}`
                              }
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={<span>🔔 消息通知</span>}
            extra={<a onClick={() => navigate('/messages')}>查看全部 <RightOutlined /></a>}
          >
            <List
              dataSource={recentMessages}
              renderItem={msg => (
                <List.Item
                  style={{
                    background: msg.isRead ? 'transparent' : '#EFF6FF',
                    cursor: 'pointer',
                    paddingLeft: 12
                  }}
                  onClick={() => navigate(msg.targetUrl)}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 20 }}>
                      {msg.type === 'assessment' ? '📝' : msg.type === 'interview' ? '🎯' : msg.type === 'status_change' ? '✅' : '📤'}
                    </span>}
                    title={<span style={{ fontWeight: msg.isRead ? 'normal' : 600 }}>{msg.title}</span>}
                    description={<span style={{ fontSize: 12, color: '#94A3B8' }}>{dayjs(msg.createdAt).fromNow()}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
