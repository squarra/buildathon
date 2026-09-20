# knowledge/ — Wissensbasis und Prompts der ElevenLabs-Agenten

Quellen sind die Handbücher in `handbooks/`: `Housekeeping_Handbuch_MountainChalets_Fiss_angepasst.md` für die Agenten guidance und onboarding, `Prozesshandbuch_Rezeption_9_Einheiten.md` für den Agenten rezeption. §-Verweise unten beziehen sich auf die Nummerierung des jeweiligen Handbuchs. Die Dateien in diesem Ordner sind die für Sprachagenten aufbereitete Fassung: entbrandet, ohne Dokument-Meta (Freigabefelder, Versionsstatus, Website-Verweise), Checklisten zu Sätzen umgeschrieben, und alles, was das Handbuch als „zu bestätigen" markiert, steht als `noch nicht festgelegt` drin statt erfunden zu werden.

## Warum zwei Nutzungsarten

ElevenLabs' Knowledge Base ist RAG: Dokumente werden in Chunks zerlegt und nach Ähnlichkeit zum Gesprächsverlauf nachgeladen. Das funktioniert für Nachschlagefragen („welches Tuch für die Küche"), gibt dem Agenten aber kein Gefühl für *Reihenfolge* und keine Garantie, dass Sicherheitsregeln im Kontext sind. Deshalb:

- **`prompt`** – wird bei jedem Turn komplett in den Kontext injiziert. Für Regeln, Farbsystem, Schnellstart, Ablaufreihenfolge, Betriebsdaten, Interviewleitfaden. Klein halten.
- **`auto`** – wird per RAG nachgeladen. Für die 19 Prozessdokumente und Qualität/Meldung. Eine Datei pro Prozess, damit der Treffer sauber auf dem richtigen Prozess landet.

## Drei Agenten

| Agent | Nutzer | Aufgabe | Env-Variable |
|---|---|---|---|
| **guidance** | Reinigungskraft | führt Schritt für Schritt durch die Abreisereinigung, beantwortet Nachschlagefragen, setzt Farbsystem durch, sagt bei offenen Betriebsdaten „nicht festgelegt" | `ELEVENLABS_AGENT_ID_GUIDANCE` (Fallback `ELEVENLABS_AGENT_ID`) |
| **onboarding** | Inhaber/Leitung | interviewt den Betrieb entlang der Prozessvorlage, schlägt Standards vor, sammelt Abweichungen und offene Punkte | `ELEVENLABS_AGENT_ID_ONBOARDING` |
| **rezeption** | Rezeptionskraft | ordnet einen Vorgang einem der 23 Rezeptionsprozesse zu, führt Schritt für Schritt durch, setzt Grundprüfung und Sicherheitsregeln durch, erfindet keine CASABLANCA-Menüpfade oder Statuswerte | `ELEVENLABS_AGENT_ID_REZEPTION` |

Der Output des Onboarding-Agenten (Data-Collection-Felder, siehe `onboarding/data-collection.md`) füllt genau die Lücken in `guidance/betriebsdaten.md`.

## Sprachen

Standard ist Deutsch; zusätzlich Türkisch, Slowakisch und Ungarisch (`additionalLanguages` in `manifest.json`). Umsetzung: das ElevenLabs-System-Tool `language_detection` ist aktiv, d. h. der Agent erkennt die Sprache am ersten Satz der Person und wechselt ASR und TTS sofort. Die Wissensbasis bleibt deutsch – das LLM übersetzt beim Antworten, das mehrsprachige Embedding-Modell findet die deutschen Chunks auch zu türkischen/slowakischen/ungarischen Fragen. Die erste Begrüßung ist deutsch (sie kommt vor der Erkennung); pro Sprache gibt es ein Language-Preset mit übersetzter Begrüßung (`first-message.<lang>.md`) für den Fall, dass die Sprache später explizit aus der App vorgegeben wird. Neue Sprache: Code in `additionalLanguages` eintragen, optional `first-message.<lang>.md` anlegen, Prompt-Abschnitt „Sprache" ergänzen, `npm run sync-kb`.

## Dateien

| Datei | Agent | Modus | Handbuch |
|---|---|---|---|
| `shared/regeln-und-farbsystem.md` | beide | prompt | §4, §5 |
| `guidance/schnellstart.md` | guidance | prompt | §3 |
| `guidance/system-prompt.md` | guidance | Systemprompt | – |
| `guidance/first-message.md`, `.tr/.sk/.hu.md` | guidance | Begrüßung (+ Presets) | – |
| `guidance/ablauf-uebersicht.md` | guidance | prompt | §7 Titel, §12 |
| `guidance/betriebsdaten.md` | guidance | prompt | §2.3, §13 (Platzhalter) |
| `guidance/betriebsdaten.demo.md` | guidance | prompt (mit `--demo`) | dito, mit Demo-Werten |
| `guidance/qualitaet-und-meldung.md` | guidance | auto | §6, §8, §9, P19 |
| `guidance/prozesse/01…19-*.md` | guidance | auto | §7 Prozess 1–19 |
| `onboarding/system-prompt.md` | onboarding | Systemprompt | – |
| `onboarding/first-message.md`, `.tr/.sk/.hu.md` | onboarding | Begrüßung (+ Presets) | – |
| `onboarding/prozess-vorlage.md` | onboarding | prompt | §7 komprimiert + Varianten |
| `onboarding/interviewleitfaden.md` | onboarding | prompt | §2.3, §13 als Fragen |
| `onboarding/data-collection.md` | onboarding | manuell im Dashboard | §2.3, §13 als Felder |
| `rezeption/system-prompt.md` | rezeption | Systemprompt | – |
| `rezeption/first-message.md`, `.tr/.sk/.hu.md` | rezeption | Begrüßung (+ Presets) | – |
| `rezeption/grundregeln-und-status.md` | rezeption | prompt | Rez. §2, §3, P16 Prioritäten, P23 Auslöser |
| `rezeption/ablauf-uebersicht.md` | rezeption | prompt | Rez. §4–11 Titel |
| `rezeption/betriebsdaten.md` | rezeption | prompt | Rez. §1, §12.1 (Platzhalter) |
| `rezeption/betriebsdaten.demo.md` | rezeption | prompt (mit `--demo`) | dito, mit Demo-Werten |
| `rezeption/prozesse/01…23-*.md` | rezeption | auto | Rez. Prozess 1–23 |
| `manifest.json` | – | Steuerdatei für das Sync-Skript | – |

Bewusst weggelassen (Housekeeping): §1 Zweck, §2.2 Website-Rahmen, §10 Einarbeitung durch erfahrene Person, §11 Handbuchpflege, §13 Freigabefeld. (Rezeption): §12.2 Freigabekriterien, §12.3 Änderungsprozess, §13 Freigabefeld.

Der Rezeptionsagent bekommt `shared/regeln-und-farbsystem.md` nicht – das Farbsystem gilt nur für Housekeeping. Anders als bei der Reinigung gibt es an der Rezeption keine feste Gesamtreihenfolge; der Agent ordnet den Vorgang zuerst einem Prozess zu und führt dann innerhalb des Prozesses Schritt für Schritt.

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
npm run probe                        # alle Agenten
npm run probe -- guidance
```

Schickt die Testfragen aus `web/scripts/probe-agents.mts` (Farbsystem, falsches Tuch, Einstieg mitten im Ablauf, Betriebsdaten, Schaden, Abschweifen im Onboarding, je ein Fall auf Türkisch, Slowakisch und Ungarisch) über die Simulations-API an die Live-Agenten und druckt die Antworten. Nach jeder Prompt-Änderung: sync, dann probe.

## Manuell im Dashboard

- Data-Collection-Felder für den Onboarding-Agenten anlegen (`onboarding/data-collection.md`).
- Nach dem Vercel-Deploy die Domain bei allen Agenten in die Allowlist eintragen.
