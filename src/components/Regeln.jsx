// Statische Spielregeln. Inhaltlich vorgegeben, hier nur sauber formuliert
// und in Abschnitte gegliedert.
const SECTIONS = [
  {
    title: '🎯 Ablauf',
    items: [
      'Pro Spiel gilt eine feste Wurfreihenfolge.',
      'Das erstgenannte Team beginnt.',
      '10 Minuten Spielzeit — wer dann weniger Becher übrig hat, verliert.',
    ],
  },
  {
    title: '🛑 Am Tisch',
    items: [
      'Der Ellbogen darf beim Wurf nicht über die Tischkante ragen.',
      'Kein Pusten.',
      'Prallt der Ball beim Wurf zuerst auf den Tisch, darf er weggeschlagen werden.',
      'Berührt der Ball eine Hand des gegnerischen Teams, bevor er Tisch oder Becher berührt, gibt es einen Strafbecher.',
    ],
  },
  {
    title: '✨ Sonderwürfe',
    items: [
      'Treffen beide Spieler eines Teams, darf noch einmal geworfen werden.',
      'Rollt der Ball nach einem Wurf über die Tischmitte zurück, darf er per Trickshot noch einmal geworfen werden.',
      'Bombe: Landen beide Bälle im selben Becher, zählen auch alle direkt umliegenden Becher als getroffen.',
    ],
  },
  {
    title: '🔄 Becher zusammenstellen',
    items: [
      'Bei 6 oder 3 verbleibenden Bechern darf neu zusammengestellt werden.',
    ],
  },
]

export default function Regeln() {
  return (
    <div className="regeln">
      {SECTIONS.map((s) => (
        <section className="regel-card" key={s.title}>
          <h2>{s.title}</h2>
          <ul>
            {s.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
