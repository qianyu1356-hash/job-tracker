import { useState } from 'react'
import { Card, Button, Space, Tag, Modal, Form, Input, DatePicker, TimePicker, Select, message, Empty } from 'antd'
import { PlusOutlined, CalendarOutlined, UnorderedListOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import type { Application, Interview, InterviewStatus } from '../../types'
import dayjs from 'dayjs'

const statusConfig: Record<InterviewStatus, { label: string; color: string }> = {
  upcoming: { label: '待面试', color: 'blue' },
  done: { label: '已完成', color: 'green' },
  abandoned: { label: '已放弃', color: 'default' },
}

const roundPresets = ['一面', '二面', '三面', 'HR面', '终面']

export default function InterviewsPage() {
  const applications = useAppStore(s => s.applications)
  const addInterview = useAppStore(s => s.addInterview)
  const updateInterview = useAppStore(s => s.updateInterview)

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [searchText, setSearchText] = useState('')
  const [roundFilter, setRoundFilter] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<{ app: Application; interview: Interview } | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [reviewForm] = Form.useForm()

  const allInterviews = applications.flatMap(app =>
    app.interviews.map(i => ({ app, interview: i }))
  ).sort((a, b) => dayjs(a.interview.datetime).valueOf() - dayjs(b.interview.datetime).valueOf())

  const filteredInterviews = allInterviews.filter(({ app, interview }) => {
    const matchSearch = !searchText || app.company.includes(searchText) || app.position.includes(searchText)
    const matchRound = !roundFilter || (roundFilter === '放弃' ? interview.status === 'abandoned' : interview.round === roundFilter)
    return matchSearch && matchRound
  })

  const calendarData: Record<string, typeof allInterviews> = {}
  allInterviews.forEach(item => {
    const date = dayjs(item.interview.datetime).format('YYYY-MM-DD')
    if (!calendarData[date]) calendarData[date] = []
    calendarData[date].push(item)
  })

  const handleAddInterview = (values: any) => {
    const datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute())
    addInterview(values.applicationId, {
      round: values.round,
      datetime: datetime.toISOString(),
      format: values.format,
      location: values.location,
      interviewer: values.interviewer,
      status: 'upcoming',
      note: values.note,
    })
    message.success('面试已添加')
    setAddModalOpen(false)
    addForm.resetFields()
  }

  const handleAbandon = (appId: string, interviewId: string) => {
    Modal.confirm({
      title: '确认放弃',
      content: '确认放弃这场面试吗？',
      okText: '确认放弃',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        updateInterview(appId, interviewId, { status: 'abandoned' })
        message.success('已标记为放弃')
      }
    })
  }

  const handleSaveReview = (values: any) => {
    if (!selectedInterview) return
    updateInterview(selectedInterview.app.id, selectedInterview.interview.id, {
      review: { questions: values.questions, improvements: values.improvements, feeling: values.feeling }
    })
    message.success('复盘已保存')
    setReviewModalOpen(false)
  }

  const today = dayjs()
  const startOfMonth = today.startOf('month')
  const calendarDays: (dayjs.Dayjs | null)[] = [
    ...Array(startOfMonth.day()).fill(null),
    ...Array.from({ length: today.daysInMonth() }, (_, i) => startOfMonth.add(i, 'day'))
  ]

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>面试管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>新增面试</Button>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<CalendarOutlined />} type={viewMode === 'calendar' ? 'primary' : 'default'} onClick={() => setViewMode('calendar')}>日历视图</Button>
          <Button icon={<UnorderedListOutlined />} type={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>列表视图</Button>
        </Space>

        {viewMode === 'calendar' && (
          <div>
            <h3 style={{ marginBottom: 16 }}>{today.format('YYYY年M月')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#E2E8F0', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (
                <div key={d} style={{ background: '#F8FAFC', padding: 10, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748B' }}>{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                const dateStr = day?.format('YYYY-MM-DD') || ''
                const dayInterviews = day ? (calendarData[dateStr] || []) : []
                const isToday = day?.isSame(today, 'day')
                return (
                  <div key={idx} style={{ background: isToday ? '#EFF6FF' : day ? '#fff' : '#FAFBFC', minHeight: 100, padding: 8 }}>
                    {day && (
                      <>
                        <div style={{ fontSize: 14, fontWeight: isToday ? 600 : 400, color: isToday ? '#3B82F6' : '#0F172A', marginBottom: 4 }}>{day.date()}</div>
                        {dayInterviews.map(({ app, interview }) => (
                          <div
                            key={interview.id}
                            onClick={() => {
                              setSelectedInterview({ app, interview })
                              editForm.setFieldsValue({ round: interview.round, location: interview.location, interviewer: interview.interviewer })
                              setEditModalOpen(true)
                            }}
                            style={{ background: '#EDE9FE', color: '#5B21B6', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {dayjs(interview.datetime).format('HH:mm')} {app.company.slice(0, 3)}{interview.round}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Input placeholder="搜索公司或岗位" style={{ width: 200 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
              <Select
                placeholder="全部轮次"
                style={{ width: 150 }}
                value={roundFilter || undefined}
                onChange={setRoundFilter}
                allowClear
                options={[...roundPresets.map(r => ({ label: r, value: r })), { label: '已放弃', value: '放弃' }]}
              />
            </Space>
            {filteredInterviews.length === 0 ? (
              <Empty description="暂无面试安排" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredInterviews.map(({ app, interview }) => (
                  <Card
                    key={interview.id}
                    size="small"
                    style={{
                      borderLeft: `4px solid ${interview.status === 'abandoned' ? '#CBD5E1' : '#8B5CF6'}`,
                      opacity: interview.status === 'abandoned' ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{app.company}</span>
                        <span style={{ color: '#64748B', fontSize: 14, marginLeft: 8 }}>{app.position}</span>
                      </div>
                      <Tag color="purple">{interview.round}</Tag>
                    </div>
                    <div style={{ color: '#64748B', fontSize: 14, marginBottom: 8 }}>
                      <div>📅 {dayjs(interview.datetime).format('YYYY-MM-DD (ddd) HH:mm')}</div>
                      {interview.location && <div>📍 {interview.location}</div>}
                      {interview.interviewer && <div>👤 面试官：{interview.interviewer}</div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={statusConfig[interview.status].color}>{statusConfig[interview.status].label}</Tag>
                      <Space size="small">
                        <Button
                          size="small"
                          icon={<MessageOutlined />}
                          onClick={() => {
                            setSelectedInterview({ app, interview })
                            reviewForm.setFieldsValue(interview.review || {})
                            setReviewModalOpen(true)
                          }}
                        >
                          复盘
                        </Button>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setSelectedInterview({ app, interview })
                            editForm.setFieldsValue({ round: interview.round, location: interview.location, interviewer: interview.interviewer })
                            setEditModalOpen(true)
                          }}
                        >
                          编辑
                        </Button>
                        {interview.status !== 'abandoned' && (
                          <Button size="small" danger onClick={() => handleAbandon(app.id, interview.id)}>放弃</Button>
                        )}
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 新增面试弹窗 */}
      <Modal title="新增面试" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} onOk={() => addForm.submit()} width={600}>
        <Form form={addForm} layout="vertical" onFinish={handleAddInterview}>
          <Form.Item name="applicationId" label="关联岗位" rules={[{ required: true }]}>
            <Select showSearch placeholder="搜索并选择岗位" options={applications.map(a => ({ label: `${a.company} - ${a.position}`, value: a.id }))} />
          </Form.Item>
          <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
            <div>
              <Space size="small" style={{ marginBottom: 8 }}>
                {roundPresets.map(r => <Button key={r} size="small" onClick={() => addForm.setFieldValue('round', r)}>{r}</Button>)}
              </Space>
              <Input placeholder="或自定义输入，如：总监面" />
            </div>
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="date" label="面试日期" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="time" label="面试时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="format" label="面试形式">
            <Select allowClear options={[
              { label: '线上 - 飞书', value: 'online_feishu' },
              { label: '线上 - 钉钉', value: 'online_dingtalk' },
              { label: '线上 - 腾讯会议', value: 'online_tencent' },
              { label: '线下', value: 'offline' },
            ]} />
          </Form.Item>
          <Form.Item name="location" label="地点/会议链接"><Input placeholder="线下地址或会议链接" /></Form.Item>
          <Form.Item name="interviewer" label="面试官"><Input placeholder="面试官姓名（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* 编辑面试弹窗 */}
      <Modal
        title={selectedInterview ? `${selectedInterview.app.company} · ${selectedInterview.interview.round}` : '编辑面试'}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => {
          const values = editForm.getFieldsValue()
          if (selectedInterview) {
            updateInterview(selectedInterview.app.id, selectedInterview.interview.id, {
              round: values.round,
              location: values.location,
              interviewer: values.interviewer,
            })
            message.success('面试信息已更新')
          }
          setEditModalOpen(false)
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="round" label="面试轮次"><Input /></Form.Item>
          <Form.Item name="location" label="地点/会议链接"><Input /></Form.Item>
          <Form.Item name="interviewer" label="面试官"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* 复盘弹窗 */}
      <Modal
        title={selectedInterview ? `复盘 · ${selectedInterview.app.company} · ${selectedInterview.interview.round}` : '面试复盘'}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={() => reviewForm.submit()}
        width={600}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleSaveReview}>
          <Form.Item name="questions" label="面试问题记录">
            <Input.TextArea rows={4} placeholder="记录面试中被问到的问题..." maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="improvements" label="回答漏洞/改进方向">
            <Input.TextArea rows={4} placeholder="哪些问题没回答好？下次怎么改进？" maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="feeling" label="整体感受">
            <Input.TextArea rows={2} placeholder="对这次面试的整体评价..." maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
