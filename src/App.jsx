import { useEffect, useMemo, useState } from 'react'
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  computeKnockoutMatches,
  groupLayout,
  groupMatches,
  isGroupPhaseComplete,
  neededTeams,
} from './tournament'
import { can, isValidRole } from './users'
import Login from './components/Login'
import Teams from './components/Teams'
import Spielplan from './components/Spielplan'
import Tabelle from './components/Tabelle'

const STORAGE_KEY = 'bierpong-turnier-v3'
const AUTH_KEY = 'bierpong-auth-v1'

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const a = JSON.parse(raw)
    // Sitzung nur akzeptieren, wenn die Rolle noch in users.js existiert.
    return a && a.username && isValidRole(a.role) ? a : null
  } catch {
    return null
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.players) || !parsed.teams || !parsed.results) return null
    if (!Array.isArray(parsed.groups)) parsed.groups = []
    return parsed
  } catch {
    return null
  }
}

const emptyState = { players: [], drawn: false, groups: [], teams: {}, results: {} }

// Fisher-Yates Shuffle für eine faire Auslosung.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [state, setState] = useState(() => loadState() || emptyState)
  const [auth, setAuth] = useState(loadAuth)
  const [tab, setTab] = useState('teams')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    else localStorage.removeItem(AUTH_KEY)
  }, [auth])

  const logout = () => setAuth(null)

  // Falls noch nicht ausgelost wurde, bleibt nur der Teams-Reiter aktiv.
  useEffect(() => {
    if (!state.drawn && tab !== 'teams') setTab('teams')
  }, [state.drawn, tab])

  const role = auth?.role
  const mayEditTeams = can.editTeams(role)
  const mayReset = can.reset(role)
  const mayEnterResults = can.enterResults(role)

  const addPlayer = (name) => {
    if (!mayEditTeams) return
    const n = name.trim()
    if (!n) return
    setState((prev) => {
      if (prev.drawn) return prev
      if (prev.players.length >= MAX_PLAYERS) return prev
      if (prev.players.some((p) => p.toLowerCase() === n.toLowerCase())) return prev
      return { ...prev, players: [...prev.players, n] }
    })
  }

  const removePlayer = (name) => {
    if (!mayEditTeams) return
    setState((prev) =>
      prev.drawn ? prev : { ...prev, players: prev.players.filter((p) => p !== name) },
    )
  }

  const drawTeams = () => {
    if (!mayEditTeams) return
    setState((prev) => {
      const n = prev.players.length
      if (prev.drawn || n < MIN_PLAYERS || n > MAX_PLAYERS) return prev
      const shuffled = shuffle(prev.players)
      const groups = groupLayout(neededTeams(n))
      const teams = {}
      // Spieler der Reihe nach in Zweier-Teams füllen; ist die Anzahl
      // ungerade, bekommt das letzte Team nur einen Spieler (spielt allein).
      groups.flatMap((g) => g.teamIds).forEach((id, i) => {
        const first = shuffled[i * 2]
        const second = shuffled[i * 2 + 1]
        teams[id] = second !== undefined ? [first, second] : [first]
      })
      return { ...prev, drawn: true, groups, teams, results: {} }
    })
    setTab('teams')
  }

  // Tauscht zwei Spieler-Slots (auch innerhalb desselben Teams).
  const swapPlayers = (a, b) => {
    if (!mayEditTeams) return
    if (a.teamId === b.teamId && a.slot === b.slot) return
    setState((prev) => {
      const teams = { ...prev.teams }
      if (a.teamId === b.teamId) {
        const arr = [...teams[a.teamId]]
        ;[arr[a.slot], arr[b.slot]] = [arr[b.slot], arr[a.slot]]
        teams[a.teamId] = arr
      } else {
        const arrA = [...teams[a.teamId]]
        const arrB = [...teams[b.teamId]]
        const tmp = arrA[a.slot]
        arrA[a.slot] = arrB[b.slot]
        arrB[b.slot] = tmp
        teams[a.teamId] = arrA
        teams[b.teamId] = arrB
      }
      return { ...prev, teams }
    })
  }

  const setResult = (matchId, winnerId) => {
    if (!mayEnterResults) return
    setState((prev) => {
      const results = { ...prev.results }
      if (results[matchId] === winnerId) {
        delete results[matchId] // erneutes Klicken hebt das Ergebnis auf
      } else {
        results[matchId] = winnerId
      }
      // KO-Ergebnisse verwerfen, die durch geänderte Gruppenspiele
      // ungültig werden könnten — Konsistenz hat Vorrang.
      if (matchId.startsWith('G-')) {
        for (const key of Object.keys(results)) {
          if (key.startsWith('KO-')) delete results[key]
        }
      }
      return { ...prev, results }
    })
  }

  const resetTournament = () => {
    if (!mayReset) return
    if (window.confirm('Turnier wirklich komplett zurücksetzen? Alle Teams und Ergebnisse gehen verloren.')) {
      setState(emptyState)
      setTab('teams')
    }
  }

  const nameOf = (id) => {
    const t = state.teams[id]
    if (!t) return id
    return t.length > 1 ? `${t[0]} & ${t[1]}` : t[0]
  }

  const matches = useMemo(() => groupMatches(state.groups), [state.groups])
  const groupComplete = useMemo(
    () => isGroupPhaseComplete(state.groups, state.results),
    [state.groups, state.results],
  )
  const koMatches = useMemo(
    () => computeKnockoutMatches(state.groups, state.results),
    [state.groups, state.results],
  )

  if (!auth) {
    return <Login onLogin={setAuth} />
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>🍺 Bierpong Turnier 🏓</h1>
        <div className="topbar-actions">
          <span className="user-badge">👤 {auth.label}</span>
          {mayReset && (
            <button className="reset-btn" onClick={resetTournament}>
              ⟳ Reset
            </button>
          )}
          <button className="logout-btn" onClick={logout}>
            Abmelden
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={tab === 'teams' ? 'tab active' : 'tab'}
          onClick={() => setTab('teams')}
        >
          👥 Teams
        </button>
        <button
          className={tab === 'spielplan' ? 'tab active' : 'tab'}
          onClick={() => state.drawn && setTab('spielplan')}
          disabled={!state.drawn}
          title={state.drawn ? '' : 'Erst Teams auslosen'}
        >
          📋 Spielplan {state.drawn ? '' : '🔒'}
        </button>
        <button
          className={tab === 'tabelle' ? 'tab active' : 'tab'}
          onClick={() => state.drawn && setTab('tabelle')}
          disabled={!state.drawn}
          title={state.drawn ? '' : 'Erst Teams auslosen'}
        >
          📊 Tabelle {state.drawn ? '' : '🔒'}
        </button>
      </nav>

      <main className="content">
        {tab === 'teams' && (
          <Teams
            players={state.players}
            drawn={state.drawn}
            groups={state.groups}
            teams={state.teams}
            canEdit={mayEditTeams}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onDraw={drawTeams}
            onSwap={swapPlayers}
          />
        )}
        {tab === 'spielplan' && (
          <Spielplan
            groups={state.groups}
            matches={matches}
            results={state.results}
            nameOf={nameOf}
            groupComplete={groupComplete}
            koMatches={koMatches}
            onResult={setResult}
          />
        )}
        {tab === 'tabelle' && (
          <Tabelle
            groups={state.groups}
            results={state.results}
            nameOf={nameOf}
            koMatches={koMatches}
          />
        )}
      </main>
    </div>
  )
}
