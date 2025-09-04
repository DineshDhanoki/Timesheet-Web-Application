import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function History({ token }){
  const [rows, setRows] = useState([])

  useEffect(()=>{
    (async ()=>{
      const { data } = await api.get('/timesheets', { headers: { Authorization: `Bearer ${token}`}})
      setRows(data.items || [])
    })()
  }, [token])

  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h2 className="text-lg font-semibold mb-3">Timesheet History</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">#</th>
            <th className="p-2">Week</th>
            <th className="p-2">Total Hours</th>
            <th className="p-2">Status</th>
            <th className="p-2">PDF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=> (
            <tr key={r.id} className="odd:bg-gray-50">
              <td className="p-2">{r.id}</td>
              <td className="p-2">{r.week_start} → {r.week_end}</td>
              <td className="p-2">{r.total_hours}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">
                <a className="text-blue-600 underline" href={`/api/timesheets/${r.id}/pdf?token=${localStorage.getItem('token')}`} target="_blank">Download</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
