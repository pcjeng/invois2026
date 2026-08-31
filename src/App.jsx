import { Routes, Route } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import PrintView from './pages/PrintView'
import Customers from './pages/Customers'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      {/* Print view: tanpa header/nav supaya boleh dicetak bersih — tetap perlukan login */}
      <Route
        path="/doc/:id/print"
        element={
          <AuthGate>
            <PrintView />
          </AuthGate>
        }
      />
      <Route
        path="*"
        element={
          <AuthGate>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/new" element={<Editor />} />
                <Route path="/doc/:id" element={<Editor />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </AuthGate>
        }
      />
    </Routes>
  )
}
