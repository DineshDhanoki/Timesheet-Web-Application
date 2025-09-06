import { useState, useEffect } from 'react'
import TimesheetForm from './components/TimesheetForm.jsx'
import History from './components/History.jsx'
import Login from './components/Login.jsx'
import api from './lib/api.js'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [view, setView] = useState('timesheet')
  const [dark, setDark] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
  const [savedDrafts, setSavedDrafts] = useState([])
  const [editingDraft, setEditingDraft] = useState(null)

  // Handle token changes
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  // Handle dark mode changes
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  // Handle when a draft is saved
  const handleDraftSaved = (draftData) => {
    const newDraft = {
      id: draftData.id,
      week_start: new Date(draftData.startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      week_end: new Date(new Date(draftData.startDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      total_hours: draftData.entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0),
      status: 'Draft',
      data: draftData // Store the full data for editing
    }
    
    if (draftData.isUpdate && draftData.originalId) {
      // Update existing draft
      setSavedDrafts(prev => prev.map(draft => 
        draft.id === draftData.originalId ? newDraft : draft
      ))
    } else {
      // Add new draft
      setSavedDrafts(prev => [newDraft, ...prev])
    }
  }

  // Handle deleting a draft
  const handleDeleteDraft = (draftId) => {
    setSavedDrafts(prev => prev.filter(draft => draft.id !== draftId))
  }

  // Handle when a timesheet is submitted
  const handleTimesheetSubmitted = (timesheetData) => {
    const newTimesheet = {
      id: timesheetData.id,
      week_start: new Date(timesheetData.startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      week_end: new Date(new Date(timesheetData.startDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      total_hours: timesheetData.entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0),
      status: 'Submitted',
      data: timesheetData // Store the full data
    }
    
    if (timesheetData.isUpdate && timesheetData.originalId) {
      // Update existing draft to submitted status
      setSavedDrafts(prev => prev.map(draft => 
        draft.id === timesheetData.originalId ? newTimesheet : draft
      ))
    } else {
      // Add new submitted timesheet
      setSavedDrafts(prev => [newTimesheet, ...prev])
    }
  }

  // Handle editing a draft
  const handleEditDraft = (draft) => {
    console.log('Edit draft:', draft)
    // Set the draft to edit and switch to timesheet view
    setEditingDraft(draft)
    setView('timesheet')
  }

  // Handle when editing is cancelled or completed
  const handleEditComplete = () => {
    setEditingDraft(null)
  }

  if (!token) return <Login onLogin={setToken} />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200/20 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Timesheet Pro
          </div>
          <nav className="flex gap-2 items-center">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
              <button 
                onClick={() => setView('timesheet')} 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  view === 'timesheet'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Timesheet
              </button>
              <button 
                onClick={() => setView('history')} 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  view === 'history'
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                History
              </button>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="p-2.5 ml-2 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200 text-lg"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setToken(null)} 
              className="px-4 py-2 ml-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/20 border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-8 text-gray-900 dark:text-gray-100">
            {view === 'timesheet' ? 
              <TimesheetForm 
                token={token} 
                onDraftSaved={handleDraftSaved} 
                onTimesheetSubmitted={handleTimesheetSubmitted}
                editingDraft={editingDraft}
                onEditComplete={handleEditComplete}
              /> : 
              <History token={token} savedDrafts={savedDrafts} onDeleteDraft={handleDeleteDraft} onEdit={handleEditDraft} />
            }
          </div>
        </div>
      </main>
      <footer className="text-center text-sm text-gray-500 dark:text-slate-400 py-8">
        © {new Date().getFullYear()} Timesheet Pro
      </footer>
    </div>
  )
}