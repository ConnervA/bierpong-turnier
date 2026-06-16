import MatchCard from './MatchCard'

export default function Spielplan({
  groups,
  matches,
  results,
  nameOf,
  groupComplete,
  koMatches,
  onResult,
}) {
  const playedCount = matches.filter((m) => results[m.id]).length
  const multiGroup = groups.length > 1

  return (
    <div className="spielplan">
      <section className="phase">
        <div className="phase-head">
          <h2>Gruppenphase</h2>
          <span className="progress">{playedCount}/{matches.length} Spiele</span>
        </div>
        <div className="groups">
          {groups.map((g) => (
            <div className="group-block" key={g.name}>
              <h3>{multiGroup ? `Gruppe ${g.name}` : 'Alle Spiele'}</h3>
              {matches
                .filter((m) => m.group === g.name)
                .map((m) => (
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
                {m.bye ? (
                  <div className="ko-bye">
                    <span className="ko-bye-team">{nameOf(m.home)}</span>
                    <span className="ko-bye-note">kampflos platziert</span>
                  </div>
                ) : (
                  <MatchCard
                    match={m}
                    results={results}
                    nameOf={nameOf}
                    onResult={onResult}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
