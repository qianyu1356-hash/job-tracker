import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { App as AntApp, ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './components/Layout/AppLayout'
import { ApiError, api, clearAuthToken, getAuthToken } from './api/client'
import { useAppStore } from './store'

const HomePage = lazy(() => import('./pages/Home'))
const ApplicationsPage = lazy(() => import('./pages/Applications'))
const AssessmentsPage = lazy(() => import('./pages/Assessments'))
const InterviewsPage = lazy(() => import('./pages/Interviews'))
const MaterialsPage = lazy(() => import('./pages/Materials'))
const ResumePage = lazy(() => import('./pages/Resume'))
const MessagesPage = lazy(() => import('./pages/Messages'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const LoginPage = lazy(() => import('./pages/Login'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
)

function App() {
  const init = useAppStore((s) => s.init)
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getAuthToken()
      if (!token) {
        setAuthenticated(false)
        setAuthChecked(true)
        return
      }
      try {
        await api.get('/auth/me')
        setAuthenticated(true)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearAuthToken()
        }
        setAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }
    void bootstrapAuth()
  }, [])

  useEffect(() => {
    if (!authenticated) return
    void init()
  }, [authenticated, init])

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#3B82F6', borderRadius: 8 } }}>
      <AntApp>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            {!authChecked ? (
              <PageLoader />
            ) : authenticated ? (
              <AppLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/assessments" element={<AssessmentsPage />} />
                  <Route path="/interviews" element={<InterviewsPage />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/resume" element={<ResumePage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            ) : (
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
