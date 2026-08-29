import { Routes, Route } from 'react-router'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Home from './pages/Home'
import ReportView from './pages/ReportView'
import ReportEdit from './pages/ReportEdit'
import NotFound from './pages/NotFound'
import DemoDashboard from './pages/DemoDashboard'
import DemoReport from './pages/DemoReport'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Home />} />
      <Route path="/reports/:id" element={<ReportView />} />
      <Route path="/reports/:id/edit" element={<ReportEdit />} />
      <Route path="/demo" element={<DemoDashboard />} />
      <Route path="/demo/report" element={<DemoReport />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
