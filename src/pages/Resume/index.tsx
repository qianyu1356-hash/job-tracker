import { useEffect, useMemo, useState } from 'react'
import { App, Card, Button, Modal, Form, Input, Tag, Upload } from 'antd'
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import { api } from '../../api/client'
import type { Resume } from '../../types'

const tagColors = ['blue', 'purple', 'green', 'orange', 'cyan']

export default function ResumePage() {
  const { message, modal } = App.useApp()
  const resumes = useAppStore((s) => s.resumes)
  const refreshResumes = useAppStore((s) => s.refreshResumes)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingResume, setEditingResume] = useState<Resume | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [uploadForm] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    if (resumes.length === 0) {
      void refreshResumes()
    }
  }, [refreshResumes, resumes.length])

  const list = useMemo(
    () =>
      [...resumes].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1
        if (!a.isDefault && b.isDefault) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    [resumes],
  )

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true)
    try {
      await fn()
    } finally {
      setLoading(false)
    }
  }

  const setDefault = async (id: string) => {
    await withLoading(async () => {
      await api.patch(`/resumes/${id}/default`, {})
      await refreshResumes()
      message.success('已设为默认简历')
    }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '设置失败'))
  }

  const handleDelete = (id: string, name: string) => {
    modal.confirm({
      title: '确认删除',
      content: `确认删除「${name}」？删除后不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await withLoading(async () => {
          await api.delete(`/resumes/${id}`)
          await refreshResumes()
          message.success('简历已删除')
        }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '删除失败'))
      },
    })
  }

  const openEdit = (resume: Resume) => {
    setEditingResume(resume)
    setEditTags([...(resume.tags || [])])
    editForm.setFieldsValue({
      name: resume.name.replace(/\.(pdf|doc|docx)$/i, ''),
      description: resume.description,
    })
    setEditModalOpen(true)
  }

  const handleEditSave = async (values: any) => {
    if (!editingResume) return
    await withLoading(async () => {
      const ext = editingResume.name.includes('.') ? editingResume.name.split('.').pop() : 'pdf'
      await api.patch(`/resumes/${editingResume.id}`, {
        name: `${values.name}.${ext}`,
        tags: editTags,
        description: values.description || '',
      })
      await refreshResumes()
      message.success('简历信息已更新')
      setEditModalOpen(false)
    }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '更新失败'))
  }

  const handleUpload = async (values: any) => {
    if (!selectedFile) {
      message.warning('请先选择文件')
      return
    }
    await withLoading(async () => {
      const fileName = values.name?.trim() ? values.name.trim() : selectedFile.name
      await api.post('/resumes', {
        name: fileName.includes('.') ? fileName : `${fileName}.pdf`,
        description: values.description || '',
        tags: values.tags ? String(values.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        fileSize: selectedFile.size,
        fileUrl: '',
        isDefault: list.length === 0,
      })
      await refreshResumes()
      message.success('简历已上传')
      setUploadModalOpen(false)
      uploadForm.resetFields()
      setSelectedFile(null)
    }).catch((err: unknown) => message.error(err instanceof Error ? err.message : '上传失败'))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !editTags.includes(t) && editTags.length < 5) {
      setEditTags((prev) => [...prev, t])
      setTagInput('')
    }
  }

  const ResumeThumbnail = ({ color = '#3B82F6' }: { color?: string }) => (
    <div style={{ width: 100, background: 'white', borderRadius: 4, padding: '8px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      {[1, 0.4, 0.8, 0.6, 1, 0.7, 0.5, 1, 0.8, 0.6].map((w, i) =>
        i === 0 ? (
          <div key={i} style={{ height: 3, background: '#CBD5E1', borderRadius: 2, marginBottom: 3, width: '60%' }} />
        ) : i === 4 ? (
          <div key={i} style={{ height: 2, background: color, borderRadius: 1, marginBottom: 4, width: '100%' }} />
        ) : (
          <div key={i} style={{ height: 2, background: '#E2E8F0', borderRadius: 1, marginBottom: 3, width: `${w * 100}%` }} />
        ),
      )}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>简历管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>
          上传简历
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {list.map((resume, idx) => (
          <Card key={resume.id} hoverable bodyStyle={{ padding: 0 }}>
            <div
              style={{
                height: 200,
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {resume.isDefault && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#3B82F6', color: 'white', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>
                  默认
                </div>
              )}
              <ResumeThumbnail color={['#3B82F6', '#8B5CF6', '#10B981'][idx % 3]} />
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{resume.name}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {resume.description || '暂无描述'}
              </div>
              <div style={{ marginBottom: 10 }}>
                {(resume.tags || []).map((tag, i) => (
                  <Tag key={tag} color={tagColors[i % tagColors.length]} style={{ marginBottom: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                <span>{Math.max(1, Math.round((resume.fileSize || 0) / 1024))} KB</span>
              </div>
            </div>

            <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
              <Button style={{ flex: 1 }} icon={<EditOutlined />} onClick={() => openEdit(resume)}>
                编辑
              </Button>
              <Button style={{ flex: 1 }} type="primary" icon={<DownloadOutlined />} onClick={() => message.info('已记录下载动作（示例）')}>
                下载
              </Button>
            </div>

            <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
              {!resume.isDefault && (
                <Button size="small" loading={loading} onClick={() => void setDefault(resume.id)}>
                  设为默认
                </Button>
              )}
              <Button size="small" danger icon={<DeleteOutlined />} loading={loading} onClick={() => handleDelete(resume.id, resume.name)}>
                删除
              </Button>
            </div>
          </Card>
        ))}

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

      <Modal
        title="上传简历"
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false)
          uploadForm.resetFields()
          setSelectedFile(null)
        }}
        onOk={() => uploadForm.submit()}
        confirmLoading={loading}
      >
        <Form form={uploadForm} layout="vertical" onFinish={(values) => void handleUpload(values)}>
          <Form.Item label="选择文件" required>
            <Upload
              beforeUpload={(file) => {
                setSelectedFile(file)
                return false
              }}
              maxCount={1}
              accept=".pdf,.doc,.docx"
              onRemove={() => setSelectedFile(null)}
            >
              <Button>选择简历文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="name" label="简历名称" rules={[{ required: true }]}>
            <Input placeholder="例如：前端开发简历_v2" />
          </Form.Item>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input placeholder="前端, 实习, 产品" />
          </Form.Item>
          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={2} placeholder="简短描述这份简历的特点和适用场景..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`编辑 - ${editingResume?.name}`} open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={() => editForm.submit()} confirmLoading={loading}>
        <Form form={editForm} layout="vertical" onFinish={(values) => void handleEditSave(values)}>
          <Form.Item name="name" label="简历名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="标签">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, minHeight: 44 }}>
              {editTags.map((tag) => (
                <Tag key={tag} closable onClose={() => setEditTags((prev) => prev.filter((t) => t !== tag))}>
                  {tag}
                </Tag>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={editTags.length < 5 ? '输入标签后按回车' : '最多 5 个标签'}
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
