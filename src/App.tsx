import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Login from "./pages/Login"
import ReportView from "./pages/ReportView"
import ReportEdit from "./pages/ReportEdit"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/reports/:id" element={<ReportView />} />
        <Route path="/reports/:id/edit" element={<ReportEdit />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
