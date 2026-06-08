// Reine Logik des Turniers — keine React-Abhängigkeiten.

export const GROUPS = ['A', 'B']
export const TEAMS_PER_GROUP = 5
export const POINTS_PER_WIN = 3

// Feste Team-IDs: A1..A5, B1..B5. Die Namen sind frei editierbar,
// die ID bleibt als stabile Identität über das ganze Turnier erhalten.
export function teamIds(group) {
  return Array.from({ length: TEAMS_PER_GROUP }, (_, i) => `${group}${i + 1}`)
}

export function allTeamIds() {
  return GROUPS.flatMap(teamIds)
}

// Feste Spielreihenfolge für 5 Teams (Index 0..4), bei der nie zwei
// aufeinanderfolgende Partien ein gemeinsames Team haben — kein Team
// muss also doppelt hintereinander spielen. (Hamiltonpfad im Petersen-Graph
// über alle 10 Paarungen von K5.)
const MATCH_ORDER = [
  [0, 1], [2, 3], [0, 4], [1, 2], [3, 4],
  [0, 2], [1, 3], [2, 4], [0, 3], [1, 4],
]

// Round-Robin: jedes Team gegen jedes andere in der Gruppe.
export function generateGroupMatches() {
  const matches = []
  for (const group of GROUPS) {
    const ids = teamIds(group)
    for (const [i, j] of MATCH_ORDER) {
      matches.push({
        id: `G-${ids[i]}-${ids[j]}`,
        group,
        home: ids[i],
        away: ids[j],
      })
    }
  }
  return matches
}

export const GROUP_MATCHES = generateGroupMatches()

// Tabelle einer Gruppe aus den Ergebnissen berechnen (sortiert).
export function computeStandings(group, results) {
  const ids = teamIds(group)
  const stats = {}
  for (const id of ids) {
    stats[id] = { id, played: 0, wins: 0, losses: 0, points: 0 }
  }

  for (const m of GROUP_MATCHES) {
    if (m.group !== group) continue
    const winner = results[m.id]
    if (!winner) continue
    const loser = winner === m.home ? m.away : m.home
    stats[winner].played++
    stats[winner].wins++
    stats[winner].points += POINTS_PER_WIN
    stats[loser].played++
    stats[loser].losses++
  }

  // Direkter Vergleich (Head-to-Head) als Tiebreaker zwischen Punktgleichen.
  const h2hPoints = (id, tiedIds) => {
    let pts = 0
    for (const m of GROUP_MATCHES) {
      if (m.group !== group) continue
      if (![m.home, m.away].includes(id)) continue
      const opp = m.home === id ? m.away : m.home
      if (!tiedIds.includes(opp)) continue
      if (results[m.id] === id) pts += POINTS_PER_WIN
    }
    return pts
  }

  const ordered = ids.map((id) => stats[id]).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const tied = ids.filter((id) => stats[id].points === a.points)
    const diff = h2hPoints(b.id, tied) - h2hPoints(a.id, tied)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })

  return ordered.map((s, i) => ({ ...s, rank: i + 1 }))
}

// Sind alle Gruppenspiele gespielt?
export function isGroupPhaseComplete(results) {
  return GROUP_MATCHES.every((m) => results[m.id])
}

// KO-Spiele aus den Endplatzierungen + KO-Ergebnissen ableiten.
// Liefert eine Liste mit aufgelösten Team-IDs (oder null wenn noch offen).
export function computeKnockoutMatches(results) {
  if (!isGroupPhaseComplete(results)) return null

  const a = computeStandings('A', results) // rank 1..5
  const b = computeStandings('B', results)
  const A = (rank) => a[rank - 1].id
  const B = (rank) => b[rank - 1].id

  const winnerOf = (id) => results[id] || null
  const loserOf = (matchId, home, away) => {
    const w = results[matchId]
    if (!w || !home || !away) return null
    return w === home ? away : home
  }

  const sf1 = { id: 'KO-SF1', label: 'Halbfinale 1', home: A(1), away: B(2) }
  const sf2 = { id: 'KO-SF2', label: 'Halbfinale 2', home: B(1), away: A(2) }

  const finalHome = winnerOf('KO-SF1')
  const finalAway = winnerOf('KO-SF2')
  const thirdHome = loserOf('KO-SF1', sf1.home, sf1.away)
  const thirdAway = loserOf('KO-SF2', sf2.home, sf2.away)

  return [
    sf1,
    sf2,
    { id: 'KO-FINAL', label: '🏆 Finale', home: finalHome, away: finalAway },
    { id: 'KO-THIRD', label: '🥉 Spiel um Platz 3', home: thirdHome, away: thirdAway },
    { id: 'KO-P5', label: 'Platz 5', home: A(3), away: B(3) },
    { id: 'KO-P7', label: 'Platz 7', home: A(4), away: B(4) },
    { id: 'KO-P9', label: 'Platz 9', home: A(5), away: B(5) },
  ]
}
