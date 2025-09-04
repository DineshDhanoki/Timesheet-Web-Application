import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

const daysTemplate = () => {
  const start = new Date()
  // default to current week (Mon-Sun)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(start.setDate(diff))
  const items = []
  for(let i=0;i<7;i++){
    const d = new Date(monday)
    d.setDate(monday.getDate()+i)
    const ds = d.toISOString().slice(0,10)
    items.push({ date: ds, hours: 0, description: '' })
  }
  return items
}

export default function TimesheetForm({ token }){
  const [entries, setEntries] = useState(daysTemplate())
  const [client, setClient] = useState('Claris International Inc')
  const [manager, setManager] = useState('Sudheer Tivare')
  const [message, setMessage] = useState(null)
  const total = useMemo(()=>entries.reduce((a,b)=>a + Number(b.hours || 0),0),[entries])

  const save = async () => {
    setMessage(null)
    const payload = { client, manager, entries }
    const { data } = await api.post('/timesheets', payload, { headers: { Authorization: `Bearer ${token}`}})
    setMessage('Saved draft #' + data.id)
  }

  const generatePdf = async () => {
    setMessage(null)
    const payload = { client, manager, entries }
    const { data } = await api.post('/timesheets', payload, { headers: { Authorization: `Bearer ${token}`}})
    const id = data.id
    window.open(`/api/timesheets/${id}/pdf?token=${token}`, '_blank')
  }

  const submitSheet = async () => {
    setMessage(null)
    const payload = { client, manager, entries }
    const { data } = await api.post('/timesheets', payload, { headers: { Authorization: `Bearer ${token}`}})
    await api.post(`/timesheets/${data.id}/submit`, {}, { headers: { Authorization: `Bearer ${token}`}})
    setMessage('Submitted for approval')
  }

  const updateEntry = (i, patch) => {
    setEntries(prev => {
      const cp = [...prev]
      cp[i] = { ...cp[i], ...patch }
      return cp
    })
  }

  return (
    <div className="grid gap-4">
      <div className="bg-white p-4 rounded-2xl shadow flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Customer</label>
            <input className="w-full border rounded-xl px-3 py-2" value={client} onChange={e=>setClient(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Manager</label>
            <input className="w-full border rounded-xl px-3 py-2" value={manager} onChange={e=>setManager(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Date</th>
                <th className="p-2 w-24">Hours</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row, i)=> (
                <tr key={i} className="odd:bg-gray-50">
                  <td className="p-2">{row.date}</td>
                  <td className="p-2"><input type="number" min="0" max="24" className="w-20 border rounded-xl px-2 py-1" value={row.hours} onChange={e=>updateEntry(i,{hours:e.target.value})}/></td>
                  <td className="p-2"><input className="w-full border rounded-xl px-3 py-1" value={row.description} onChange={e=>updateEntry(i,{description:e.target.value})}/></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-2 font-medium">Total</td>
                <td className="p-2 font-semibold">{total}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 rounded-xl bg-gray-900 text-white">Save Draft</button>
          <button onClick={generatePdf} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Generate PDF</button>
          <button onClick={submitSheet} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Submit</button>
          {message && <div className="ml-auto text-sm text-gray-600">{message}</div>}
        </div>
      </div>
    </div>
  )
}
