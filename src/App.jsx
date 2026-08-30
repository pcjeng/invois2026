import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import PrintView from './pages/PrintView'
import Customers from './pages/Customers'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      {/* Print view: tanpa header/nav supaya boleh dicetak bersih */}
      <Route path="/doc/:id/print" element={<PrintView />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new" element={<Editor />} />
              <Route path="/doc/:id" element={<Editor />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  )
}
