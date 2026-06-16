import { computeStandings } from '../tournament'

const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank)

// Endplatzierung aus den KO-Ergebnissen ableiten (nur wenn alles entschieden).
// Jedes KO-Spiel trägt `places`: die Plätze, die es vergibt. Halbfinals haben
// keine `places` (sie leiten nur weiter), Bye-Einträge vergeben einen Platz.
function finalRanking(koMatches, results, nameOf) {
  if (!koMatches) return null
  const ranked = []
  for (const m of koMatches) {
    if (!m.places) continue // Halbfinale
    if (m.bye) {
      ranked.push({ rank: m.places[0], name: nameOf(m.home) })
      continue
    }
    const w = results[m.id]
    if (!w || !m.home || !m.away) return null // noch nicht entschieden
    const l = w === m.home ? m.away : m.home
    ranked.push({ rank: m.places[0], name: nameOf(w) })
    ranked.push({ rank: m.places[1], name: nameOf(l) })
  }
  if (ranked.length === 0) return null
  return ranked.sort((a, b) => a.rank - b.rank)
}

export default function Tabelle({ groups, results, nameOf, koMatches }) {
  const ranking = finalRanking(koMatches, results, nameOf)
  const multiGroup = groups.length > 1

  return (
    <div className="tabelle">
      {ranking && (
        <section className="final-standings">
          <h2>🏆 Endplatzierung</h2>
          <ol className="final-list">
            {ranking.map((r) => (
              <li key={r.rank} className={r.rank <= 3 ? `podium podium-${r.rank}` : ''}>
                <span className="final-rank">{medal(r.rank)}</span>
                <span className="final-name">{r.name}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="group-tables">
        {groups.map((g) => {
          const standings = computeStandings(g, results)
          return (
            <section className="group-table" key={g.name}>
              <h2>{multiGroup ? `Gruppe ${g.name}` : 'Tabelle'}</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th className="name-col">Team</th>
                    <th>Sp</th>
                    <th>S</th>
                    <th>N</th>
                    <th>Pkt</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => (
                    <tr key={s.id} className={s.rank <= 2 ? 'qualified' : ''}>
                      <td>{s.rank}</td>
                      <td className="name-col">{nameOf(s.id)}</td>
                      <td>{s.played}</td>
                      <td>{s.wins}</td>
                      <td>{s.losses}</td>
                      <td className="pts">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="legend">
                Top 2 (grün) erreichen {multiGroup ? 'das Halbfinale' : 'das Finale'}.
              </p>
            </section>
          )
        })}
      </div>
    </div>
  )
}
