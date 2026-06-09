// ===========================================================================
//  ZUGANGSDATEN & ROLLEN
// ===========================================================================
//  ⚠️  WICHTIG: Dies ist nur eine EINFACHE SPERRE, KEIN echter Schutz.
//  Da die Seite statisch ist, landen diese Werte im ausgelieferten
//  JavaScript und können von technisch versierten Personen ausgelesen
//  werden. Es hält zufällige Besucher ab — nicht mehr.
//
//  👉 Passwörter unten anpassen, BEVOR du pushst. Bitte keine Passwörter
//     verwenden, die du auch anderswo nutzt.
// ===========================================================================

export const USERS = [
  {
    username: "organisator",
    password: "conner", // <-- HIER dein Admin-Passwort eintragen
    role: "admin", // darf alles
    label: "Organisator",
  },
  {
    username: "Schiedsrichter",
    password: "Schiedsrichter", // <-- HIER das Passwort für den 2. User eintragen
    role: "referee", // darf Ergebnisse eintragen, aber KEINE Teams ändern
    label: "Schiedsrichter",
  },
];

// Prüft Anmeldedaten und gibt bei Erfolg die Sitzungsdaten zurück (sonst null).
export function authenticate(username, password) {
  const u = USERS.find(
    (x) =>
      x.username === username.trim().toLowerCase() && x.password === password,
  );
  return u ? { username: u.username, role: u.role, label: u.label } : null;
}

// Prüft, ob eine gespeicherte Sitzung noch zu einem gültigen User passt.
export function isValidRole(role) {
  return USERS.some((u) => u.role === role);
}

// Zentrale Rechte-Definition.
export const can = {
  editTeams: (role) => role === "admin", // Spieler hinzufügen, auslosen, tauschen
  reset: (role) => role === "admin",
  enterResults: (role) => role === "admin" || role === "referee",
};
