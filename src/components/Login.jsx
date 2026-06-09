import { useState } from 'react'
import { authenticate } from '../users'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const session = authenticate(username, password)
    if (session) {
      onLogin(session)
    } else {
      setError(true)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>🍺 Bierpong Turnier 🏓</h1>
        <p className="subtitle">Bitte melde dich an, um fortzufahren.</p>

        <label className="field">
          <span>Benutzername</span>
          <input
            type="text"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError(false)
            }}
          />
        </label>

        <label className="field">
          <span>Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(false)
            }}
          />
        </label>

        {error && <p className="warn">Benutzername oder Passwort ist falsch.</p>}

        <button type="submit" className="start-btn" disabled={!username || !password}>
          🔓 Anmelden
        </button>
      </form>
    </div>
  )
}
