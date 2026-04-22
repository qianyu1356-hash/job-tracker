import { useEffect, useMemo, useState } from 'react'
import { App, Button, Card, Checkbox, Col, Empty, Input, List, Modal, Row, Statistic, Tooltip } from 'antd'
import { ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useAppStore } from '../../store'
import { api } from '../../api/client'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

type CalendarEvent =
  | { type: 'interview'; app: { company: string; position: string }; interview: { round: string; datetime: string } }
  | { type: 'assessment'; app: { company: string; position: string }; assessment: { name: string; deadline: string; status: string } }

export default function HomePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()

  const applications = useAppStore((s) => s.applications)
  const goal = useAppStore((s) => s.goal)
  const todos = useAppStore((s) => s.todos)
  const setGoal = useAppStore((s) => s.setGoal)
  const addTodo = useAppStore((s) => s.addTodo)
  const toggleTodo = useAppStore((s) => s.toggleTodo)
  const deleteTodo = useAppStore((s) => s.deleteTodo)

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalInput, setGoalInput] = useState(goal)
  const [todoModalOpen, setTodoModalOpen] = useState(false)
  const [todoInput, setTodoInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [studentSurname, setStudentSurname] = useState('')

  useEffect(() => {
    void api
      .get<{ name?: string }>('/settings/profile')
      .then((profile) => {
        const rawName = (profile?.name || '').trim()
        if (rawName) {
          setStudentSurname(rawName.slice(0, 1))
        } else {
          setStudentSurname('')
        }
      })
      .catch(() => {
        setStudentSurname('')
      })
  }, [])

  const today = dayjs()
  const todayStart = today.startOf('day')
  const weekStart = today.startOf('week')
  const weekEnd = today.endOf('week')

  const summary = useMemo(() => {
    const pendingAssessments = applications.flatMap((app) =>
      app.assessments.filter((assessment) => assessment.status === 'pending'),
    )
    const upcomingInterviews = applications.flatMap((app) =>
      app.interviews.filter((interview) => interview.status === 'upcoming'),
    )

    const todayAssessmentCount = pendingAssessments.filter((assessment) =>
      dayjs(assessment.deadline).isSame(today, 'day'),
    ).length
    const todayInterviewCount = upcomingInterviews.filter((interview) =>
      dayjs(interview.datetime).isSame(today, 'day'),
    ).length
    const weekAddedCount = applications.filter((app) => {
      if (!app.applyDate) return false
      const d = dayjs(app.applyDate)
      return (d.isSame(weekStart, 'day') || d.isAfter(weekStart)) && (d.isSame(weekEnd, 'day') || d.isBefore(weekEnd))
    }).length

    return {
      total: applications.length,
      assessment: pendingAssessments.length,
      interviewing: upcomingInterviews.length,
      offered: applications.filter((app) => app.status === 'offered').length,
      todayAssessmentCount,
      todayInterviewCount,
      weekAddedCount,
    }
  }, [applications, today, weekEnd, weekStart])

  const todayTasks = useMemo(
    () =>
      applications
        .flatMap((app) => {
          const tasks: Array<{ type: 'assessment' | 'interview'; app: typeof app; data: any }> = []

          app.assessments.forEach((assessment) => {
            if (assessment.status === 'pending' && dayjs(assessment.deadline).isSame(today, 'day')) {
              tasks.push({ type: 'assessment', app, data: assessment })
            }
          })

          app.interviews.forEach((interview) => {
            if (interview.status === 'upcoming' && dayjs(interview.datetime).isSame(today, 'day')) {
              tasks.push({ type: 'interview', app, data: interview })
            }
          })

          return tasks
        })
        .sort((a, b) => {
          const ta = a.type === 'assessment' ? a.data.deadline : a.data.datetime
          const tb = b.type === 'assessment' ? b.data.deadline : b.data.datetime
          return dayjs(ta).valueOf() - dayjs(tb).valueOf()
        })
        .slice(0, 5),
    [applications, today],
  )

  const startOfMonth = today.startOf('month')
  const calendarDays: Array<dayjs.Dayjs | null> = [
    ...Array(startOfMonth.day()).fill(null),
    ...Array.from({ length: today.daysInMonth() }, (_, i) => startOfMonth.add(i, 'day')),
  ]

  const calendarData = useMemo(() => {
    const data: Record<string, CalendarEvent[]> = {}
    applications.forEach((app) => {
      app.interviews.forEach((interview) => {
        if (interview.status !== 'upcoming') return
        const date = dayjs(interview.datetime).format('YYYY-MM-DD')
        if (!data[date]) data[date] = []
        data[date].push({ type: 'interview', app, interview })
      })
      app.assessments.forEach((assessment) => {
        if (assessment.status !== 'pending') return
        const date = dayjs(assessment.deadline).format('YYYY-MM-DD')
        if (!data[date]) data[date] = []
        data[date].push({ type: 'assessment', app, assessment })
      })
    })
    return data
  }, [applications])

  const withSaving = async (fn: () => Promise<void>) => {
    setSaving(true)
    try {
      await fn()
    } finally {
      setSaving(false)
    }
  }

  const displayName = studentSurname ? `${studentSurname}同学` : '同学'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          欢迎回来，{displayName} <span style={{ fontSize: 22 }}>👋</span>
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
          今天是 {today.format('YYYY年M月D日，dddd')}，继续加油，好机会就在前方
        </p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="投递总数"
              value={summary.total}
              suffix={
                <span style={{ fontSize: 14, color: '#16A34A' }}>
                  <ArrowUpOutlined /> 本周 +{summary.weekAddedCount}
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/assessments')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="待完成测评"
              value={summary.assessment}
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>{summary.todayAssessmentCount} 个今日截止</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/interviews')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="面试中"
              value={summary.interviewing}
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>{summary.todayInterviewCount} 个今日面试</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="已获 Offer"
              value={summary.offered}
              suffix={
                <span style={{ fontSize: 14, color: '#64748B' }}>
                  转化率 {summary.total ? ((summary.offered / summary.total) * 100).toFixed(1) : 0}%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
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
                renderItem={(task) => {
                  const isUrgent =
                    task.type === 'assessment' &&
                    dayjs(task.data.deadline).isAfter(todayStart) &&
                    dayjs(task.data.deadline).diff(today, 'hour', true) <= 3

                  return (
                    <List.Item
                      style={{
                        borderLeft: `3px solid ${isUrgent ? '#EF4444' : '#3B82F6'}`,
                        paddingLeft: 12,
                        background: isUrgent ? '#FEF2F2' : 'transparent',
                        cursor: 'pointer',
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
                                ? `⏰ ${dayjs(task.data.deadline).format('HH:mm')} 截止`
                                : `📅 今天 ${dayjs(task.data.datetime).format('HH:mm')}`}
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
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setTodoInput('')
                  setTodoModalOpen(true)
                }}
              >
                添加待办
              </Button>
            }
          >
            <div
              onClick={() => {
                setGoalInput(goal)
                setGoalModalOpen(true)
              }}
              style={{
                background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: '#5B21B6' }}>{goal || '点击设置目标'}</span>
              <EditOutlined style={{ color: '#7C3AED', fontSize: 14 }} />
            </div>

            {todos.length === 0 ? (
              <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todos.map((todo) => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      checked={todo.done}
                      onChange={() => {
                        void withSaving(async () => {
                          await toggleTodo(todo.id)
                        })
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: todo.done ? '#94A3B8' : '#0F172A',
                        textDecoration: todo.done ? 'line-through' : 'none',
                      }}
                    >
                      {todo.content}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        void withSaving(async () => {
                          await deleteTodo(todo.id)
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title={<span>🗓 本月日历 · {today.format('YYYY年M月')}</span>}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                background: '#E2E8F0',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((d) => (
                <div
                  key={d}
                  style={{ background: '#F8FAFC', padding: 8, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748B' }}
                >
                  {d}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dateStr = day?.format('YYYY-MM-DD') || ''
                const dayEvents = day ? calendarData[dateStr] || [] : []
                const isToday = day?.isSame(today, 'day')
                const displayEvents = dayEvents.slice(0, 3)
                const moreCount = dayEvents.length - 3

                return (
                  <div
                    key={idx}
                    style={{ background: isToday ? '#EFF6FF' : day ? '#fff' : '#FAFBFC', minHeight: 80, padding: 6 }}
                  >
                    {day && (
                      <>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isToday ? 600 : 400,
                            color: isToday ? '#3B82F6' : '#0F172A',
                            marginBottom: 4,
                          }}
                        >
                          {day.date()}
                        </div>
                        {displayEvents.map((event, i) => {
                          const isInterview = event.type === 'interview'
                          const tooltipContent = isInterview
                            ? `${event.app.company} - ${event.app.position}\n${event.interview.round}\n${dayjs(event.interview.datetime).format('HH:mm')}`
                            : `${event.app.company} - ${event.app.position}\n${event.assessment.name}\n截止 ${dayjs(event.assessment.deadline).format('HH:mm')}`

                          return (
                            <Tooltip key={i} title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipContent}</div>}>
                              <div
                                onClick={() => navigate(isInterview ? '/interviews' : '/assessments')}
                                style={{
                                  background: isInterview ? '#EDE9FE' : '#FEF3C7',
                                  color: isInterview ? '#5B21B6' : '#92400E',
                                  borderRadius: 3,
                                  padding: '2px 4px',
                                  fontSize: 10,
                                  marginBottom: 2,
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {isInterview
                                  ? `${dayjs(event.interview.datetime).format('HH:mm')} ${event.app.company.slice(0, 4)}·${event.interview.round}`
                                  : `${dayjs(event.assessment.deadline).format('HH:mm')} ${event.app.company.slice(0, 4)}·${event.assessment.name.slice(0, 6)}`}
                              </div>
                            </Tooltip>
                          )
                        })}
                        {moreCount > 0 && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>+{moreCount}</div>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="编辑目标"
        open={goalModalOpen}
        onCancel={() => setGoalModalOpen(false)}
        onOk={() => {
          void withSaving(async () => {
            await setGoal(goalInput)
            setGoalModalOpen(false)
            message.success('目标已更新')
          })
        }}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
      >
        <Input.TextArea
          rows={3}
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="写下你的目标或激励语..."
          maxLength={100}
          showCount
        />
      </Modal>

      <Modal
        title="添加待办"
        open={todoModalOpen}
        onCancel={() => setTodoModalOpen(false)}
        onOk={() => {
          if (!todoInput.trim()) return
          void withSaving(async () => {
            await addTodo(todoInput.trim())
            setTodoInput('')
            setTodoModalOpen(false)
            message.success('待办已添加')
          })
        }}
        okText="添加"
        cancelText="取消"
        confirmLoading={saving}
      >
        <Input
          value={todoInput}
          onChange={(e) => setTodoInput(e.target.value)}
          placeholder="输入待办事项..."
          maxLength={100}
          onPressEnter={() => {
            if (!todoInput.trim()) return
            void withSaving(async () => {
              await addTodo(todoInput.trim())
              setTodoInput('')
              setTodoModalOpen(false)
              message.success('待办已添加')
            })
          }}
        />
      </Modal>
    </div>
  )
}
