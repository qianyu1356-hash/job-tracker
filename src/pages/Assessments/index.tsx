import { useState } from 'react'
import { Card, Button, Input, Select, Space, Tag, Modal, Form, DatePicker, TimePicker, message, Empty } from 'antd'
import { PlusOutlined, SearchOutlined, CloseOutlined, EditOutlined, CheckOutlined, LinkOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import type { Assessment, AssessmentStatus } from '../../types'
import dayjs from 'dayjs'

const statusConfig: Record<AssessmentStatus, { label: string; color: string }> = {
  pending: { label: '待完成', color: 'blue' },
  done: { label: '已完成', color: 'green' },
  expired: { label: '已失效', color: 'default' },
}

export default function AssessmentsPage() {
  const applications = useAppStore(s => s.applications)
  const addAssessment = useAppStore(s => s.addAssessment)
  const markAssessmentDone = useAppStore(s => s.markAssessmentDone)
  const updateAssessment = useAppStore(s => s.updateAssessment)

  const [statusFilter, setStatusFilter] = useState<AssessmentStatus>('pending')
  const [searchText, setSearchText] = useState('')
  const [jobFilter, setJobFilter] = useState<string>('')
  const [deadlineFilter, setDeadlineFilter] = useState<string>('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<{ appId: string; assessment: Assessment } | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  // 扁平化所有测评
  const allAssessments = applications.flatMap(app =>
    app.assessments.map(a => ({ app, assessment: a }))
  )

  // 筛选
  const filteredAssessments = allAssessments.filter(({ app, assessment }) => {
    const matchStatus = assessment.status === statusFilter
    const matchSearch = !searchText || app.company.includes(searchText) || app.position.includes(searchText)
    const matchJob = !jobFilter || `${app.company} - ${app.position}` === jobFilter

    let matchDeadline = true
    if (deadlineFilter === 'today') {
      matchDeadline = dayjs(assessment.deadline).isSame(dayjs(), 'day')
    } else if (deadlineFilter === '3days') {
      matchDeadline = dayjs(assessment.deadline).diff(dayjs(), 'day') <= 3
    } else if (deadlineFilter === 'week') {
      matchDeadline = dayjs(assessment.deadline).diff(dayjs(), 'day') <= 7
    }

    return matchStatus && matchSearch && matchJob && matchDeadline
  }).sort((a, b) => dayjs(a.assessment.deadline).valueOf() - dayjs(b.assessment.deadline).valueOf())

  const statusCounts = {
    pending: allAssessments.filter(a => a.assessment.status === 'pending').length,
    done: allAssessments.filter(a => a.assessment.status === 'done').length,
    expired: allAssessments.filter(a => a.assessment.status === 'expired').length,
  }

  const jobOptions = Array.from(new Set(applications.map(a => `${a.company} - ${a.position}`)))

  const getUrgencyStyle = (deadline: string, status: AssessmentStatus) => {
    if (status !== 'pending') return { borderColor: '#CBD5E1', badgeColor: 'default', badgeText: statusConfig[status].label }

    const hoursLeft = dayjs(deadline).diff(dayjs(), 'hour')
    if (hoursLeft <= 3) return { borderColor: '#EF4444', badgeColor: 'red', badgeText: '紧急' }
    if (dayjs(deadline).isSame(dayjs(), 'day')) return { borderColor: '#F59E0B', badgeColor: 'orange', badgeText: '今日截止' }
    const daysLeft = dayjs(deadline).diff(dayjs(), 'day')
    return { borderColor: '#10B981', badgeColor: 'green', badgeText: `${daysLeft}天内` }
  }

  const getCountdown = (deadline: string) => {
    const diff = dayjs(deadline).diff(dayjs())
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}天 ${hours}小时`
    if (hours > 0) return `${hours}小时 ${minutes}分`
    return `${minutes}分钟`
  }

  const handleAddAssessment = (values: any) => {
    const datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute())
    addAssessment(values.applicationId, {
      name: values.name,
      platform: values.platform,
      link: values.link,
      deadline: datetime.toISOString(),
      status: 'pending',
      note: values.note,
    })
    message.success('测评已添加')
    setAddModalOpen(false)
    form.resetFields()
  }

  const handleMarkDone = (appId: string, assessmentId: string) => {
    markAssessmentDone(appId, assessmentId)
    message.success('已标记完成')
  }

  const handleEditAssessment = (values: any) => {
    if (!selectedAssessment) return
    const datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute()).toISOString()
    updateAssessment(selectedAssessment.appId, selectedAssessment.assessment.id, {
      name: values.name,
      platform: values.platform,
      link: values.link,
      deadline: datetime,
      note: values.note,
    })
    message.success('测评已更新')
    setEditModalOpen(false)
    editForm.resetFields()
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>测评管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            手动添加测评
          </Button>
        </div>

        {/* 状态 Tab */}
        <Space size="small" style={{ marginBottom: 16 }}>
          {(['pending', 'done', 'expired'] as const).map(status => (
            <Button
              key={status}
              type={statusFilter === status ? 'primary' : 'default'}
              onClick={() => setStatusFilter(status)}
            >
              {statusConfig[status].label} ({statusCounts[status]})
            </Button>
          ))}
        </Space>

        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16, width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索公司或岗位"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="全部岗位"
            style={{ width: 250 }}
            value={jobFilter || undefined}
            onChange={setJobFilter}
            allowClear
            options={[{ label: '全部岗位', value: '' }, ...jobOptions.map(j => ({ label: j, value: j }))]}
          />
          <Select
            placeholder="全部时间"
            style={{ width: 150 }}
            value={deadlineFilter || undefined}
            onChange={setDeadlineFilter}
            allowClear
            options={[
              { label: '全部时间', value: '' },
              { label: '今天截止', value: 'today' },
              { label: '3天内', value: '3days' },
              { label: '本周内', value: 'week' },
            ]}
          />
          <Button icon={<CloseOutlined />} onClick={() => { setSearchText(''); setJobFilter(''); setDeadlineFilter('') }}>
            清除筛选
          </Button>
        </Space>

        {/* 卡片网格 */}
        {filteredAssessments.length === 0 ? (
          <Empty description="没有找到匹配的测评" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredAssessments.map(({ app, assessment }) => {
              const urgency = getUrgencyStyle(assessment.deadline, assessment.status)
              return (
                <Card
                  key={assessment.id}
                  size="small"
                  style={{ borderLeft: `4px solid ${urgency.borderColor}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{app.company}</div>
                      <div style={{ color: '#64748B', fontSize: 13 }}>{app.position}</div>
                    </div>
                    <Tag color={urgency.badgeColor}>{urgency.badgeText}</Tag>
                  </div>

                  {assessment.status === 'pending' && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 22, fontWeight: 600, color: urgency.borderColor }}>
                        {getCountdown(assessment.deadline)}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        截止 {dayjs(assessment.deadline).format(dayjs(assessment.deadline).isSame(dayjs(), 'day') ? '[今天] HH:mm' : 'YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>📋 {assessment.name}</div>
                    {assessment.platform && <div style={{ fontSize: 13, color: '#64748B' }}>🏢 {assessment.platform}</div>}
                  </div>

                  <Space size="small">
                    {assessment.link && (
                      <Button size="small" icon={<LinkOutlined />} href={assessment.link} target="_blank">
                        打开链接
                      </Button>
                    )}
                    {assessment.status === 'pending' && (
                      <>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setSelectedAssessment({ appId: app.id, assessment })
                            editForm.setFieldsValue({
                              name: assessment.name,
                              platform: assessment.platform,
                              link: assessment.link,
                              date: dayjs(assessment.deadline),
                              time: dayjs(assessment.deadline),
                              note: assessment.note,
                            })
                            setEditModalOpen(true)
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => handleMarkDone(app.id, assessment.id)}
                        >
                          标记完成
                        </Button>
                      </>
                    )}
                  </Space>
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      {/* 新增测评弹窗 */}
      <Modal
        title="新增测评"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddAssessment}>
          <Form.Item name="applicationId" label="关联岗位" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="搜索并选择岗位"
              options={applications.map(a => ({ label: `${a.company} - ${a.position}`, value: a.id }))}
            />
          </Form.Item>
          <Form.Item name="name" label="测评名称" rules={[{ required: true, max: 30 }]}>
            <Input placeholder="如：行测测评、性格测试" />
          </Form.Item>
          <Form.Item name="platform" label="测评平台">
            <Input placeholder="如：北森、智鼎、倍智" maxLength={20} />
          </Form.Item>
          <Form.Item name="link" label="测评链接" rules={[{ type: 'url', message: '请输入有效的URL' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="date" label="截止日期" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <DatePicker style={{ width: '100%' }} disabledDate={current => current && current < dayjs().startOf('day')} />
            </Form.Item>
            <Form.Item name="time" label="截止时间" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑测评弹窗 */}
      <Modal
        title={selectedAssessment ? `编辑测评 · ${selectedAssessment.assessment.name}` : '编辑测评'}
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); editForm.resetFields() }}
        onOk={() => editForm.submit()}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditAssessment}>
          <Form.Item name="name" label="测评名称" rules={[{ required: true, max: 30 }]}>
            <Input placeholder="如：行测测评、性格测试" />
          </Form.Item>
          <Form.Item name="platform" label="测评平台">
            <Input placeholder="如：北森、智鼎、倍智" maxLength={20} />
          </Form.Item>
          <Form.Item name="link" label="测评链接" rules={[{ type: 'url', message: '请输入有效的URL' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="date" label="截止日期" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="time" label="截止时间" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
