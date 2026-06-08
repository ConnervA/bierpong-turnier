import { GROUPS, computeStandings } from '../tournament'

const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank)

// Endplatzierung aus den KO-Ergebnissen ableiten (nur wenn entschieden).
function finalRanking(koMatches, results, nameOf) {
  if (!koMatches) return null
  const byId = Object.fromEntries(koMatches.map((m) => [m.id, m]))
  const pair = (matchId, hiRank) => {
    const m = byId[matchId]
    const w = results[m.id]
    if (!w || !m.home || !m.away) return null
    const l = w === m.home ? m.away : m.home
    return [
      { rank: hiRank, name: nameOf(w) },
      { rank: hiRank + 1, name: nameOf(l) },
    ]
  }
  const blocks = [
    pair('KO-FINAL', 1),
    pair('KO-THIRD', 3),
    pair('KO-P5', 5),
    pair('KO-P7', 7),
    pair('KO-P9', 9),
  ]
  if (blocks.some((b) => b === null)) return null
  return blocks.flat()
}

export default function Tabelle({ results, nameOf, koMatches }) {
  const ranking = finalRanking(koMatches, results, nameOf)

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
        {GROUPS.map((g) => {
          const standings = computeStandings(g, results)
          return (
            <section className="group-table" key={g}>
              <h2>Gruppe {g}</h2>
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
              <p className="legend">Top 2 (grün) erreichen das Halbfinale.</p>
            </section>
          )
        })}
      </div>
    </div>
  )
}
