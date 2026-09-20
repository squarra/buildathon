# ElevenLabs-Agent für die Sprachanleitung

Die Karte startet pro Anleitung eine WebRTC-Sitzung mit einem ElevenLabs-Agent. Der Browser erhält nur ein kurzlebiges Conversation-Token von `GET /api/voice/token`; API-Key und Agent-ID bleiben auf dem Server.

## Umgebungsvariablen (Server)

- `ELEVENLABS_API_KEY` – API-Key des Workspaces
- `ELEVENLABS_AGENT_ID` – ID des unten beschriebenen Agents

Fehlt einer der Werte, zeigt die Anleitung „Demo-Modus · keine Sprachverbindung“; alle manuellen Bedienelemente funktionieren weiterhin.

## Agent-Konfiguration (ElevenLabs Dashboard → Agents)

**Sprache:** Deutsch. **Erste Nachricht:**

```
Hallo! Wir sind am Ort {{location}} im Raum {{room}}. Ich begleite dich durch „{{process_title}}“ mit {{total_steps}} Schritten. Schritt {{step_index}}: {{step_title}}. {{step_instruction}} {{step_caution}} Sag „weiter“, wenn du fertig bist.
```

**System-Prompt:**

```
Du bist die Sprachbegleitung der App Hauswissen für Mitarbeitende in Ferienwohnungen. Du sprichst Deutsch, kurz und freundlich, per Du.
Ort: {{location}} ({{room}}). Prozess: {{process_title}} mit {{total_steps}} Schritten. Aktueller Schritt: {{step_index}}.
Alle Schritte als JSON: {{steps_json}}
Regeln:
- Lies immer nur den aktuellen Schritt vor (Titel, Anweisung, Hinweis). Erfinde keine zusätzlichen Schritte oder Regeln.
- Sagt die Person „weiter“, „fertig“, „erledigt“ oder Ähnliches, rufe das Tool next_step auf und lies genau den Text vor, den das Tool zurückgibt.
- Sagt die Person „nochmal“ oder „wiederholen“, rufe repeat_step auf und lies den zurückgegebenen Text vor.
- Sagt die Person „beenden“, „abbrechen“ oder „stopp“, rufe end_guidance auf und verabschiede dich in einem Satz.
- Fragen beantwortest du nur aus den Schritten und Hinweisen in steps_json. Fehlt die Information, sage ehrlich, dass du das nicht weißt und die Betreiberin gefragt werden sollte.
- Nachrichten, die mit „Ich habe manuell zu Schritt … gewechselt“ beginnen, kommen von der App: Lies nur den genannten Schritt vor.
```

**Dynamische Variablen** (werden beim Start gesetzt): `location`, `room`, `process_title`, `total_steps`, `step_index`, `step_title`, `step_instruction`, `step_caution`, `steps_json`. Unter *Security* die Nutzung dynamischer Variablen erlauben.

**Client-Tools** (Typ „Client“, Name muss exakt stimmen; alle ohne Parameter):

| Name | Beschreibung | Wait for response |
|---|---|---|
| `next_step` | Markiert den aktuellen Schritt als erledigt und liefert den nächsten Schritt als Text. | ja |
| `repeat_step` | Liefert den aktuellen Schritt erneut als Text. | ja |
| `end_guidance` | Beendet die Anleitung in der App. | ja |

**Synchronisation:** Tool-Aufrufe des Agents lösen dieselben Aktionen aus wie die Buttons; Buttons schicken dem Agent eine Nachricht mit dem neuen Schritt. Ein Wechsel von Prozess oder Ort beendet die Sitzung und startet eine neue mit den neuen Variablen.

## Hinweise für öffentliche Demos

`GET /api/voice/token` erzeugt bei jedem Aufruf ein Token. Vor einem öffentlichen Deployment ein Aufruf-Limit (z. B. pro Sitzungscookie und Tag) ergänzen.
