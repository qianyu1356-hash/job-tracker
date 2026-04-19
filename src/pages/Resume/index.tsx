import { useState } from 'react'
import { App, Card, Button, Modal, Form, Input, Tag } from 'antd'
import { PlusOutlined, EyeOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

interface Resume {
  id: string
  name: string
  tags: string[]
  description: string
  size: string
  updatedAt: string
  isDefault: boolean
}

const mockResumes: Resume[] = [
  { id: '1', name: '通用简历_v3.pdf', tags: ['前端开发', '互联网', '1页'], description: '适用于互联网大厂，突出技术栈和项目经验', size: '245 KB', updatedAt: '2026-04-15', isDefault: true },
  { id: '2', name: '产品经理方向_v2.pdf', tags: ['产品经理', '互联网'], description: '突出产品思维和用户研究经验，适合互联网产品岗', size: '312 KB', updatedAt: '2026-04-10', isDefault: false },
  { id: '3', name: '国企央企版_v1.pdf', tags: ['国企', '央企', '2页'], description: '格式正式，突出学历背景和获奖经历，适合国企校招', size: '198 KB', updatedAt: '2026-03-28', isDefault: false },
]

const tagColors = ['blue', 'purple', 'green', 'orange', 'cyan']

export default function ResumePage() {
  const { message, modal } = App.useApp()
  const [resumes, setResumes] = useState(mockResumes)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingResume, setEditingResume] = useState<Resume | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [form] = Form.useForm()

  const setDefault = (id: string) => {
    setResumes(prev => prev.map(r => ({ ...r, isDefault: r.id === id })))
    message.success('已设为默认简历')
  }

  const handleDelete = (id: string, name: string) => {
    modal.confirm({
      title: '确认删除',
      content: `确认删除「${name}」？删除后不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setResumes(prev => prev.filter(r => r.id !== id))
        message.success('简历已删除')
      }
    })
  }

  const openEdit = (resume: Resume) => {
    setEditingResume(resume)
    setEditTags([...resume.tags])
    form.setFieldsValue({ name: resume.name.replace('.pdf', ''), description: resume.description })
    setEditModalOpen(true)
  }

  const handleEditSave = (values: any) => {
    if (!editingResume) return
    setResumes(prev => prev.map(r => r.id === editingResume.id
      ? { ...r, name: values.name + '.pdf', tags: editTags, description: values.description }
      : r
    ))
    message.success('简历信息已更新')
    setEditModalOpen(false)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !editTags.includes(t) && editTags.length < 5) {
      setEditTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  // 简历缩略图（CSS 模拟）
  const ResumeThumbnail = ({ color = '#3B82F6' }: { color?: string }) => (
    <div style={{ width: 100, background: 'white', borderRadius: 4, padding: '8px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      {[1, 0.4, 0.8, 0.6, 1, 0.7, 0.5, 1, 0.8, 0.6].map((w, i) => (
        i === 0 ? <div key={i} style={{ height: 3, background: '#CBD5E1', borderRadius: 2, marginBottom: 3, width: '60%' }} />
        : i === 4 ? <div key={i} style={{ height: 2, background: color, borderRadius: 1, marginBottom: 4, width: '100%' }} />
        : <div key={i} style={{ height: 2, background: '#E2E8F0', borderRadius: 1, marginBottom: 3, width: `${w * 100}%` }} />
      ))}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>简历管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>上传简历</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {resumes.map((resume, idx) => (
          <Card
            key={resume.id}
            hoverable
            bodyStyle={{ padding: 0 }}
          >
            {/* 缩略图区 */}
            <div style={{
              height: 200, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              {resume.isDefault && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#3B82F6', color: 'white', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>
                  默认
                </div>
              )}
              <ResumeThumbnail color={['#3B82F6', '#8B5CF6', '#10B981'][idx % 3]} />
            </div>

            {/* 信息区 */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{resume.name}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {resume.description}
              </div>
              <div style={{ marginBottom: 10 }}>
                {resume.tags.map((tag, i) => (
                  <Tag key={tag} color={tagColors[i % tagColors.length]} style={{ marginBottom: 4 }}>{tag}</Tag>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{resume.updatedAt} 更新</span>
                <span>{resume.size}</span>
              </div>
            </div>

            {/* 操作区 */}
            <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
              <Button style={{ flex: 1 }} icon={<EyeOutlined />} onClick={() => message.info('预览功能开发中')}>预览</Button>
              <Button style={{ flex: 1 }} icon={<EditOutlined />} onClick={() => openEdit(resume)}>编辑</Button>
              <Button style={{ flex: 1 }} type="primary" icon={<DownloadOutlined />} onClick={() => message.success('开始下载')}>下载</Button>
            </div>

            {/* 设为默认 / 删除 */}
            <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
              {!resume.isDefault && (
                <Button size="small" onClick={() => setDefault(resume.id)}>设为默认</Button>
              )}
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(resume.id, resume.name)}>删除</Button>
            </div>
          </Card>
        ))}

        {/* 上传卡片 */}
        <Card
          hoverable
          bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, cursor: 'pointer' }}
          style={{ border: '2px dashed #E2E8F0' }}
          onClick={() => setUploadModalOpen(true)}
        >
          <div style={{ fontSize: 40, color: '#94A3B8', marginBottom: 12 }}>＋</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8' }}>上传新简历</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>支持 PDF、Word</div>
        </Card>
      </div>

      {/* 上传弹窗 */}
      <Modal title="上传简历" open={uploadModalOpen} onCancel={() => setUploadModalOpen(false)} onOk={() => { message.success('简历已上传'); setUploadModalOpen(false) }}>
        <Form layout="vertical">
          <Form.Item label="选择文件" required>
            <div style={{ border: '2px dashed #E2E8F0', borderRadius: 8, padding: 28, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => message.info('文件选择功能开发中')}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, color: '#64748B' }}>点击选择简历文件</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>支持 PDF、Word，最大 10MB</div>
            </div>
          </Form.Item>
          <Form.Item label="简历名称" required>
            <Input placeholder="例如：前端开发简历_v2" />
          </Form.Item>
          <Form.Item label="备注说明">
            <Input.TextArea rows={2} placeholder="简短描述这份简历的特点和适用场景..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal title={`编辑 - ${editingResume?.name}`} open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleEditSave}>
          <Form.Item name="name" label="简历名称" rules={[{ required: true }]}>
            <Input addonAfter=".pdf" />
          </Form.Item>
          <Form.Item label="适用方向标签">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, minHeight: 44 }}>
              {editTags.map(tag => (
                <Tag key={tag} closable onClose={() => setEditTags(prev => prev.filter(t => t !== tag))}>{tag}</Tag>
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={editTags.length < 5 ? '输入标签后按回车' : '最多5个标签'}
                disabled={editTags.length >= 5}
                style={{ border: 'none', outline: 'none', fontSize: 14, minWidth: 80, flex: 1 }}
              />
            </div>
          </Form.Item>
          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
