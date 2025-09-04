import { useState } from 'react'
import api from '../lib/api'

export default function Login({ onLogin }){
  const [email, setEmail] = useState('dinesh@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      const { data } = await api.post('/auth/login', { email, password })
      onLogin(data.access_token)
    }catch(err){
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={submit} className="bg-white w-full max-w-sm p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <label className="block text-sm mb-1">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded-xl px-3 py-2 mb-3" />
        <label className="block text-sm mb-1">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded-xl px-3 py-2 mb-4" />
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <button className="w-full bg-gray-900 text-white rounded-xl py-2">Sign in</button>
        <p className="text-xs text-gray-500 mt-3">Demo account is auto-created on first login.</p>
      </form>
    </div>
  )
}
