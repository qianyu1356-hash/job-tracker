import { create } from 'zustand'
import { api } from '../api/client'
import type {
  Application,
  ApplicationStatus,
  Assessment,
  Interview,
  Message,
  Resume,
  Todo,
} from '../types'

type ApplicationPayload = Omit<Application, 'id' | 'createdAt' | 'assessments' | 'interviews'>

interface AppStore {
  initialized: boolean
  loading: boolean
  error: string | null
  applications: Application[]
  messages: Message[]
  resumes: Resume[]
  goal: string
  todos: Todo[]

  init: () => Promise<void>
  refreshApplications: () => Promise<void>
  refreshMessages: () => Promise<void>
  refreshResumes: () => Promise<void>
  refreshGoal: () => Promise<void>
  refreshTodos: () => Promise<void>

  addApplication: (app: ApplicationPayload) => Promise<void>
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  updateStatus: (id: string, status: ApplicationStatus) => Promise<void>

  addAssessment: (applicationId: string, assessment: Omit<Assessment, 'id' | 'applicationId'>) => Promise<void>
  markAssessmentDone: (_applicationId: string, assessmentId: string) => Promise<void>
  updateAssessment: (_applicationId: string, assessmentId: string, updates: Partial<Assessment>) => Promise<void>
  deleteAssessment: (_applicationId: string, assessmentId: string) => Promise<void>

  addInterview: (applicationId: string, interview: Omit<Interview, 'id' | 'applicationId'>) => Promise<void>
  updateInterview: (_applicationId: string, interviewId: string, updates: Partial<Interview>) => Promise<void>
  deleteInterview: (_applicationId: string, interviewId: string) => Promise<void>

  markMessageRead: (id: string) => Promise<void>
  markAllMessagesRead: () => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  clearMessages: () => Promise<void>
  unreadCount: () => number

  setGoal: (goal: string) => Promise<void>
  addTodo: (content: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
}

async function loadApplications() {
  const data = await api.get<{ items: Application[] }>('/applications')
  return data.items || []
}

async function loadMessages() {
  const data = await api.get<{ items: Message[] }>('/messages')
  return data.items || []
}

async function loadResumes() {
  const data = await api.get<{ items: Resume[] }>('/resumes')
  return data.items || []
}

async function loadGoal() {
  const data = await api.get<{ goal: string }>('/home/goal')
  return data.goal || ''
}

async function loadTodos() {
  const data = await api.get<{ items: Todo[] }>('/todos')
  return data.items || []
}

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  applications: [],
  messages: [],
  resumes: [],
  goal: '',
  todos: [],

  init: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const [applications, messages, resumes, goal, todos] = await Promise.all([
        loadApplications(),
        loadMessages(),
        loadResumes(),
        loadGoal(),
        loadTodos(),
      ])
      set({
        applications,
        messages,
        resumes,
        goal,
        todos,
        initialized: true,
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '加载失败' })
    } finally {
      set({ loading: false })
    }
  },

  refreshApplications: async () => {
    const applications = await loadApplications()
    set({ applications })
  },

  refreshMessages: async () => {
    const messages = await loadMessages()
    set({ messages })
  },

  refreshResumes: async () => {
    const resumes = await loadResumes()
    set({ resumes })
  },

  refreshGoal: async () => {
    const goal = await loadGoal()
    set({ goal })
  },

  refreshTodos: async () => {
    const todos = await loadTodos()
    set({ todos })
  },

  addApplication: async (app) => {
    await api.post('/applications', app)
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  updateApplication: async (id, updates) => {
    await api.patch(`/applications/${id}`, updates)
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  deleteApplication: async (id) => {
    await api.delete(`/applications/${id}`)
    await get().refreshApplications()
  },

  updateStatus: async (id, status) => {
    await api.patch(`/applications/${id}/status`, { status })
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  addAssessment: async (applicationId, assessment) => {
    await api.post('/assessments', { ...assessment, applicationId })
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  markAssessmentDone: async (_applicationId, assessmentId) => {
    await api.patch(`/assessments/${assessmentId}/done`, {})
    await get().refreshApplications()
  },

  updateAssessment: async (_applicationId, assessmentId, updates) => {
    await api.patch(`/assessments/${assessmentId}`, updates)
    await get().refreshApplications()
  },

  deleteAssessment: async (_applicationId, assessmentId) => {
    await api.delete(`/assessments/${assessmentId}`)
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  addInterview: async (applicationId, interview) => {
    await api.post('/interviews', { ...interview, applicationId })
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  updateInterview: async (_applicationId, interviewId, updates) => {
    await api.patch(`/interviews/${interviewId}`, updates)
    await get().refreshApplications()
  },

  deleteInterview: async (_applicationId, interviewId) => {
    await api.delete(`/interviews/${interviewId}`)
    await Promise.all([get().refreshApplications(), get().refreshMessages()])
  },

  markMessageRead: async (id) => {
    await api.patch(`/messages/${id}/read`, {})
    await get().refreshMessages()
  },

  markAllMessagesRead: async () => {
    await api.patch('/messages/read-all', {})
    await get().refreshMessages()
  },

  deleteMessage: async (id) => {
    await api.delete(`/messages/${id}`)
    await get().refreshMessages()
  },

  clearMessages: async () => {
    await api.delete('/messages')
    await get().refreshMessages()
  },

  unreadCount: () => get().messages.filter((m) => !m.isRead).length,

  setGoal: async (goal) => {
    await api.patch('/home/goal', { goal })
    await get().refreshGoal()
  },

  addTodo: async (content) => {
    await api.post('/todos', { content })
    await get().refreshTodos()
  },

  toggleTodo: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return
    await api.patch(`/todos/${id}`, { done: !todo.done })
    await get().refreshTodos()
  },

  deleteTodo: async (id) => {
    await api.delete(`/todos/${id}`)
    await get().refreshTodos()
  },
}))
