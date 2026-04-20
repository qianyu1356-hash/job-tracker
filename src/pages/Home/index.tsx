import { useState } from 'react'
import { Card, Row, Col, Statistic, List, Tag, Empty, Checkbox, Button, Input, Modal, App } from 'antd'
import { ArrowUpOutlined, RightOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default function HomePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const applications = useAppStore(s => s.applications)
  const goal = useAppStore(s => s.goal)
  const todos = useAppStore(s => s.todos)
  const setGoal = useAppStore(s => s.setGoal)
  const addTodo = useAppStore(s => s.addTodo)
  const toggleTodo = useAppStore(s => s.toggleTodo)
  const deleteTodo = useAppStore(s => s.deleteTodo)

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalInput, setGoalInput] = useState(goal)
  const [todoModalOpen, setTodoModalOpen] = useState(false)
  const [todoInput, setTodoInput] = useState('')

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

      {/* 今日任务 + 记录板 */}
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
            title={<span>📋 我的记录板</span>}
            extra={
              <Button size="small" icon={<PlusOutlined />} onClick={() => { setTodoInput(''); setTodoModalOpen(true) }}>
                添加待办
              </Button>
            }
          >
            {/* 目标横幅 */}
            <div
              onClick={() => { setGoalInput(goal); setGoalModalOpen(true) }}
              style={{
                background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: '#5B21B6' }}>{goal}</span>
              <EditOutlined style={{ color: '#7C3AED', fontSize: 14 }} />
            </div>

            {/* 待办列表 */}
            {todos.length === 0 ? (
              <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todos.map(todo => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                    />
                    <span style={{
                      flex: 1, fontSize: 14,
                      color: todo.done ? '#94A3B8' : '#0F172A',
                      textDecoration: todo.done ? 'line-through' : 'none'
                    }}>
                      {todo.content}
                    </span>
                    <Button
                      type="text" size="small" danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteTodo(todo.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 编辑目标弹窗 */}
      <Modal
        title="编辑目标"
        open={goalModalOpen}
        onCancel={() => setGoalModalOpen(false)}
        onOk={() => { setGoal(goalInput); setGoalModalOpen(false); message.success('目标已更新') }}
        okText="保存"
        cancelText="取消"
      >
        <Input.TextArea
          rows={3}
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          placeholder="写下你的目标或激励语..."
          maxLength={100}
          showCount
        />
      </Modal>

      {/* 添加待办弹窗 */}
      <Modal
        title="添加待办"
        open={todoModalOpen}
        onCancel={() => setTodoModalOpen(false)}
        onOk={() => {
          if (!todoInput.trim()) return
          addTodo(todoInput.trim())
          setTodoModalOpen(false)
          message.success('待办已添加')
        }}
        okText="添加"
        cancelText="取消"
      >
        <Input
          value={todoInput}
          onChange={e => setTodoInput(e.target.value)}
          placeholder="输入待办内容..."
          maxLength={50}
          onPressEnter={() => {
            if (!todoInput.trim()) return
            addTodo(todoInput.trim())
            setTodoModalOpen(false)
            message.success('待办已添加')
          }}
        />
      </Modal>
    </div>
  )
}
