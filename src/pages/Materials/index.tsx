import { useEffect, useMemo, useState } from 'react'
import { App, Card, Button, Input, Upload, Tag, Modal, Form, Select, Space, Empty, Tooltip } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { api } from '../../api/client'
import dayjs from 'dayjs'

type MaterialCategory = {
  key: string
  label: string
  isPreset?: boolean
  count?: number
}

type MaterialItem = {
  id: string
  name: string
  category: string
  size: number
  createdAt: string
  type: string
  note?: string
  fileUrl?: string
}

const fileIcon = (type: string) => {
  if (type === 'pdf') return '📄'
  if (type === 'image') return '🖼️'
  if (type === 'word') return '📝'
  return '📁'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MaterialsPage() {
  const { message, modal } = App.useApp()
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchText, setSearchText] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addCatModalOpen, setAddCatModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [files, setFiles] = useState<MaterialItem[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()
  const [catForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, fileRes] = await Promise.all([
        api.get<{ items: MaterialCategory[] }>('/material-categories'),
        api.get<{ items: MaterialItem[] }>('/materials'),
      ])
      setCategories(catRes.items || [])
      setFiles(fileRes.items || [])
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载材料库失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const displayCategories = useMemo(
    () => [
      { key: 'all', label: '全部材料', count: files.length },
      ...categories.map((c) => ({ ...c, count: files.filter((f) => f.category === c.key).length })),
    ],
    [categories, files],
  )

  const filteredFiles = useMemo(
    () =>
      files.filter((f) => {
        const matchCat = activeCategory === 'all' || f.category === activeCategory
        const matchSearch = !searchText || f.name.toLowerCase().includes(searchText.toLowerCase())
        return matchCat && matchSearch
      }),
    [activeCategory, files, searchText],
  )

  const handleDelete = (id: string, name: string) => {
    modal.confirm({
      title: '确认删除',
      content: `确认删除「${name}」？删除后不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/materials/${id}`)
          await loadData()
          message.success('文件已删除')
        } catch (err) {
          message.error(err instanceof Error ? err.message : '删除失败')
        }
      },
    })
  }

  const handleAddCategory = async (values: any) => {
    try {
      await api.post('/material-categories', { label: values.name })
      await loadData()
      message.success('分类已创建')
      setAddCatModalOpen(false)
      catForm.resetFields()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建分类失败')
    }
  }

  const handleUpload = async (values: any) => {
    if (fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }
    if (!values.category) {
      message.warning('请选择分类')
      return
    }
    setLoading(true)
    try {
      await Promise.all(
        fileList.map((f) =>
          api.post('/materials', {
            name: f.name,
            category: values.category,
            size: f.size || 0,
            note: values.note || '',
          }),
        ),
      )
      await loadData()
      message.success('上传成功')
      setUploadModalOpen(false)
      form.resetFields()
      setFileList([])
    } catch (err) {
      message.error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setLoading(false)
    }
  }

  const categoryName = (key: string) => displayCategories.find((c) => c.key === key)?.label || key

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
      <Card bodyStyle={{ padding: 0 }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          分类
          <Button type="link" size="small" onClick={() => setAddCatModalOpen(true)}>
            ＋
          </Button>
        </div>
        {displayCategories.map((cat) => (
          <div
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: activeCategory === cat.key ? '#EFF6FF' : 'transparent',
              color: activeCategory === cat.key ? '#3B82F6' : '#475569',
              fontWeight: activeCategory === cat.key ? 500 : 'normal',
              borderLeft: activeCategory === cat.key ? '3px solid #3B82F6' : '3px solid transparent',
            }}
          >
            <span>{cat.label}</span>
            <Tag color={activeCategory === cat.key ? 'blue' : 'default'} style={{ fontSize: 11 }}>
              {cat.count || 0}
            </Tag>
          </div>
        ))}
      </Card>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>材料库</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>
              上传材料
            </Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input
              placeholder="搜索文件名..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Space>
              <Button icon={<AppstoreOutlined />} type={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>
                网格
              </Button>
              <Button icon={<UnorderedListOutlined />} type={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>
                列表
              </Button>
            </Space>
          </div>
        </Card>

        {filteredFiles.length === 0 ? (
          <Card loading={loading}>
            <Empty description="暂无文件" />
          </Card>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {filteredFiles.map((file) => (
              <Card key={file.id} hoverable bodyStyle={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{fileIcon(file.type)}</div>
                <Tooltip title={file.name}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                </Tooltip>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
                  {formatSize(file.size)} · {dayjs(file.createdAt).format('MM-DD')}
                </div>
                <Space size="small">
                  <Button size="small" icon={<EyeOutlined />} onClick={() => message.info('预览功能待接入文件服务')}>
                    预览
                  </Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => message.info('下载功能待接入文件服务')}>
                    下载
                  </Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(file.id, file.name)} />
                </Space>
              </Card>
            ))}
            <Card
              hoverable
              bodyStyle={{ padding: 32, textAlign: 'center', cursor: 'pointer' }}
              style={{ border: '2px dashed #E2E8F0' }}
              onClick={() => setUploadModalOpen(true)}
            >
              <div style={{ fontSize: 32, color: '#94A3B8', marginBottom: 8 }}>＋</div>
              <div style={{ fontSize: 14, color: '#94A3B8' }}>上传新材料</div>
            </Card>
          </div>
        ) : (
          <Card bodyStyle={{ padding: 0 }} loading={loading}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              <span>文件名</span>
              <span>分类</span>
              <span>大小 / 日期</span>
              <span>操作</span>
            </div>
            {filteredFiles.map((file) => (
              <div key={file.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                  <span style={{ fontSize: 20 }}>{fileIcon(file.type)}</span>
                  <Tooltip title={file.name}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  </Tooltip>
                </div>
                <Tag>{categoryName(file.category)}</Tag>
                <span style={{ fontSize: 13, color: '#64748B' }}>
                  {formatSize(file.size)} · {dayjs(file.createdAt).format('YYYY-MM-DD')}
                </span>
                <Space size="small">
                  <Button size="small" icon={<EyeOutlined />} onClick={() => message.info('预览功能待接入文件服务')} />
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => message.info('下载功能待接入文件服务')} />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(file.id, file.name)} />
                </Space>
              </div>
            ))}
          </Card>
        )}
      </Space>

      <Modal
        title="上传材料"
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false)
          form.resetFields()
          setFileList([])
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={(values) => void handleUpload(values)}>
          <Form.Item label="选择文件" required>
            <Upload.Dragger
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              maxCount={5}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={(info) => setFileList(info.fileList)}
            >
              <p style={{ fontSize: 32 }}>📤</p>
              <p>点击或拖拽文件到此处上传</p>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>支持 PDF、JPG、PNG、Word，单文件最多 20MB</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item name="category" label="所属分类" rules={[{ required: true }]} initialValue={activeCategory !== 'all' ? activeCategory : undefined}>
            <Select options={categories.map((c) => ({ label: c.label, value: c.key }))} />
          </Form.Item>
          <Form.Item name="note" label="备注（可选）">
            <Input placeholder="对这批文件的简短说明" maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增分类"
        open={addCatModalOpen}
        onCancel={() => {
          setAddCatModalOpen(false)
          catForm.resetFields()
        }}
        onOk={() => catForm.submit()}
      >
        <Form form={catForm} layout="vertical" onFinish={(values) => void handleAddCategory(values)}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, max: 20, message: '请输入分类名称（最多20字符）' }]}>
            <Input placeholder="如：竞赛证书" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
