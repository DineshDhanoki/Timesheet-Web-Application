import { useState, useEffect } from 'react'
import TimesheetForm from './components/TimesheetForm.jsx'
import History from './components/History.jsx'
import Login from './components/Login.jsx'
import api from './lib/api.js'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [view, setView] = useState('timesheet')

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  if (!token) return <Login onLogin={setToken} />

  return (
    <div className="min-h-screen text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
          <div className="text-xl font-semibold">Timesheet Pro</div>
          <nav className="flex gap-3">
            <button onClick={() => setView('timesheet')} className={`px-3 py-1 rounded-xl ${view==='timesheet'?'bg-gray-900 text-white':'bg-gray-200'}`}>Timesheet</button>
            <button onClick={() => setView('history')} className={`px-3 py-1 rounded-xl ${view==='history'?'bg-gray-900 text-white':'bg-gray-200'}`}>History</button>
            <button onClick={() => { setToken(null)}} className="px-3 py-1 rounded-xl bg-rose-600 text-white">Logout</button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        {view === 'timesheet' ? <TimesheetForm token={token} /> : <History token={token} />}
      </main>
      <footer className="text-center text-sm text-gray-500 py-6">© {new Date().getFullYear()} Timesheet Pro</footer>
    </div>
  )
}
