import { useState } from 'react'
import { App, Card, Button, Input, Space, Table, Tag, Drawer, Descriptions, List, Modal, Form, Select, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined, TableOutlined, AppstoreOutlined, EditOutlined } from '@ant-design/icons'
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

export default function ApplicationsPage() {
  const { message } = App.useApp()
  const applications = useAppStore(s => s.applications)
  const addApplication = useAppStore(s => s.addApplication)
  const updateStatus = useAppStore(s => s.updateStatus)
  const deleteApplication = useAppStore(s => s.deleteApplication)

  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const selectedApp = applications.find(a => a.id === selectedAppId) || null
  const drawerOpen = selectedAppId !== null
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [form] = Form.useForm()

  const filteredApps = applications.filter(app => {
    const matchSearch = !searchText || app.company.includes(searchText) || app.position.includes(searchText)
    const matchStatus = statusFilter === 'all' || app.status === statusFilter
    return matchSearch && matchStatus
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

  const handleAddApplication = async (values: any) => {
    addApplication({
      company: values.company,
      position: values.position,
      city: values.city,
      jobType: values.jobType,
      applyDate: values.applyDate.format('YYYY-MM-DD'),
      channel: values.channel,
      link: values.link,
      jd: values.jd,
      note: values.note,
      status: 'submitted',
    })
    message.success('投递记录已添加')
    setAddModalOpen(false)
    form.resetFields()
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>投递管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            新增投递
          </Button>
        </div>

        {/* 状态筛选 Tab */}
        <Space size="small" style={{ marginBottom: 16 }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="搜索公司或岗位"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Space>
            <Button
              icon={<TableOutlined />}
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              表格
            </Button>
            <Button
              icon={<AppstoreOutlined />}
              type={viewMode === 'board' ? 'primary' : 'default'}
              onClick={() => setViewMode('board')}
            >
              看板
            </Button>
          </Space>
        </div>

        {/* 表格视图 */}
        {viewMode === 'table' && (
          <Table
            dataSource={filteredApps}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}

        {/* 看板视图 */}
        {viewMode === 'board' && (
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
            {(['submitted', 'screening', 'assessment', 'interviewing', 'rejected', 'offered'] as ApplicationStatus[]).map(status => (
              <div key={status} style={{ minWidth: 280, flex: 1 }}>
                <div style={{
                  background: '#F8FAFC', padding: '12px 16px', borderRadius: 8,
                  marginBottom: 12, fontWeight: 600
                }}>
                  {statusConfig[status].label} ({filteredApps.filter(a => a.status === status).length})
                </div>
                <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'stretch' }}>
                  {filteredApps.filter(a => a.status === status).map(app => (
                    <Card
                      key={app.id}
                      size="small"
                      hoverable
                      onClick={() => setSelectedAppId(app.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{app.company}</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>{app.position}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        {app.city && <Tag>{app.city}</Tag>}
                        <span style={{ color: '#94A3B8' }}>{app.applyDate}</span>
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={selectedApp ? `${selectedApp.company} · ${selectedApp.position}` : ''}
        size="large"
        open={drawerOpen}
        onClose={() => setSelectedAppId(null)}
      >
        {selectedApp && (
        <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'stretch' }} size="large">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3>基础信息</h3>
                <Button type="link" icon={<EditOutlined />}>编辑</Button>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="公司">{selectedApp.company}</Descriptions.Item>
                <Descriptions.Item label="岗位">{selectedApp.position}</Descriptions.Item>
                <Descriptions.Item label="城市">{selectedApp.city || '-'}</Descriptions.Item>
                <Descriptions.Item label="投递时间">{selectedApp.applyDate}</Descriptions.Item>
                <Descriptions.Item label="进度状态">
                  <Select
                    value={selectedApp.status}
                    style={{ width: 120 }}
                    onChange={(value) => updateStatus(selectedApp.id, value)}
                    options={Object.entries(statusConfig).map(([key, val]) => ({
                      label: val.label,
                      value: key
                    }))}
                  />
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <h3>JD 和渠道</h3>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="投递渠道">{selectedApp.channel || '-'}</Descriptions.Item>
                <Descriptions.Item label="官网链接">
                  {selectedApp.link ? <a href={selectedApp.link} target="_blank" rel="noreferrer">打开链接 ↗</a> : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="岗位JD">
                  {selectedApp.jd ? <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{selectedApp.jd}</div> : '-'}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3>关联测评</h3>
                <Button type="link" size="small">+ 新增测评</Button>
              </div>
              {selectedApp.assessments.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13 }}>暂无测评记录</div>
              ) : (
                <List
                  size="small"
                  dataSource={selectedApp.assessments}
                  renderItem={a => (
                    <List.Item extra={<Button type="link" size="small">↗</Button>}>
                      <List.Item.Meta
                        title={a.name}
                        description={`${a.platform || ''} · 截止 ${dayjs(a.deadline).format('MM-DD HH:mm')}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3>关联面试</h3>
                <Button type="link" size="small">+ 新增面试</Button>
              </div>
              {selectedApp.interviews.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13 }}>暂无面试记录</div>
              ) : (
                <List
                  size="small"
                  dataSource={selectedApp.interviews}
                  renderItem={i => (
                    <List.Item extra={<Button type="link" size="small">↗</Button>}>
                      <List.Item.Meta
                        title={<><Tag color="purple">{i.round}</Tag> {i.location}</>}
                        description={dayjs(i.datetime).format('YYYY-MM-DD HH:mm')}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            <div>
              <h3>备注</h3>
              <Input.TextArea
                value={selectedApp.note}
                placeholder="添加备注..."
                rows={3}
                style={{ fontSize: 13 }}
              />
            </div>

            <Button danger onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '删除后该投递下的测评和面试记录也将一并删除，且不可恢复。确认删除吗？',
                okText: '确认删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => {
                  deleteApplication(selectedApp.id)
                  setSelectedAppId(null)
                  message.success('投递记录已删除')
                }
              })
            }}>
              删除投递记录
            </Button>
          </Space>
        )}
      </Drawer>

      {/* 新增投递弹窗 */}
      <Modal
        title="新增投递"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); form.resetFields() }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddApplication}>
          <Form.Item name="company" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input placeholder="如：字节跳动" />
          </Form.Item>
          <Form.Item name="position" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="如：前端开发实习生" />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Input placeholder="如：北京" />
          </Form.Item>
          <Form.Item name="jobType" label="岗位分类" rules={[{ required: true, message: '请选择岗位分类' }]}>
            <Select options={Object.entries(jobTypeConfig).map(([key, label]) => ({ label, value: key }))} />
          </Form.Item>
          <Form.Item name="applyDate" label="投递时间" rules={[{ required: true, message: '请选择投递时间' }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} disabledDate={current => current && current > dayjs().endOf('day')} />
          </Form.Item>
          <Form.Item name="channel" label="投递渠道">
            <Input placeholder="如：BOSS直聘、官网、内推" />
          </Form.Item>
          <Form.Item name="link" label="官网/岗位链接">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="jd" label="岗位JD">
            <Input.TextArea rows={4} placeholder="粘贴岗位描述..." />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} placeholder="添加备注..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
