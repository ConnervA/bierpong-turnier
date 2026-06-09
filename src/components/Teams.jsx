import { useState } from 'react'
import { GROUPS, teamIds } from '../tournament'

const TARGET = 20 // 10 Teams à 2 Spieler

export default function Teams({
  players,
  drawn,
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

    const duplicateHint =
      input.trim() &&
      players.some((p) => p.toLowerCase() === input.trim().toLowerCase())

    return (
      <div className="teams-setup">
        <div className="teams-card">
          <h2>👥 Spieler eintragen</h2>
          <p className="subtitle">
            Trage alle <strong>{TARGET}</strong> Mitspieler ein. Anschließend werden daraus
            zufällig 10 Teams à 2 Spieler ausgelost.
          </p>

          <form onSubmit={submit} className="player-add">
            <input
              type="text"
              value={input}
              maxLength={24}
              autoFocus
              placeholder="Name eingeben…"
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim() || duplicateHint}>
              + Hinzufügen
            </button>
          </form>
          {duplicateHint && <p className="warn">Diesen Namen gibt es schon.</p>}

          <div className="player-count">
            <span className={players.length === TARGET ? 'ok' : ''}>
              {players.length} / {TARGET} Spieler
            </span>
          </div>

          {players.length > 0 && (
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

          <button
            className="draw-btn"
            disabled={players.length !== TARGET}
            onClick={onDraw}
          >
            🎲 Zufällige Teams auslosen
          </button>
          {players.length !== TARGET && (
            <p className="hint">
              {players.length < TARGET
                ? `Noch ${TARGET - players.length} Spieler hinzufügen.`
                : `${players.length - TARGET} Spieler zu viel — bitte entfernen.`}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ---------- Nach der Auslosung: Übersicht (+ Tauschen nur für Admin) ----------
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
        {GROUPS.map((g) => (
          <div className="teams-group" key={g}>
            <h3>Gruppe {g}</h3>
            {teamIds(g).map((id, idx) => (
              <div className="team-card" key={id}>
                <span className="team-tag">Team {g}{idx + 1}</span>
                <div className="team-players">
                  {[0, 1].map((slot) =>
                    canEdit ? (
                      <button
                        key={slot}
                        className={isSelected(id, slot) ? 'player-chip selected' : 'player-chip'}
                        onClick={() => handleChipClick(id, slot)}
                      >
                        {teams[id][slot]}
                      </button>
                    ) : (
                      <span key={slot} className="player-chip static">
                        {teams[id][slot]}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
