export default function MatchCard({ match, results, nameOf, onResult }) {
  const { id, home, away } = match
  const winner = results[id]
  const ready = home && away // bei KO erst spielbar, wenn beide Teams feststehen

  const side = (teamId, placeholder) => {
    const isWinner = winner && winner === teamId
    const isLoser = winner && winner !== teamId
    const cls = ['team-side', isWinner && 'win', isLoser && 'lose'].filter(Boolean).join(' ')
    return (
      <button
        className={cls}
        disabled={!teamId}
        onClick={() => teamId && onResult(id, teamId)}
      >
        {teamId ? nameOf(teamId) : placeholder}
        {isWinner && <span className="trophy"> 👑</span>}
      </button>
    )
  }

  return (
    <div className={ready ? 'match' : 'match pending'}>
      {side(home, '???')}
      <span className="vs">vs</span>
      {side(away, '???')}
    </div>
  )
}
