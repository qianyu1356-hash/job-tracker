import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp, ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './components/Layout/AppLayout'

const HomePage = lazy(() => import('./pages/Home'))
const ApplicationsPage = lazy(() => import('./pages/Applications'))
const AssessmentsPage = lazy(() => import('./pages/Assessments'))
const InterviewsPage = lazy(() => import('./pages/Interviews'))
const MaterialsPage = lazy(() => import('./pages/Materials'))
const ResumePage = lazy(() => import('./pages/Resume'))
const MessagesPage = lazy(() => import('./pages/Messages'))
const SettingsPage = lazy(() => import('./pages/Settings'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
)

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#3B82F6', borderRadius: 8 } }}>
      <AntApp>
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/assessments" element={<AssessmentsPage />} />
                <Route path="/interviews" element={<InterviewsPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/resume" element={<ResumePage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
