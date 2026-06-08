import { GROUPS, GROUP_MATCHES } from '../tournament'
import MatchCard from './MatchCard'

export default function Spielplan({ results, nameOf, groupComplete, koMatches, onResult }) {
  const playedCount = GROUP_MATCHES.filter((m) => results[m.id]).length

  return (
    <div className="spielplan">
      <section className="phase">
        <div className="phase-head">
          <h2>Gruppenphase</h2>
          <span className="progress">{playedCount}/{GROUP_MATCHES.length} Spiele</span>
        </div>
        <div className="groups">
          {GROUPS.map((g) => (
            <div className="group-block" key={g}>
              <h3>Gruppe {g}</h3>
              {GROUP_MATCHES.filter((m) => m.group === g).map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  results={results}
                  nameOf={nameOf}
                  onResult={onResult}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="phase">
        <h2>KO-Phase</h2>
        {!groupComplete && (
          <p className="locked">
            🔒 Die KO-Spiele erscheinen automatisch, sobald alle Gruppenspiele gespielt sind.
          </p>
        )}
        {groupComplete && koMatches && (
          <div className="ko-list">
            {koMatches.map((m) => (
              <div className="ko-row" key={m.id}>
                <span className="ko-label">{m.label}</span>
                <MatchCard
                  match={m}
                  results={results}
                  nameOf={nameOf}
                  onResult={onResult}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
