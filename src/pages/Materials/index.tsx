import { useState } from 'react'
import { App, Card, Button, Input, Upload, Tag, Modal, Form, Select, Space, Empty, Tooltip } from 'antd'
import { PlusOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'

const presetCategories = [
  { key: 'all', label: '📂 全部材料', count: 6 },
  { key: 'degree', label: '🎓 学历证明', count: 1 },
  { key: 'transcript', label: '📊 成绩单', count: 2 },
  { key: 'internship', label: '💼 实习证明', count: 1 },
  { key: 'award', label: '🏆 获奖证书', count: 1 },
  { key: 'portfolio', label: '🖼️ 作品集', count: 1 },
]

const mockFiles = [
  { id: '1', name: '学信网学籍证明.pdf', category: 'degree', size: '245 KB', date: '2026-04-10', type: 'pdf' },
  { id: '2', name: '2025秋季成绩单.pdf', category: 'transcript', size: '312 KB', date: '2026-03-20', type: 'pdf' },
  { id: '3', name: '腾讯实习证明.pdf', category: 'internship', size: '180 KB', date: '2026-02-15', type: 'pdf' },
  { id: '4', name: 'ACM区域赛银奖证书.jpg', category: 'award', size: '1.2 MB', date: '2025-12-01', type: 'image' },
  { id: '5', name: '产品设计作品集.pdf', category: 'portfolio', size: '8.4 MB', date: '2026-04-01', type: 'pdf' },
  { id: '6', name: '英语六级成绩单.jpg', category: 'transcript', size: '560 KB', date: '2025-09-10', type: 'image' },
]

const fileIcon = (type: string) => type === 'pdf' ? '📄' : type === 'image' ? '🖼️' : '📝'

export default function MaterialsPage() {
  const { message, modal } = App.useApp()
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchText, setSearchText] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addCatModalOpen, setAddCatModalOpen] = useState(false)
  const [categories, setCategories] = useState(presetCategories)
  const [files, setFiles] = useState(mockFiles)
  const [form] = Form.useForm()
  const [catForm] = Form.useForm()

  const filteredFiles = files.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory
    const matchSearch = !searchText || f.name.toLowerCase().includes(searchText.toLowerCase())
    return matchCat && matchSearch
  })

  const handleDelete = (id: string, name: string) => {
    modal.confirm({
      title: '确认删除',
      content: `确认删除「${name}」？删除后不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setFiles(prev => prev.filter(f => f.id !== id))
        message.success('文件已删除')
      }
    })
  }

  const handleAddCategory = (values: any) => {
    setCategories(prev => [...prev, { key: Date.now().toString(), label: `📂 ${values.name}`, count: 0 }])
    message.success('分类已创建')
    setAddCatModalOpen(false)
    catForm.resetFields()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
      {/* 左侧分类 */}
      <Card bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
          分类
          <Button type="link" size="small" onClick={() => setAddCatModalOpen(true)}>＋</Button>
        </div>
        {categories.map(cat => (
          <div
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '10px 20px', cursor: 'pointer', fontSize: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: activeCategory === cat.key ? '#EFF6FF' : 'transparent',
              color: activeCategory === cat.key ? '#3B82F6' : '#475569',
              fontWeight: activeCategory === cat.key ? 500 : 'normal',
              borderLeft: activeCategory === cat.key ? '3px solid #3B82F6' : '3px solid transparent',
            }}
          >
            <span>{cat.label}</span>
            <Tag color={activeCategory === cat.key ? 'blue' : 'default'} style={{ fontSize: 11 }}>{cat.count}</Tag>
          </div>
        ))}
      </Card>

      {/* 右侧文件区 */}
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>材料库</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>上传材料</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input
              placeholder="搜索文件名..."
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Space>
              <Button icon={<AppstoreOutlined />} type={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>网格</Button>
              <Button icon={<UnorderedListOutlined />} type={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>列表</Button>
            </Space>
          </div>
        </Card>

        {filteredFiles.length === 0 ? (
          <Card><Empty description="暂无文件" /></Card>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {filteredFiles.map(file => (
              <Card
                key={file.id}
                hoverable
                bodyStyle={{ padding: 16, textAlign: 'center' }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{fileIcon(file.type)}</div>
                <Tooltip title={file.name}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                </Tooltip>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>{file.size} · {file.date.slice(5)}</div>
                <Space size="small">
                  <Button size="small" icon={<EyeOutlined />} onClick={() => message.info('预览功能开发中')}>预览</Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => message.success('开始下载')}>下载</Button>
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
          <Card bodyStyle={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              <span>文件名</span><span>分类</span><span>大小 / 日期</span><span>操作</span>
            </div>
            {filteredFiles.map(file => (
              <div key={file.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                  <span style={{ fontSize: 20 }}>{fileIcon(file.type)}</span>
                  <Tooltip title={file.name}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span></Tooltip>
                </div>
                <Tag>{categories.find(c => c.key === file.category)?.label.replace(/^.{2}/, '') || file.category}</Tag>
                <span style={{ fontSize: 13, color: '#64748B' }}>{file.size} · {file.date}</span>
                <Space size="small">
                  <Button size="small" icon={<EyeOutlined />} onClick={() => message.info('预览功能开发中')} />
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => message.success('开始下载')} />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(file.id, file.name)} />
                </Space>
              </div>
            ))}
          </Card>
        )}
      </Space>

      {/* 上传弹窗 */}
      <Modal title="上传材料" open={uploadModalOpen} onCancel={() => { setUploadModalOpen(false); form.resetFields() }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={() => { message.success('上传成功'); setUploadModalOpen(false); form.resetFields() }}>
          <Form.Item label="选择文件" rules={[{ required: true }]}>
            <Upload.Dragger accept=".pdf,.jpg,.png,.doc,.docx" maxCount={5} beforeUpload={() => false}>
              <p style={{ fontSize: 32 }}>📁</p>
              <p>点击或拖拽文件到此处上传</p>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>支持 PDF、JPG、PNG、Word，单文件最大 20MB</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item name="category" label="所属分类" rules={[{ required: true }]} initialValue={activeCategory !== 'all' ? activeCategory : undefined}>
            <Select options={categories.filter(c => c.key !== 'all').map(c => ({ label: c.label, value: c.key }))} />
          </Form.Item>
          <Form.Item name="note" label="备注（可选）">
            <Input placeholder="对文件的简短说明" maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增分类弹窗 */}
      <Modal title="新增分类" open={addCatModalOpen} onCancel={() => { setAddCatModalOpen(false); catForm.resetFields() }} onOk={() => catForm.submit()}>
        <Form form={catForm} layout="vertical" onFinish={handleAddCategory}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, max: 20, message: '请输入分类名称（最多20字符）' }]}>
            <Input placeholder="如：竞赛证书" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
