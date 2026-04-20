export type JobType = 'daily_intern' | 'summer_intern' | 'winter_intern' | 'autumn_recruit' | 'spring_recruit'
export type ApplicationStatus = 'submitted' | 'screening' | 'assessment' | 'interviewing' | 'rejected' | 'offered'
export type AssessmentStatus = 'pending' | 'done' | 'expired'
export type InterviewStatus = 'upcoming' | 'done' | 'abandoned'
export type InterviewFormat = 'online_feishu' | 'online_dingtalk' | 'online_tencent' | 'online_zoom' | 'offline'

export interface Assessment {
  id: string
  applicationId: string
  name: string
  platform?: string
  link?: string
  deadline: string // ISO datetime
  status: AssessmentStatus
  note?: string
}

export interface InterviewReview {
  questions?: string
  improvements?: string
  feeling?: string
}

export interface Interview {
  id: string
  applicationId: string
  round: string
  datetime: string // ISO datetime
  format?: InterviewFormat
  location?: string
  interviewer?: string
  status: InterviewStatus
  review?: InterviewReview
  note?: string
}

export interface Application {
  id: string
  company: string
  position: string
  city?: string
  jobType: JobType
  applyDate: string // YYYY-MM-DD
  channel?: string
  link?: string
  resumeId?: string
  jd?: string
  note?: string
  status: ApplicationStatus
  assessments: Assessment[]
  interviews: Interview[]
  createdAt: string
}

export interface Resume {
  id: string
  name: string
  tags: string[]
  description?: string
  fileUrl: string
  fileSize: number
  isDefault: boolean
  createdAt: string
}

export interface Message {
  id: string
  type: 'assessment' | 'interview' | 'status_change' | 'apply'
  title: string
  description: string
  isRead: boolean
  targetUrl: string
  createdAt: string
}

export interface Todo {
  id: string
  content: string
  done: boolean
  createdAt: string
}
