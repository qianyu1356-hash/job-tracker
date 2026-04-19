import { create } from 'zustand'
import type { Application, ApplicationStatus, Assessment, Interview, Message, Resume } from '../types'
import dayjs from 'dayjs'

const mockApplications: Application[] = [
  {
    id: '1', company: '字节跳动', position: '前端开发实习生', city: '北京',
    jobType: 'daily_intern', applyDate: '2026-04-15', channel: 'BOSS直聘',
    link: 'https://jobs.bytedance.com', status: 'assessment',
    jd: '负责字节跳动前端基础设施建设，参与组件库、工具链开发，要求熟悉 React、TypeScript...',
    note: '目标公司，重点准备', resumeId: 'r1', createdAt: '2026-04-15T10:00:00Z',
    assessments: [
      { id: 'a1', applicationId: '1', name: '行测测评', platform: '北森', status: 'pending',
        deadline: dayjs().add(2, 'hour').toISOString() }
    ],
    interviews: []
  },
  {
    id: '2', company: '腾讯', position: '产品经理实习生', city: '深圳',
    jobType: 'summer_intern', applyDate: '2026-04-14', channel: '官网',
    status: 'interviewing', createdAt: '2026-04-14T09:00:00Z',
    assessments: [],
    interviews: [
      { id: 'i1', applicationId: '2', round: '一面', datetime: '2026-04-16T10:00:00Z',
        format: 'online_feishu', location: '飞书会议', interviewer: '张工', status: 'upcoming' }
    ]
  },
  {
    id: '3', company: '阿里巴巴', position: 'Java开发实习生', city: '杭州',
    jobType: 'daily_intern', applyDate: '2026-04-13', channel: '内推',
    status: 'interviewing', createdAt: '2026-04-13T11:00:00Z',
    assessments: [],
    interviews: [
      { id: 'i2', applicationId: '3', round: '一面', datetime: '2026-04-19T15:00:00Z',
        format: 'online_dingtalk', location: '钉钉视频', interviewer: '王工', status: 'upcoming' }
    ]
  },
  {
    id: '4', company: '美团', position: '算法工程师实习生', city: '北京',
    jobType: 'autumn_recruit', applyDate: '2026-04-12', channel: 'BOSS直聘',
    status: 'screening', createdAt: '2026-04-12T14:00:00Z',
    assessments: [
      { id: 'a2', applicationId: '4', name: '综合能力测评', platform: '倍智', status: 'pending',
        deadline: dayjs().add(3, 'day').toISOString() }
    ],
    interviews: []
  },
  {
    id: '5', company: '网易', position: '游戏策划实习生', city: '广州',
    jobType: 'daily_intern', applyDate: '2026-04-11', channel: '官网',
    status: 'offered', createdAt: '2026-04-11T10:00:00Z',
    assessments: [],
    interviews: []
  },
  {
    id: '6', company: '小红书', position: '数据分析实习生', city: '上海',
    jobType: 'daily_intern', applyDate: '2026-04-10', channel: '内推',
    status: 'submitted', createdAt: '2026-04-10T16:00:00Z',
    assessments: [],
    interviews: []
  },
]

const mockMessages: Message[] = [
  { id: 'm1', type: 'assessment', title: '测评提醒 · 美团', isRead: false,
    description: '美团 · 算法工程师实习生 · 你添加的测评将于 3 天后截止',
    targetUrl: '/assessments', createdAt: dayjs().subtract(5, 'minute').toISOString() },
  { id: 'm2', type: 'interview', title: '面试提醒 · 腾讯', isRead: false,
    description: '腾讯 · 产品经理实习生 · 你记录的一面将于明天 10:00 开始',
    targetUrl: '/interviews', createdAt: dayjs().subtract(1, 'hour').toISOString() },
  { id: 'm3', type: 'status_change', title: '进度更新 · 小红书', isRead: false,
    description: '小红书 · 数据分析实习生 · 你将投递进度更新为「待测评」',
    targetUrl: '/applications', createdAt: dayjs().subtract(3, 'hour').toISOString() },
  { id: 'm4', type: 'apply', title: '新增投递 · 京东', isRead: true,
    description: '京东 · 前端开发实习生 · 你添加了一条新的投递记录',
    targetUrl: '/applications', createdAt: dayjs().subtract(1, 'day').toISOString() },
]

interface AppStore {
  applications: Application[]
  messages: Message[]
  resumes: Resume[]
  addApplication: (app: Omit<Application, 'id' | 'createdAt' | 'assessments' | 'interviews'>) => void
  updateApplication: (id: string, updates: Partial<Application>) => void
  deleteApplication: (id: string) => void
  updateStatus: (id: string, status: ApplicationStatus) => void
  addAssessment: (applicationId: string, assessment: Omit<Assessment, 'id' | 'applicationId'>) => void
  addInterview: (applicationId: string, interview: Omit<Interview, 'id' | 'applicationId'>) => void
  updateInterview: (applicationId: string, interviewId: string, updates: Partial<Interview>) => void
  markMessageRead: (id: string) => void
  markAllMessagesRead: () => void
  unreadCount: () => number
}

export const useAppStore = create<AppStore>((set, get) => ({
  applications: mockApplications,
  messages: mockMessages,
  resumes: [
    { id: 'r1', name: '通用简历_v3.pdf', tags: ['前端开发', '互联网'], isDefault: true,
      description: '适用于互联网大厂，突出技术栈和项目经验', fileUrl: '', fileSize: 245000,
      createdAt: '2026-04-15T00:00:00Z' }
  ],

  addApplication: (app) => set((s) => ({
    applications: [...s.applications, {
      ...app, id: Date.now().toString(), createdAt: new Date().toISOString(),
      assessments: [], interviews: []
    }]
  })),

  updateApplication: (id, updates) => set((s) => ({
    applications: s.applications.map(a => a.id === id ? { ...a, ...updates } : a)
  })),

  deleteApplication: (id) => set((s) => ({
    applications: s.applications.filter(a => a.id !== id)
  })),

  updateStatus: (id, status) => set((s) => ({
    applications: s.applications.map(a => a.id === id ? { ...a, status } : a)
  })),

  addAssessment: (applicationId, assessment) => set((s) => ({
    applications: s.applications.map(a => {
      if (a.id !== applicationId) return a
      const newStatus = ['submitted', 'screening'].includes(a.status) ? 'assessment' : a.status
      return {
        ...a,
        status: newStatus as ApplicationStatus,
        assessments: [...a.assessments, { ...assessment, id: Date.now().toString(), applicationId }]
      }
    })
  })),

  addInterview: (applicationId, interview) => set((s) => ({
    applications: s.applications.map(a => {
      if (a.id !== applicationId) return a
      const newStatus = !['offered', 'rejected'].includes(a.status) ? 'interviewing' : a.status
      return {
        ...a,
        status: newStatus as ApplicationStatus,
        interviews: [...a.interviews, { ...interview, id: Date.now().toString(), applicationId }]
      }
    })
  })),

  updateInterview: (applicationId, interviewId, updates) => set((s) => ({
    applications: s.applications.map(a => {
      if (a.id !== applicationId) return a
      return { ...a, interviews: a.interviews.map(i => i.id === interviewId ? { ...i, ...updates } : i) }
    })
  })),

  markMessageRead: (id) => set((s) => ({
    messages: s.messages.map(m => m.id === id ? { ...m, isRead: true } : m)
  })),

  markAllMessagesRead: () => set((s) => ({
    messages: s.messages.map(m => ({ ...m, isRead: true }))
  })),

  unreadCount: () => get().messages.filter(m => !m.isRead).length,
}))
