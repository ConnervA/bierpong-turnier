// Reine Logik des Turniers — keine React-Abhängigkeiten.

export const MAX_PLAYERS = 20
export const MIN_PLAYERS = 3 // mindestens 2 Teams nötig, damit gespielt werden kann
export const POINTS_PER_WIN = 3

// Wie viele Teams ergeben sich aus den Spielern? Es werden Paare gebildet;
// bei ungerader Anzahl spielt eine Person allein (Team mit nur einem Spieler).
export function neededTeams(playerCount) {
  return Math.ceil(playerCount / 2)
}

function makeIds(group, n) {
  return Array.from({ length: n }, (_, i) => `${group}${i + 1}`)
}

// Gruppen-Layout aus der Teamzahl ableiten.
//  - bis 3 Teams: eine einzige Gruppe (für 2 Gruppen wären es zu wenige)
//  - ab 4 Teams: zwei möglichst gleich große Gruppen (z. B. 7 → 4 und 3)
// Liefert [{ name, teamIds }].
export function groupLayout(numTeams) {
  if (numTeams <= 0) return []
  if (numTeams <= 3) {
    return [{ name: 'A', teamIds: makeIds('A', numTeams) }]
  }
  const nA = Math.ceil(numTeams / 2)
  const nB = numTeams - nA
  return [
    { name: 'A', teamIds: makeIds('A', nA) },
    { name: 'B', teamIds: makeIds('B', nB) },
  ]
}

// Round-Robin per Kreismethode: jedes Team gegen jedes andere. Innerhalb
// einer Runde spielt kein Team doppelt, dadurch muss kaum ein Team zweimal
// direkt hintereinander ran. Funktioniert für beliebig viele Teams.
function roundRobinPairs(ids) {
  if (ids.length < 2) return []
  const arr = [...ids]
  if (arr.length % 2 === 1) arr.push(null) // "Freilos" auffüllen für gerade Anzahl
  const m = arr.length
  const half = m / 2
  let list = [...arr]
  const pairs = []
  for (let r = 0; r < m - 1; r++) {
    for (let i = 0; i < half; i++) {
      const home = list[i]
      const away = list[m - 1 - i]
      if (home !== null && away !== null) pairs.push([home, away])
    }
    // Erste Position bleibt fest, der Rest rotiert um eins.
    const [fixed, ...rest] = list
    rest.unshift(rest.pop())
    list = [fixed, ...rest]
  }
  return pairs
}

function matchesForGroup(group) {
  return roundRobinPairs(group.teamIds).map(([home, away]) => ({
    id: `G-${home}-${away}`,
    group: group.name,
    home,
    away,
  }))
}

// Alle Gruppenspiele für ein Layout erzeugen.
export function groupMatches(groups) {
  return groups.flatMap(matchesForGroup)
}

// Tabelle einer Gruppe aus den Ergebnissen berechnen (sortiert, mit Rang).
export function computeStandings(group, results) {
  const ids = group.teamIds
  const matches = matchesForGroup(group)
  const stats = {}
  for (const id of ids) {
    stats[id] = { id, played: 0, wins: 0, losses: 0, points: 0 }
  }

  for (const m of matches) {
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
    for (const m of matches) {
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

// Sind alle Gruppenspiele gespielt? (Leeres Layout zählt nicht als fertig.)
export function isGroupPhaseComplete(groups, results) {
  const ms = groupMatches(groups)
  return ms.length > 0 && ms.every((m) => results[m.id])
}

// KO-Spiele + Platzierungsspiele aus den Gruppentabellen ableiten.
// Jedes Spiel trägt `places`: die Plätze, die es entscheidet (Halbfinale: keine,
// da es nur ins Finale/Spiel-um-3 weiterleitet). `bye: true` markiert ein Team,
// das seinen Platz kampflos bekommt (wenn eine Gruppe ein Team mehr hat).
// Liefert null, solange die Gruppenphase nicht abgeschlossen ist.
export function computeKnockoutMatches(groups, results) {
  if (!isGroupPhaseComplete(groups, results)) return null

  const winnerOf = (id) => results[id] || null
  const loserOf = (matchId, home, away) => {
    const w = results[matchId]
    if (!w || !home || !away) return null
    return w === home ? away : home
  }

  // --- Eine Gruppe (≤ 3 Teams): Finale aus den Top 2, Rest kampflos platziert.
  if (groups.length === 1) {
    const s = computeStandings(groups[0], results)
    const at = (rank) => s[rank - 1]?.id ?? null
    const matches = [
      { id: 'KO-FINAL', label: '🏆 Finale', home: at(1), away: at(2), places: [1, 2] },
    ]
    for (let rank = 3; rank <= s.length; rank++) {
      matches.push({
        id: `KO-PLACE-${at(rank)}`,
        label: `Platz ${rank}`,
        home: at(rank),
        away: null,
        bye: true,
        places: [rank],
      })
    }
    return matches
  }

  // --- Zwei Gruppen: Halbfinale über Kreuz, danach Platzierungen je Rang.
  const A = computeStandings(groups[0], results)
  const B = computeStandings(groups[1], results)
  const ar = (rank) => A[rank - 1]?.id ?? null
  const br = (rank) => B[rank - 1]?.id ?? null
  const nA = A.length
  const nB = B.length

  const sf1 = { id: 'KO-SF1', label: 'Halbfinale 1', home: ar(1), away: br(2) }
  const sf2 = { id: 'KO-SF2', label: 'Halbfinale 2', home: br(1), away: ar(2) }

  const matches = [
    sf1,
    sf2,
    {
      id: 'KO-FINAL',
      label: '🏆 Finale',
      home: winnerOf('KO-SF1'),
      away: winnerOf('KO-SF2'),
      places: [1, 2],
    },
    {
      id: 'KO-THIRD',
      label: '🥉 Spiel um Platz 3',
      home: loserOf('KO-SF1', sf1.home, sf1.away),
      away: loserOf('KO-SF2', sf2.home, sf2.away),
      places: [3, 4],
    },
  ]

  // Platzierungsspiele für die übrigen Ränge: A-k gegen B-k (k = 3, 4, …).
  let place = 5
  const common = Math.min(nA, nB)
  for (let rank = 3; rank <= common; rank++) {
    matches.push({
      id: `KO-P${place}`,
      label: `Platz ${place}`,
      home: ar(rank),
      away: br(rank),
      places: [place, place + 1],
    })
    place += 2
  }

  // Hat eine Gruppe ein Team mehr, bekommt dessen Letzter den letzten Platz
  // kampflos (es gibt keinen Gegner im selben Rang in der anderen Gruppe).
  if (nA !== nB) {
    const bigger = nA > nB ? A : B
    const lastId = bigger[bigger.length - 1].id
    const lastPlace = nA + nB
    matches.push({
      id: `KO-PLACE-${lastId}`,
      label: `Platz ${lastPlace}`,
      home: lastId,
      away: null,
      bye: true,
      places: [lastPlace],
    })
  }

  return matches
}
