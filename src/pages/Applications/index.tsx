import { useState } from 'react'
import { App, Card, Button, Input, Space, Table, Tag, Drawer, Descriptions, List, Modal, Form, Select, DatePicker, TimePicker, Divider } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import type { Application, ApplicationStatus, JobType } from '../../types'
import dayjs from 'dayjs'

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  submitted: { label: '已投递', color: 'default' },
  screening: { label: '待筛选', color: 'blue' },
  assessment: { label: '待测评', color: 'gold' },
  interviewing: { label: '面试中', color: 'purple' },
  rejected: { label: '已挂', color: 'red' },
  offered: { label: '已offer', color: 'green' },
}

const jobTypeConfig: Record<JobType, string> = {
  daily_intern: '日常实习',
  summer_intern: '暑期实习',
  winter_intern: '寒假实习',
  autumn_recruit: '秋招',
  spring_recruit: '春招',
}

const roundPresets = ['一面', '二面', '三面', 'HR面', '终面']

export default function ApplicationsPage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const applications = useAppStore(s => s.applications)
  const resumes = useAppStore(s => s.resumes)
  const addApplication = useAppStore(s => s.addApplication)
  const updateApplication = useAppStore(s => s.updateApplication)
  const updateStatus = useAppStore(s => s.updateStatus)
  const deleteApplication = useAppStore(s => s.deleteApplication)
  const addAssessment = useAppStore(s => s.addAssessment)
  const addInterview = useAppStore(s => s.addInterview)

  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [cityFilter, setCityFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const selectedApp = applications.find(a => a.id === selectedAppId) || null
  const drawerOpen = selectedAppId !== null

  // 编辑状态
  const [editingSection, setEditingSection] = useState<'basic' | 'jd' | null>(null)
  const [editValues, setEditValues] = useState<Partial<Application>>({})

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addAssessmentOpen, setAddAssessmentOpen] = useState(false)
  const [addInterviewOpen, setAddInterviewOpen] = useState(false)
  const [addForm] = Form.useForm()
  const [assessmentForm] = Form.useForm()
  const [interviewForm] = Form.useForm()

  // 城市列表（从数据中提取）
  const cities = Array.from(new Set(applications.map(a => a.city).filter(Boolean))) as string[]

  const filteredApps = applications.filter(app => {
    const matchSearch = !searchText || app.company.includes(searchText) || app.position.includes(searchText)
    const matchStatus = statusFilter === 'all' || app.status === statusFilter
    const matchCity = !cityFilter || app.city === cityFilter
    const matchJobType = !jobTypeFilter || app.jobType === jobTypeFilter
    return matchSearch && matchStatus && matchCity && matchJobType
  })

  const statusCounts = {
    all: applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    screening: applications.filter(a => a.status === 'screening').length,
    assessment: applications.filter(a => a.status === 'assessment').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    offered: applications.filter(a => a.status === 'offered').length,
  }

  const columns = [
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      render: (text: string, record: Application) => (
        <a onClick={() => setSelectedAppId(record.id)}>{text}</a>
      ),
    },
    { title: '岗位', dataIndex: 'position', key: 'position' },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      render: (city?: string) => city ? <Tag>{city}</Tag> : '-',
    },
    {
      title: '岗位分类',
      dataIndex: 'jobType',
      key: 'jobType',
      render: (type: JobType) => jobTypeConfig[type],
    },
    {
      title: '投递时间',
      dataIndex: 'applyDate',
      key: 'applyDate',
      sorter: (a: Application, b: Application) => dayjs(a.applyDate).valueOf() - dayjs(b.applyDate).valueOf(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '进度状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ApplicationStatus) => (
        <Tag color={statusConfig[status].color}>{statusConfig[status].label}</Tag>
      ),
    },
  ]

  const handleAddApplication = (values: any) => {
    addApplication({
      company: values.company,
      position: values.position,
      city: values.city,
      jobType: values.jobType,
      applyDate: values.applyDate.format('YYYY-MM-DD'),
      channel: values.channel,
      link: values.link,
      resumeId: values.resumeId,
      jd: values.jd,
      note: values.note,
      status: 'submitted',
    })
    message.success('投递记录已添加')
    setAddModalOpen(false)
    addForm.resetFields()
  }

  const startEdit = (section: 'basic' | 'jd') => {
    if (!selectedApp) return
    setEditingSection(section)
    setEditValues({ ...selectedApp })
  }

  const saveEdit = () => {
    if (!selectedApp) return
    updateApplication(selectedApp.id, editValues)
    setEditingSection(null)
    message.success('已保存')
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setEditValues({})
  }

  const handleAddAssessment = (values: any) => {
    if (!selectedApp) return
    const datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute())
    addAssessment(selectedApp.id, {
      name: values.name,
      platform: values.platform,
      link: values.link,
      deadline: datetime.toISOString(),
      status: 'pending',
      note: values.note,
    })
    message.success('测评已添加')
    setAddAssessmentOpen(false)
    assessmentForm.resetFields()
  }

  const handleAddInterview = (values: any) => {
    if (!selectedApp) return
    const datetime = dayjs(values.date).hour(values.time.hour()).minute(values.time.minute())
    addInterview(selectedApp.id, {
      round: values.round,
      datetime: datetime.toISOString(),
      format: values.format,
      location: values.location,
      interviewer: values.interviewer,
      status: 'upcoming',
    })
    message.success('面试已添加')
    setAddInterviewOpen(false)
    interviewForm.resetFields()
  }

  const EditActions = ({ section }: { section: 'basic' | 'jd' }) => (
    editingSection === section ? (
      <Space size="small">
        <Button size="small" type="primary" icon={<SaveOutlined />} onClick={saveEdit}>保存</Button>
        <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit}>取消</Button>
      </Space>
    ) : (
      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => startEdit(section)}>编辑</Button>
    )
  )

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>投递管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>新增投递</Button>
        </div>

        {/* 状态筛选 Tab */}
        <Space size="small" wrap style={{ marginBottom: 16 }}>
          {(['all', 'submitted', 'screening', 'assessment', 'interviewing', 'rejected', 'offered'] as const).map(status => (
            <Button
              key={status}
              type={statusFilter === status ? 'primary' : 'default'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? '全部' : statusConfig[status].label} ({statusCounts[status]})
            </Button>
          ))}
        </Space>

        {/* 工具栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Input
              placeholder="搜索公司或岗位"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="城市"
              style={{ width: 120 }}
              value={cityFilter || undefined}
              onChange={setCityFilter}
              allowClear
              options={cities.map(c => ({ label: c, value: c }))}
            />
            <Select
              placeholder="岗位分类"
              style={{ width: 130 }}
              value={jobTypeFilter || undefined}
              onChange={setJobTypeFilter}
              allowClear
              options={Object.entries(jobTypeConfig).map(([k, v]) => ({ label: v, value: k }))}
            />
          </Space>
        </div>

        <Table dataSource={filteredApps} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={selectedApp ? `${selectedApp.company} · ${selectedApp.position}` : ''}
        size="large"
        open={drawerOpen}
        onClose={() => { setSelectedAppId(null); setEditingSection(null) }}
      >
        {selectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 基础信息 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>基础信息</h3>
                <EditActions section="basic" />
              </div>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="公司">
                  {editingSection === 'basic'
                    ? <Input size="small" value={editValues.company} onChange={e => setEditValues(v => ({ ...v, company: e.target.value }))} />
                    : selectedApp.company}
                </Descriptions.Item>
                <Descriptions.Item label="岗位">
                  {editingSection === 'basic'
                    ? <Input size="small" value={editValues.position} onChange={e => setEditValues(v => ({ ...v, position: e.target.value }))} />
                    : selectedApp.position}
                </Descriptions.Item>
                <Descriptions.Item label="城市">
                  {editingSection === 'basic'
                    ? <Input size="small" value={editValues.city} onChange={e => setEditValues(v => ({ ...v, city: e.target.value }))} />
                    : selectedApp.city || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="岗位分类">
                  {editingSection === 'basic'
                    ? <Select size="small" style={{ width: '100%' }} value={editValues.jobType} onChange={v => setEditValues(p => ({ ...p, jobType: v }))}
                        options={Object.entries(jobTypeConfig).map(([k, l]) => ({ label: l, value: k }))} />
                    : jobTypeConfig[selectedApp.jobType]}
                </Descriptions.Item>
                <Descriptions.Item label="投递时间">
                  {editingSection === 'basic'
                    ? <DatePicker size="small" value={dayjs(editValues.applyDate)} onChange={d => setEditValues(v => ({ ...v, applyDate: d?.format('YYYY-MM-DD') }))} />
                    : selectedApp.applyDate}
                </Descriptions.Item>
                <Descriptions.Item label="进度状态">
                  <Select
                    size="small"
                    value={selectedApp.status}
                    style={{ width: '100%' }}
                    onChange={v => updateStatus(selectedApp.id, v)}
                    options={Object.entries(statusConfig).map(([k, v]) => ({ label: v.label, value: k }))}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="关联简历" span={2}>
                  {editingSection === 'basic'
                    ? <Select size="small" style={{ width: '100%' }} value={editValues.resumeId} allowClear placeholder="选择简历"
                        onChange={v => setEditValues(p => ({ ...p, resumeId: v }))}
                        options={resumes.map(r => ({ label: r.name, value: r.id }))} />
                    : resumes.find(r => r.id === selectedApp.resumeId)?.name || <span style={{ color: '#94A3B8' }}>未关联</span>}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* JD 和渠道 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>JD 和渠道</h3>
                <EditActions section="jd" />
              </div>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="投递渠道">
                  {editingSection === 'jd'
                    ? <Input size="small" value={editValues.channel} onChange={e => setEditValues(v => ({ ...v, channel: e.target.value }))} />
                    : selectedApp.channel || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="官网链接">
                  {editingSection === 'jd'
                    ? <Input size="small" value={editValues.link} onChange={e => setEditValues(v => ({ ...v, link: e.target.value }))} />
                    : selectedApp.link ? <a href={selectedApp.link} target="_blank" rel="noreferrer">打开链接 ↗</a> : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="岗位JD">
                  {editingSection === 'jd'
                    ? <Input.TextArea rows={5} value={editValues.jd} onChange={e => setEditValues(v => ({ ...v, jd: e.target.value }))} />
                    : selectedApp.jd ? <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: 120, overflow: 'auto' }}>{selectedApp.jd}</div> : '-'}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 关联测评 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>关联测评</h3>
                <Space>
                  <Button type="link" size="small" onClick={() => navigate('/assessments')}>查看全部 ↗</Button>
                  <Button size="small" onClick={() => setAddAssessmentOpen(true)}>+ 新增测评</Button>
                </Space>
              </div>
              {selectedApp.assessments.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, padding: '12px 0' }}>暂无测评记录</div>
              ) : (
                <List
                  size="small"
                  dataSource={selectedApp.assessments}
                  renderItem={a => (
                    <List.Item
                      extra={<Button type="link" size="small" onClick={() => navigate('/assessments')}>↗</Button>}
                    >
                      <List.Item.Meta
                        title={<Space>{a.name}<Tag color={a.status === 'done' ? 'green' : a.status === 'expired' ? 'default' : 'gold'}>{a.status === 'done' ? '已完成' : a.status === 'expired' ? '已失效' : '待完成'}</Tag></Space>}
                        description={`${a.platform || ''} · 截止 ${dayjs(a.deadline).format('MM-DD HH:mm')}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 关联面试 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>关联面试</h3>
                <Space>
                  <Button type="link" size="small" onClick={() => navigate('/interviews')}>查看全部 ↗</Button>
                  <Button size="small" onClick={() => setAddInterviewOpen(true)}>+ 新增面试</Button>
                </Space>
              </div>
              {selectedApp.interviews.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, padding: '12px 0' }}>暂无面试记录</div>
              ) : (
                <List
                  size="small"
                  dataSource={selectedApp.interviews}
                  renderItem={i => (
                    <List.Item
                      extra={<Button type="link" size="small" onClick={() => navigate('/interviews')}>↗</Button>}
                    >
                      <List.Item.Meta
                        title={<Space><Tag color="purple">{i.round}</Tag><Tag color={i.status === 'done' ? 'green' : i.status === 'abandoned' ? 'default' : 'blue'}>{i.status === 'done' ? '已完成' : i.status === 'abandoned' ? '已放弃' : '待面试'}</Tag></Space>}
                        description={`${dayjs(i.datetime).format('MM-DD HH:mm')} · ${i.location || ''}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 备注 */}
            <div>
              <h3 style={{ marginBottom: 8 }}>备注</h3>
              <Input.TextArea
                defaultValue={selectedApp.note}
                placeholder="添加备注..."
                rows={3}
                onBlur={e => updateApplication(selectedApp.id, { note: e.target.value })}
              />
            </div>

            <Button danger onClick={() => {
              modal.confirm({
                title: '确认删除',
                content: '删除后该投递下的测评和面试记录也将一并删除，且不可恢复。',
                okText: '确认删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => { deleteApplication(selectedApp.id); setSelectedAppId(null); message.success('已删除') }
              })
            }}>
              删除投递记录
            </Button>
          </div>
        )}
      </Drawer>

      {/* 新增投递弹窗 */}
      <Modal title="新增投递" open={addModalOpen} onCancel={() => { setAddModalOpen(false); addForm.resetFields() }} onOk={() => addForm.submit()} width={600}>
        <Form form={addForm} layout="vertical" onFinish={handleAddApplication}>
          <Form.Item name="company" label="公司名称" rules={[{ required: true }]}><Input placeholder="如：字节跳动" /></Form.Item>
          <Form.Item name="position" label="岗位名称" rules={[{ required: true }]}><Input placeholder="如：前端开发实习生" /></Form.Item>
          <Form.Item name="city" label="城市"><Input placeholder="如：北京" /></Form.Item>
          <Form.Item name="jobType" label="岗位分类" rules={[{ required: true }]}>
            <Select options={Object.entries(jobTypeConfig).map(([k, l]) => ({ label: l, value: k }))} />
          </Form.Item>
          <Form.Item name="applyDate" label="投递时间" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} disabledDate={c => c && c > dayjs().endOf('day')} />
          </Form.Item>
          <Form.Item name="channel" label="投递渠道"><Input placeholder="如：BOSS直聘、官网、内推" /></Form.Item>
          <Form.Item name="link" label="官网/岗位链接"><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="resumeId" label="关联简历">
            <Select allowClear placeholder="选择简历（可选）" options={resumes.map(r => ({ label: r.name + (r.isDefault ? '（默认）' : ''), value: r.id }))} />
          </Form.Item>
          <Form.Item name="jd" label="岗位JD"><Input.TextArea rows={4} placeholder="粘贴岗位描述..." /></Form.Item>
          <Form.Item name="note" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* 新增测评弹窗 */}
      <Modal title={`新增测评 · ${selectedApp?.company}`} open={addAssessmentOpen} onCancel={() => { setAddAssessmentOpen(false); assessmentForm.resetFields() }} onOk={() => assessmentForm.submit()}>
        <Form form={assessmentForm} layout="vertical" onFinish={handleAddAssessment}>
          <Form.Item name="name" label="测评名称" rules={[{ required: true }]}><Input placeholder="如：行测测评、性格测试" /></Form.Item>
          <Form.Item name="platform" label="测评平台"><Input placeholder="如：北森、智鼎" /></Form.Item>
          <Form.Item name="link" label="测评链接"><Input placeholder="https://..." /></Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="date" label="截止日期" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="time" label="截止时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
        </Form>
      </Modal>

      {/* 新增面试弹窗 */}
      <Modal title={`新增面试 · ${selectedApp?.company}`} open={addInterviewOpen} onCancel={() => { setAddInterviewOpen(false); interviewForm.resetFields() }} onOk={() => interviewForm.submit()}>
        <Form form={interviewForm} layout="vertical" onFinish={handleAddInterview}>
          <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
            <div>
              <Space size="small" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                {roundPresets.map(r => <Button key={r} size="small" onClick={() => interviewForm.setFieldValue('round', r)}>{r}</Button>)}
              </Space>
              <Input placeholder="或自定义输入" />
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
            <Select allowClear options={[{ label: '线上 - 飞书', value: 'online_feishu' }, { label: '线上 - 钉钉', value: 'online_dingtalk' }, { label: '线上 - 腾讯会议', value: 'online_tencent' }, { label: '线下', value: 'offline' }]} />
          </Form.Item>
          <Form.Item name="location" label="地点/会议链接"><Input /></Form.Item>
          <Form.Item name="interviewer" label="面试官"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
