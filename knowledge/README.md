# knowledge/ — Wissensbasis und Prompts der ElevenLabs-Agenten

Quelle für alles hier ist `notes/Housekeeping_Handbuch_MountainChalets_Fiss.md`. Die Dateien in diesem Ordner sind die für Sprachagenten aufbereitete Fassung: entbrandet, ohne Dokument-Meta (Freigabefelder, Versionsstatus, Website-Verweise), Checklisten zu Sätzen umgeschrieben, und alles, was das Handbuch als „zu bestätigen" markiert, steht als `noch nicht festgelegt` drin statt erfunden zu werden.

## Warum zwei Nutzungsarten

ElevenLabs' Knowledge Base ist RAG: Dokumente werden in Chunks zerlegt und nach Ähnlichkeit zum Gesprächsverlauf nachgeladen. Das funktioniert für Nachschlagefragen („welches Tuch für die Küche"), gibt dem Agenten aber kein Gefühl für *Reihenfolge* und keine Garantie, dass Sicherheitsregeln im Kontext sind. Deshalb:

- **`prompt`** – wird bei jedem Turn komplett in den Kontext injiziert. Für Regeln, Farbsystem, Ablaufreihenfolge, Betriebsdaten, Interviewleitfaden. Klein halten.
- **`auto`** – wird per RAG nachgeladen. Für die 19 Prozessdokumente und Qualität/Meldung. Eine Datei pro Prozess, damit der Treffer sauber auf dem richtigen Prozess landet.

## Zwei Agenten

| Agent | Nutzer | Aufgabe | Env-Variable |
|---|---|---|---|
| **guidance** | Reinigungskraft | führt Schritt für Schritt durch die Abreisereinigung, beantwortet Nachschlagefragen, setzt Farbsystem durch, sagt bei offenen Betriebsdaten „nicht festgelegt" | `ELEVENLABS_AGENT_ID_GUIDANCE` (Fallback `ELEVENLABS_AGENT_ID`) |
| **onboarding** | Inhaber/Leitung | interviewt den Betrieb entlang der Prozessvorlage, schlägt Standards vor, sammelt Abweichungen und offene Punkte | `ELEVENLABS_AGENT_ID_ONBOARDING` |

Der Output des Onboarding-Agenten (Data-Collection-Felder, siehe `onboarding/data-collection.md`) füllt genau die Lücken in `guidance/betriebsdaten.md`.

## Dateien

| Datei | Agent | Modus | Handbuch |
|---|---|---|---|
| `shared/regeln-und-farbsystem.md` | beide | prompt | §3, §4 |
| `guidance/system-prompt.md` | guidance | Systemprompt | – |
| `guidance/first-message.md` | guidance | Begrüßung | – |
| `guidance/ablauf-uebersicht.md` | guidance | prompt | §6 Titel, §11 |
| `guidance/betriebsdaten.md` | guidance | prompt | §2.3, §12 (Platzhalter) |
| `guidance/betriebsdaten.demo.md` | guidance | prompt (mit `--demo`) | dito, mit Demo-Werten |
| `guidance/qualitaet-und-meldung.md` | guidance | auto | §5, §7, §8, P19 |
| `guidance/prozesse/01…19-*.md` | guidance | auto | §6 Prozess 1–19 |
| `onboarding/system-prompt.md` | onboarding | Systemprompt | – |
| `onboarding/first-message.md` | onboarding | Begrüßung | – |
| `onboarding/prozess-vorlage.md` | onboarding | prompt | §6 komprimiert + Varianten |
| `onboarding/interviewleitfaden.md` | onboarding | prompt | §2.3, §12 als Fragen |
| `onboarding/data-collection.md` | onboarding | manuell im Dashboard | §2.3, §12 als Felder |
| `manifest.json` | – | Steuerdatei für das Sync-Skript | – |

Bewusst weggelassen: §1 Zweck, §2.2 Website-Rahmen, §9 Einarbeitung durch erfahrene Person, §10 Handbuchpflege, §12 Freigabefeld.

## Hochladen

```bash
cd web
npm run sync-kb -- --demo            # Demo-Betriebsdaten (für die Vorführung)
npm run sync-kb                      # Platzhalter-Betriebsdaten („nicht festgelegt")
npm run sync-kb -- --create-missing  # legt fehlende Agenten als Klon des guidance-Agenten an
npm run sync-kb -- --agent guidance  # nur einen Agenten (lässt alte Dokumente stehen)
```

Das Skript lädt alle Dateien als Text-Dokumente mit Präfix `hk/` hoch, hängt sie mit dem richtigen Modus an die Agenten, setzt Systemprompt, Begrüßung und Sprache, aktiviert RAG (`multilingual_e5_large_instruct`), stößt die Indizierung an und löscht danach die alten `hk/`-Kopien. LLM, Stimme, TTS und Security bleiben, wie im Dashboard eingestellt.

## Testen ohne Mikrofon

```bash
npm run probe                        # beide Agenten
npm run probe -- guidance
```

Schickt die Testfragen aus `web/scripts/probe-agents.mts` (Farbsystem, falsches Tuch, Einstieg mitten im Ablauf, Betriebsdaten, Schaden, Abschweifen im Onboarding) über die Simulations-API an die Live-Agenten und druckt die Antworten. Nach jeder Prompt-Änderung: sync, dann probe.

## Manuell im Dashboard

- Data-Collection-Felder für den Onboarding-Agenten anlegen (`onboarding/data-collection.md`).
- Nach dem Vercel-Deploy die Domain bei beiden Agenten in die Allowlist eintragen.
