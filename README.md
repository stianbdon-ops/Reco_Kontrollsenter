
# RECO Kontrollsenter – v31.9 full (repo-klart)

Denne pakken er klar for Netlify + Identity (Invite only).
- Push til `main` → Netlify publiserer automatisk.
- Identity: Site settings → Identity → Enable (Invite only). Inviter brukere og sett roller.

Struktur:
- index.html (login-overlay + Identity + Dashboard/Kalkyle/Rapport)
- _redirects / netlify.toml (SPA redirect)
- js/app.js (auth, kalkyle, rapport, eksport)
- data/ (demo ICC + materiell)
- assets/logo.svg
