import { useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS, groupLayout, neededTeams } from '../tournament'

export default function Teams({
  players,
  drawn,
  groups,
  teams,
  canEdit,
  onAddPlayer,
  onRemovePlayer,
  onDraw,
  onSwap,
}) {
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState(null) // { teamId, slot }

  const submit = (e) => {
    e.preventDefault()
    onAddPlayer(input)
    setInput('')
  }

  const handleChipClick = (teamId, slot) => {
    if (!canEdit) return
    if (!selected) {
      setSelected({ teamId, slot })
      return
    }
    if (selected.teamId === teamId && selected.slot === slot) {
      setSelected(null) // gleiche Auswahl → abwählen
      return
    }
    onSwap(selected, { teamId, slot })
    setSelected(null)
  }

  const isSelected = (teamId, slot) =>
    selected && selected.teamId === teamId && selected.slot === slot

  // ---------- Vor der Auslosung ----------
  if (!drawn) {
    // Eingeschränkte User dürfen nicht auslosen → Hinweis statt Eingabe.
    if (!canEdit) {
      return (
        <div className="teams-setup">
          <div className="teams-card">
            <h2>👥 Teams</h2>
            <p className="locked">
              🔒 Die Teams wurden noch nicht ausgelost. Das übernimmt der Organisator —
              danach erscheinen sie hier.
            </p>
          </div>
        </div>
      )
    }

    const count = players.length
    const atMax = count >= MAX_PLAYERS
    const trimmed = input.trim()
    const duplicateHint =
      trimmed && players.some((p) => p.toLowerCase() === trimmed.toLowerCase())

    const canDraw = count >= MIN_PLAYERS && count <= MAX_PLAYERS
    const numTeams = neededTeams(count)
    const layout = groupLayout(numTeams)
    const oddPlayer = count % 2 === 1

    return (
      <div className="teams-setup">
        <div className="teams-card">
          <h2>👥 Spieler eintragen</h2>
          <p className="subtitle">
            Trage die Mitspieler ein (max. <strong>{MAX_PLAYERS}</strong>). Daraus werden
            zufällig Zweier-Teams ausgelost — bei ungerader Anzahl spielt eine Person allein.
          </p>

          <form onSubmit={submit} className="player-add">
            <input
              type="text"
              value={input}
              maxLength={24}
              autoFocus
              disabled={atMax}
              placeholder={atMax ? 'Maximum erreicht' : 'Name eingeben…'}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!trimmed || duplicateHint || atMax}>
              + Hinzufügen
            </button>
          </form>
          {duplicateHint && <p className="warn">Diesen Namen gibt es schon.</p>}
          {atMax && !duplicateHint && (
            <p className="warn">Maximal {MAX_PLAYERS} Spieler.</p>
          )}

          <div className="player-count">
            <span className={canDraw ? 'ok' : ''}>
              {count} / {MAX_PLAYERS} Spieler
            </span>
          </div>

          {count > 0 && (
            <ul className="player-pool">
              {players.map((p) => (
                <li key={p}>
                  <span>{p}</span>
                  <button
                    className="chip-remove"
                    onClick={() => onRemovePlayer(p)}
                    aria-label={`${p} entfernen`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button className="draw-btn" disabled={!canDraw} onClick={onDraw}>
            🎲 Zufällige Teams auslosen
          </button>
          {canDraw ? (
            <p className="hint">
              → {numTeams} Teams in {layout.length === 1 ? 'einer Gruppe' : '2 Gruppen'}
              {oddPlayer && ', eine Person spielt allein'}.
            </p>
          ) : (
            <p className="hint">
              Mindestens {MIN_PLAYERS} Spieler nötig
              {count < MIN_PLAYERS && ` — noch ${MIN_PLAYERS - count}.`}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ---------- Nach der Auslosung: Übersicht (+ Tauschen nur für Admin) ----------
  const multiGroup = groups.length > 1

  return (
    <div className="teams-overview">
      <div className="teams-toolbar">
        <h2>👥 Teams</h2>
        <p className="swap-hint">
          {!canEdit
            ? '🔒 Nur der Organisator kann Teams ändern.'
            : selected
              ? '↔️ Jetzt einen zweiten Spieler anklicken zum Tauschen (oder denselben zum Abbrechen).'
              : 'Tipp: Zwei Spieler anklicken, um sie zu tauschen — falls jemand nicht kann.'}
        </p>
      </div>

      <div className="teams-groups">
        {groups.map((g) => (
          <div className="teams-group" key={g.name}>
            <h3>{multiGroup ? `Gruppe ${g.name}` : 'Alle Teams'}</h3>
            {g.teamIds.map((id) => (
              <div className="team-card" key={id}>
                <span className="team-tag">Team {id}</span>
                <div className="team-players">
                  {teams[id].map((player, slot) =>
                    canEdit ? (
                      <button
                        key={slot}
                        className={isSelected(id, slot) ? 'player-chip selected' : 'player-chip'}
                        onClick={() => handleChipClick(id, slot)}
                      >
                        {player}
                      </button>
                    ) : (
                      <span key={slot} className="player-chip static">
                        {player}
                      </span>
                    ),
                  )}
                  {teams[id].length === 1 && <span className="solo-note">spielt allein</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
