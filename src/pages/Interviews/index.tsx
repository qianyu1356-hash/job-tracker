import { useMemo, useState } from 'react'
import { App, Button, Card, Collapse, DatePicker, Empty, Form, Input, Modal, Select, Space, Tag, TimePicker } from 'antd'
import { DeleteOutlined, EditOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAppStore } from '../../store'
import type { Application, Interview, InterviewStatus } from '../../types'

const statusConfig: Record<InterviewStatus, { label: string; color: string }> = {
  upcoming: { label: '待面试', color: 'blue' },
  done: { label: '已完成', color: 'green' },
  abandoned: { label: '已放弃', color: 'default' },
}

const roundPresets = ['一面', '二面', '三面', 'HR 面', '终面']

const formatConfig: Record<string, string> = {
  online_feishu: '线上 - 飞书',
  online_dingtalk: '线上 - 钉钉',
  online_tencent: '线上 - 腾讯会议',
  online_zoom: '线上 - Zoom',
  offline: '线下',
}

export default function InterviewsPage() {
  const { message } = App.useApp()
  const applications = useAppStore((s) => s.applications)
  const addInterview = useAppStore((s) => s.addInterview)
  const updateInterview = useAppStore((s) => s.updateInterview)
  const deleteInterview = useAppStore((s) => s.deleteInterview)

  const [searchText, setSearchText] = useState('')
  const [roundFilter, setRoundFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<{ app: Application; interview: Interview } | null>(null)

  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [reviewForm] = Form.useForm()

  const allInterviews = useMemo(
    () =>
      applications
        .flatMap((app) =>
          app.interviews.map((interview) => {
            const autoStatus: InterviewStatus =
              interview.status === 'abandoned'
                ? 'abandoned'
                : dayjs(interview.datetime).isBefore(dayjs())
                  ? 'done'
                  : 'upcoming'
            return { app, interview: { ...interview, status: autoStatus } }
          }),
        )
        .sort((a, b) => dayjs(a.interview.datetime).valueOf() - dayjs(b.interview.datetime).valueOf()),
    [applications],
  )

  const filteredInterviews = useMemo(
    () =>
      allInterviews.filter(({ app, interview }) => {
        const matchSearch =
          !searchText ||
          app.company.toLowerCase().includes(searchText.toLowerCase()) ||
          app.position.toLowerCase().includes(searchText.toLowerCase())
        const matchRound = !roundFilter || interview.round === roundFilter
        const matchStatus = statusFilter === 'all' || interview.status === statusFilter
        return matchSearch && matchRound && matchStatus
      }),
    [allInterviews, roundFilter, searchText, statusFilter],
  )

  const counts = {
    all: allInterviews.length,
    upcoming: allInterviews.filter((item) => item.interview.status === 'upcoming').length,
    done: allInterviews.filter((item) => item.interview.status === 'done').length,
    abandoned: allInterviews.filter((item) => item.interview.status === 'abandoned').length,
  }

  const withSaving = async (fn: () => Promise<void>) => {
    setSaving(true)
    try {
      await fn()
    } finally {
      setSaving(false)
    }
  }

  const handleAddInterview = async (values: any) => {
    const datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute())
    await withSaving(async () => {
      await addInterview(values.applicationId, {
        round: values.round,
        datetime: datetime.toISOString(),
        format: values.format,
        location: values.location,
        interviewer: values.interviewer,
        status: 'upcoming',
      })
      message.success('面试已添加')
      setAddModalOpen(false)
      addForm.resetFields()
    }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '新增失败'))
  }

  const handleAbandon = (appId: string, interviewId: string) => {
    Modal.confirm({
      title: '确认放弃',
      content: '确定将这场面试标记为放弃吗？',
      okText: '确认放弃',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await withSaving(async () => {
          await updateInterview(appId, interviewId, { status: 'abandoned' })
          message.success('已标记为放弃')
        }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '操作失败'))
      },
    })
  }

  const handleDelete = (appId: string, interviewId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定继续吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await withSaving(async () => {
          await deleteInterview(appId, interviewId)
          message.success('面试已删除')
        }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '删除失败'))
      },
    })
  }

  const handleSaveReview = async (values: any) => {
    if (!selectedInterview) return
    await withSaving(async () => {
      await updateInterview(selectedInterview.app.id, selectedInterview.interview.id, {
        review: { questions: values.questions, improvements: values.improvements, feeling: values.feeling },
      })
      message.success('复盘已保存')
      setReviewModalOpen(false)
    }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '保存失败'))
  }

  const handleSaveEdit = async () => {
    if (!selectedInterview) return
    const values = editForm.getFieldsValue()
    const updates: Partial<Interview> = {
      round: values.round,
      format: values.format,
      location: values.location,
      interviewer: values.interviewer,
    }

    if (values.date && values.time) {
      updates.datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute()).toISOString()
    }

    await withSaving(async () => {
      await updateInterview(selectedInterview.app.id, selectedInterview.interview.id, updates)
      message.success('面试信息已更新')
      setEditModalOpen(false)
    }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '更新失败'))
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>面试管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            新增面试
          </Button>
        </div>

        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索公司或岗位"
            style={{ width: 220 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="全部轮次"
            style={{ width: 130 }}
            value={roundFilter || undefined}
            onChange={(v) => setRoundFilter(v || '')}
            allowClear
            options={roundPresets.map((round) => ({ label: round, value: round }))}
          />
          <Select
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: `全部 (${counts.all})`, value: 'all' },
              { label: `待面试 (${counts.upcoming})`, value: 'upcoming' },
              { label: `已完成 (${counts.done})`, value: 'done' },
              { label: `已放弃 (${counts.abandoned})`, value: 'abandoned' },
            ]}
          />
        </Space>

        {filteredInterviews.length === 0 ? (
          <Empty description="暂无面试安排" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
            {filteredInterviews.map(({ app, interview }) => {
              const isPast = interview.status === 'done'
              const isAbandoned = interview.status === 'abandoned'
              const borderColor = isAbandoned ? '#CBD5E1' : isPast ? '#10B981' : '#8B5CF6'
              const hasReview = interview.review && (interview.review.questions || interview.review.improvements || interview.review.feeling)

              return (
                <Card key={interview.id} size="small" style={{ borderLeft: `4px solid ${borderColor}`, opacity: isAbandoned ? 0.65 : 1 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{app.company}</span>
                    <span style={{ color: '#64748B', fontSize: 14, marginLeft: 8 }}>{app.position}</span>
                  </div>

                  <Space size={4} style={{ marginBottom: 8 }}>
                    <Tag color="purple">{interview.round}</Tag>
                    <Tag color={statusConfig[interview.status].color}>{statusConfig[interview.status].label}</Tag>
                  </Space>

                  <div style={{ color: '#64748B', fontSize: 13, marginBottom: 8 }}>
                    <div>时间：{dayjs(interview.datetime).format('YYYY-MM-DD (ddd) HH:mm')}</div>
                    {interview.format && <div>形式：{formatConfig[interview.format] || interview.format}</div>}
                    {interview.location && (
                      <div>
                        地点：
                        {interview.location.startsWith('http') ? (
                          <a href={interview.location} target="_blank" rel="noreferrer">
                            {interview.location}
                          </a>
                        ) : (
                          interview.location
                        )}
                      </div>
                    )}
                    {interview.interviewer && <div>面试官：{interview.interviewer}</div>}
                  </div>

                  {app.jd && (
                    <Collapse ghost size="small" style={{ marginBottom: 4 }}>
                      <Collapse.Panel header={<span style={{ fontSize: 12, color: '#64748B' }}>查看岗位 JD</span>} key="jd">
                        <div
                          style={{
                            fontSize: 12,
                            color: '#475569',
                            whiteSpace: 'pre-wrap',
                            maxHeight: 120,
                            overflow: 'auto',
                            background: '#F8FAFC',
                            padding: 8,
                            borderRadius: 6,
                          }}
                        >
                          {app.jd}
                        </div>
                      </Collapse.Panel>
                    </Collapse>
                  )}

                  {hasReview && (
                    <Collapse ghost size="small" style={{ marginBottom: 4 }}>
                      <Collapse.Panel header={<span style={{ fontSize: 12, color: '#92400E' }}>查看复盘</span>} key="review">
                        <div style={{ background: '#FFFBEB', borderRadius: 6, padding: 10, fontSize: 12 }}>
                          {interview.review?.questions && (
                            <div style={{ marginBottom: 6 }}>
                              <strong>问题记录：</strong>
                              {interview.review.questions}
                            </div>
                          )}
                          {interview.review?.improvements && (
                            <div style={{ marginBottom: 6 }}>
                              <strong>改进方向：</strong>
                              {interview.review.improvements}
                            </div>
                          )}
                          {interview.review?.feeling && (
                            <div>
                              <strong>整体感受：</strong>
                              {interview.review.feeling}
                            </div>
                          )}
                        </div>
                      </Collapse.Panel>
                    </Collapse>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
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
                        {hasReview ? '编辑复盘' : '写复盘'}
                      </Button>

                      {!isAbandoned && (
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setSelectedInterview({ app, interview })
                            editForm.setFieldsValue({
                              round: interview.round,
                              format: interview.format,
                              location: interview.location,
                              interviewer: interview.interviewer,
                              date: dayjs(interview.datetime),
                              time: dayjs(interview.datetime),
                            })
                            setEditModalOpen(true)
                          }}
                        >
                          编辑
                        </Button>
                      )}

                      {!isAbandoned && !isPast && (
                        <Button size="small" danger loading={saving} onClick={() => handleAbandon(app.id, interview.id)}>
                          放弃
                        </Button>
                      )}

                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={saving}
                        onClick={() => handleDelete(app.id, interview.id)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      <Modal
        title="新增面试"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false)
          addForm.resetFields()
        }}
        onOk={() => addForm.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={addForm} layout="vertical" onFinish={(values) => void handleAddInterview(values)}>
          <Form.Item name="applicationId" label="关联岗位" rules={[{ required: true, message: '请选择关联岗位' }]}>
            <Select
              showSearch
              placeholder="搜索并选择岗位"
              options={applications.map((a) => ({ label: `${a.company} - ${a.position}`, value: a.id }))}
            />
          </Form.Item>
          <Form.Item name="round" label="面试轮次" rules={[{ required: true, message: '请填写轮次' }]}>
            <div>
              <Space size="small" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                {roundPresets.map((round) => (
                  <Button key={round} size="small" onClick={() => addForm.setFieldValue('round', round)}>
                    {round}
                  </Button>
                ))}
              </Space>
              <Form.Item name="round" noStyle>
                <Input placeholder="或自定义输入，如：总监面" />
              </Form.Item>
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
            <Select allowClear placeholder="选择面试形式" options={Object.entries(formatConfig).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="location" label="地点/会议链接">
            <Input />
          </Form.Item>
          <Form.Item name="interviewer" label="面试官">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedInterview ? `编辑 · ${selectedInterview.app.company} · ${selectedInterview.interview.round}` : '编辑面试'}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => void handleSaveEdit()}
        width={560}
        confirmLoading={saving}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="面试轮次">
            <Space size="small" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
              {roundPresets.map((round) => (
                <Button key={round} size="small" onClick={() => editForm.setFieldValue('round', round)}>
                  {round}
                </Button>
              ))}
            </Space>
            <Form.Item name="round" noStyle>
              <Input placeholder="或自定义输入" />
            </Form.Item>
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="date" label="面试日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="time" label="面试时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="format" label="面试形式">
            <Select allowClear placeholder="选择面试形式" options={Object.entries(formatConfig).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="location" label="地点/会议链接">
            <Input />
          </Form.Item>
          <Form.Item name="interviewer" label="面试官">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedInterview ? `复盘 · ${selectedInterview.app.company} · ${selectedInterview.interview.round}` : '面试复盘'}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={() => reviewForm.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={reviewForm} layout="vertical" onFinish={(values) => void handleSaveReview(values)}>
          <Form.Item name="questions" label="面试问题记录">
            <Input.TextArea rows={4} placeholder="记录面试中被问到的问题..." maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="improvements" label="改进方向">
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
