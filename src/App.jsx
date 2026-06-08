import { useEffect, useMemo, useState } from 'react'
import {
  allTeamIds,
  computeKnockoutMatches,
  isGroupPhaseComplete,
} from './tournament'
import Teams from './components/Teams'
import Spielplan from './components/Spielplan'
import Tabelle from './components/Tabelle'

const STORAGE_KEY = 'bierpong-turnier-v2'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.players) || !parsed.teams || !parsed.results) return null
    return parsed
  } catch {
    return null
  }
}

const emptyState = { players: [], drawn: false, teams: {}, results: {} }

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
  const [tab, setTab] = useState('teams')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Falls noch nicht ausgelost wurde, bleibt nur der Teams-Reiter aktiv.
  useEffect(() => {
    if (!state.drawn && tab !== 'teams') setTab('teams')
  }, [state.drawn, tab])

  const addPlayer = (name) => {
    const n = name.trim()
    if (!n) return
    setState((prev) => {
      if (prev.drawn) return prev
      if (prev.players.some((p) => p.toLowerCase() === n.toLowerCase())) return prev
      return { ...prev, players: [...prev.players, n] }
    })
  }

  const removePlayer = (name) => {
    setState((prev) =>
      prev.drawn ? prev : { ...prev, players: prev.players.filter((p) => p !== name) },
    )
  }

  const drawTeams = () => {
    setState((prev) => {
      if (prev.drawn || prev.players.length !== 20) return prev
      const shuffled = shuffle(prev.players)
      const teams = {}
      allTeamIds().forEach((id, i) => {
        teams[id] = [shuffled[i * 2], shuffled[i * 2 + 1]]
      })
      return { ...prev, drawn: true, teams, results: {} }
    })
    setTab('teams')
  }

  // Tauscht zwei Spieler-Slots (auch innerhalb desselben Teams).
  const swapPlayers = (a, b) => {
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
    if (window.confirm('Turnier wirklich komplett zurücksetzen? Alle Teams und Ergebnisse gehen verloren.')) {
      setState(emptyState)
      setTab('teams')
    }
  }

  const nameOf = (id) => {
    const t = state.teams[id]
    return t ? `${t[0]} & ${t[1]}` : id
  }

  const groupComplete = useMemo(() => isGroupPhaseComplete(state.results), [state.results])
  const koMatches = useMemo(() => computeKnockoutMatches(state.results), [state.results])

  return (
    <div className="app">
      <header className="topbar">
        <h1>🍺 Bierpong Turnier 🏓</h1>
        <button className="reset-btn" onClick={resetTournament}>
          ⟳ Reset
        </button>
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
            teams={state.teams}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            onDraw={drawTeams}
            onSwap={swapPlayers}
          />
        )}
        {tab === 'spielplan' && (
          <Spielplan
            results={state.results}
            nameOf={nameOf}
            groupComplete={groupComplete}
            koMatches={koMatches}
            onResult={setResult}
          />
        )}
        {tab === 'tabelle' && (
          <Tabelle results={state.results} nameOf={nameOf} koMatches={koMatches} />
        )}
      </main>
    </div>
  )
}
