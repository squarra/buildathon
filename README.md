# SeasonUp

**Wissen bleibt im Haus.** Funktionsfähiger lokaler Hackathon-Prototyp für die saisonübergreifende Wissenspflege in kleinen Ferienwohnungsbetrieben. Synthetischer Betrieb: Haus Bergzeit, Tirol, drei Wohnungen (Alpenblick, Zirbennest, Talruhe).

Der KI-Begleiter der Fachkräfte heißt **Wissnsepp**. Er antwortet nur aus bestätigtem Hauswissen, nennt seine Quellen und sagt offen, wenn etwas fehlt.

## Lokal starten

Voraussetzung: Node.js 22.

```sh
npm install
npm run dev
```

Die Anwendung läuft unter http://localhost:3000. In diesem Arbeitsbereich ist sie bereits eingerichtet.

Standardmäßig bekommt jeder Browser über das Sitzungscookie seinen eigenen isolierten Demo-Betrieb. Ist `SHARED_WORKSPACE_ID` gesetzt, sehen **alle Besucher denselben Betrieb**: gemeinsames Wissen, gemeinsame Beiträge, ein gemeinsames Tagesbudget für KI-Aufrufe. Das ist für eine Team- oder Jury-Demo gedacht und bewusst ungeschützt – jede Person kann jede Rolle wählen, Wissen ändern und einen hinterlegten Mistral-Schlüssel mitbenutzen. Die Rollenwahl bleibt pro Browser. Der Wert darf ein beliebiger Text sein: die Datenbankspalte ist eine `uuid`, deshalb wird aus allem, was keine UUID ist, fest eine abgeleitet.

Ohne externe Dienste werden Daten serverseitig unter `.data/` gespeichert. Die Dateien werden atomar geschrieben; Änderungen bleiben nach Neuladen und Neustart erhalten. Das Sitzungscookie verbindet den Browser mit seinem isolierten Demo-Arbeitsbereich. Ein anderer Browser bekommt einen eigenen Betrieb. Dies ist absichtlich kein gemeinsamer produktiver Mandant.

## Mistral verbinden

1. Oben rechts „Lena · Betreiberin“ auswählen.
2. „Einstellungen“ öffnen.
3. Mistral-Key im Passwortfeld eintragen und „Verbindung prüfen & speichern“ wählen.

Der Schlüssel wird verschlüsselt serverseitig gespeichert und nie an den Browser zurückgegeben. Lokal wird dafür eine Schlüsseldatei mit eingeschränkten Dateirechten erzeugt. Ohne Mistral-Verbindung funktioniert eine ausdrücklich gekennzeichnete Textsuche. Die Demo-Abläufe sind auch ohne KI ausführbar. Neue Durchläufe enthalten englische Übersetzungen der unveränderten Beispieldaten; Übersetzungen eigener oder geänderter Inhalte benötigen Mistral.

Alternativ kann `MISTRAL_API_KEY` in `.env.local` hinterlegt werden. Modellnamen lassen sich über die Variablen aus `.env.example` konfigurieren. Getestet werden kann ein Schlüssel über die Modelle-API; die tatsächliche Nutzbarkeit der Chat-, Audio- und OCR-Modelle hängt vom Konto ab.

## Eine Demo in drei Minuten

1. **Betreiberin / Übersicht:** „Fenstergriff wurde repariert“ öffnen. Den gemeldeten Sachverhalt im Beispiel als geprüft annehmen, den endgültigen Text formulieren und veröffentlichen.
2. **Mira / Wissnsepp:** Nach dem Fenstergriff im Alpenblick fragen. Die Antwort bzw. Textsuche zeigt die bestätigte Version mit Quelle. Zahlungsinformationen sind für diese Rolle ausgeblendet.
3. **Zimmer-Check:** Als Mira „Gästewechsel & Reinigung" starten. Im Schritt „Bad und Oberflächen" ein Foto des Raums aufnehmen. Die KI vergleicht es mit dem hinterlegten Idealbild und den Prüfpunkten und nennt, was noch fehlt – etwa eine fehlende Ersatzrolle. Danach nachbessern und ein neues Foto machen. Ein unpassender Prüfpunkt lässt sich direkt als Beitrag melden.
4. **Prozess starten:** „Gästewechsel & Reinigung“ starten, einen Schritt erledigen und über „Problem melden“ Feedback einreichen. Nach Neuladen lässt sich der Durchlauf fortsetzen.
5. **Lena / Wissenspflege:** Monatlichen Eintrag prüfen. Im Saisonabschluss Notizen und offene Meldungen in einen bearbeitbaren Übergabeentwurf übernehmen. Neue Saison festlegen und Einträge dafür bestätigen.
6. **Mira / Anerkennung:** Bestätigte hilfreiche Beiträge bringen Punkte. Einen Demo-Kaffeegutschein anfragen; Lena kann die Anfrage bestätigen.

Der Ablauf **„Abreisereinigung Schritt für Schritt"** ist der ausführliche Hausablauf in 19 Schritten, vom Material über die Räume bis zur Freigabe. Er stammt aus einem echten Housekeeping-Handbuch, das im Team aufbereitet wurde (`origin/voice-feature`, Ordner `knowledge/`), und wurde für diesen Betrieb entbrandet: Farbsystem, Reihenfolgeregeln und Freigabekriterien sind als bestätigte Wissenseinträge hinterlegt, alles im Handbuch Unbestätigte steht ausdrücklich als „noch nicht festgelegt" statt erfunden zu sein.

Beispielprozesse lassen sich über „Prozesse“ bearbeiten und erweitern. Neue Wissenseinträge beginnen als Beiträge. PDFs, TXT, Markdown, Fotos und Audio lassen sich einem Beitrag hinzufügen. Anhänge bleiben nach Freigabe mit dem Wissen verknüpft.

## Zimmer-Check: visuelle Qualitätskontrolle

Die Betreiberin legt unter „Zimmer-Check" pro Raum einen **Sicht-Standard** an: ein Idealbild des perfekt vorbereiteten Raums plus prüfbare Punkte („Ersatzrolle Toilettenpapier sichtbar bereitgestellt"). Mit Mistral-Verbindung schlägt die KI diese Punkte aus dem Idealbild vor; sie bleiben bearbeitbar.

Die Fachkraft fotografiert den fertigen Raum – im Buddy direkt im passenden Prozessschritt oder über die Liste „Zimmer-Check". Serverseitig vergleicht ein Bildmodell das Foto mit Idealbild und Checkliste und gibt eine Hinweisliste zurück. Fotos werden vor dem Upload im Browser auf 1280 px verkleinert.

Das Feature hängt an den bestehenden Abläufen:

- **Prozesse:** Ein Sicht-Standard lässt sich an einen Prozessschritt hängen und erscheint dort automatisch.
- **Beiträge:** Jeder Befund kann als Änderungsvorschlag gemeldet werden; das geprüfte Foto bleibt am Beitrag sichtbar.
- **Wissenspflege:** Idealbilder laufen im monatlichen Check-in und zum Saisonstart mit („Sieht der Raum heute noch so aus?"). Änderungen legen eine neue Version mit Historie an.
- **Saisonübergabe:** Wiederkehrende offene Befunde fließen in den Übergabeentwurf ein.
- **Anerkennung:** Ein bestandener Check und eine bestätigte Standard-Prüfung geben je 2 Punkte.

Die KI beurteilt ausschließlich sichtbare Details und markiert nicht Erkennbares ausdrücklich als „auf dem Foto nicht zu sehen". Die Freigabe trifft immer ein Mensch. Ohne Mistral-Verbindung zeigt der Check die Prüfpunkte klar gekennzeichnet zum manuellen Abhaken statt erfundener Befunde.

Das Bildmodell ist über `MISTRAL_VISION_MODEL` konfigurierbar (Standard: `pixtral-12b-2409`).

## Sprechen statt tippen: der Wissnsepp als Stimme

Über dem Buddy sitzt eine Sprechtaste. Die Fachkraft spricht ihre Frage, der Wissnsepp antwortet hörbar – geerdet auf **dasselbe freigegebene Hauswissen**, das auch die Textansicht nutzt. Er hat bewusst keine eigene Wissensbasis bei ElevenLabs: jede inhaltliche Frage geht über ein Client-Tool zurück in diese App, durch dieselbe Rollen- und Wohnungsprüfung wie ein Klick.

Sechs Werkzeuge stehen dem Gespräch zur Verfügung: `wissen_suchen`, `prozess_starten`, `naechster_schritt`, `schritt_wiederholen`, `problem_melden`, `zimmer_check`. Sie laufen im Browser, nicht auf dem ElevenLabs-Server – deshalb gelten Sitzungscookie, Rolle und Wohnung unverändert, und Gesagtes erscheint sofort im Verlauf des Buddys.

Einrichtung:

1. Im ElevenLabs-Dashboard einen Agent anlegen. `knowledge/wissnsepp-agent.md` enthält Systemprompt, erste Nachricht und die sechs Tool-Definitionen zum Übernehmen. **Keine** Dokumente in die Wissensbasis des Agents laden – das Wissen kommt aus dieser App.
2. In `.env.local` hinterlegen: `ELEVENLABS_API_KEY` (Berechtigung *Conversational AI*), `ELEVENLABS_AGENT_ID_GUIDANCE`, optional `VOICE_DAILY_LIMIT` (Standard 20 Gespräche pro Demo-Arbeitsbereich und Tag).

### Der zweite Agent: einen Betrieb im Gespräch einrichten

Das Grundproblem beim Start ist leer: eine Betreiberin hat ihre Abläufe im Kopf, nicht in einem System. Unter **Betrieb einrichten** führt ein zweiter Agent deshalb ein Interview – Farbsystem, Waschprogramme, Mengenregeln, Müll, Zuständigkeiten – und nennt zu jedem Thema den üblichen Standard, damit sie nur bestätigen oder korrigieren muss.

Zwei Werkzeuge genügen ihm: `wissen_festhalten` legt ein bestätigtes Thema als Beitrag an, `punkt_offen` vermerkt, was noch nicht feststeht. Beides schreibt **nicht** direkt ins Hauswissen, sondern ins Postfach: derselbe Freigabeweg wie für eine Meldung aus der Wohnung. Was die Betreiberin dort bestätigt, liest der Wissnsepp anschließend den Mitarbeitenden vor – die Einrichtung füllt also genau die Quelle, aus der der erste Agent antwortet.

Der Server prüft die Rolle, bevor er ein Token prägt: `flow=onboarding` bekommt nur die Betreiberin. Konfiguriert wird der Agent über `ELEVENLABS_AGENT_ID_ONBOARDING`; ohne die Variable bleibt die Ansicht ehrlich stumm. Themenliste und Gesprächsführung stammen aus dem Onboarding-Agent im Branch `voice-feature`, dort aber ohne Anbindung an eine Datenbasis – die Antworten mussten nach dem Gespräch von Hand aus der ElevenLabs-Analyse übertragen werden.

Der Schlüssel verlässt den Server nie: `/api/voice-token` prägt serverseitig ein kurzlebiges WebRTC-Token. Fehlt die Konfiguration, sagt die Sprechtaste das offen, statt ein Gespräch vorzutäuschen.

## Spätere Veröffentlichung auf Vercel + Supabase

Noch nicht veröffentlicht – auf Wunsch zunächst lokal fertiggestellt.

1. In Supabase ein Projekt anlegen und `supabase/setup.sql` im SQL-Editor ausführen. Es erstellt eine private Tabelle und einen privaten Datei-Bucket.
2. Das Projekt in ein eigenes Git-Repository übernehmen und in Vercel als Next.js-Projekt importieren. Falls das übergeordnete Repository verwendet wird, als Root Directory `outputs/saisonwissen` wählen.
3. Folgende Server-Umgebungsvariablen in Vercel setzen:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENCRYPTION_SECRET` (z. B. eine zufällige 32-Byte-Zeichenfolge; sicher aufbewahren)
4. Optional Mistral-Modellvariablen setzen. Gäste der öffentlichen Demo sollen ihren eigenen Key verwenden. Ein gemeinsamer Key bleibt auf Vercel standardmäßig deaktiviert; `ALLOW_SHARED_DEMO_KEY=true` wäre ein bewusstes Opt-in und braucht zusätzliche globale Kostenkontrolle.
5. Deployment starten und die Kernabläufe auf dem öffentlichen Link prüfen.

**Keine dieser Variablen bekommt ein `NEXT_PUBLIC_`-Präfix.** Es gibt keinen Browserzugriff auf den Supabase-Service-Schlüssel. Die Demo-Tabelle hat keine Policies für öffentliche Clients; nur das Backend kann darauf zugreifen. Datenupdates verwenden eine Versionsprüfung gegen verlorene parallele Änderungen.

Lokale Demo-Daten werden nicht automatisch nach Supabase übertragen. Es wird dort ein neuer synthetischer Arbeitsbereich erzeugt. Die Anwendung verweigert auf Vercel den unbeständigen lokalen Dateispeicher, wenn Supabase fehlt.

## Was bereits funktioniert

- Zwei verbundene Oberflächen mit responsive gestaltetem Buddy.
- Drei Demorollen, serverseitig gefilterte Inhalte und Aktionen.
- Wissensbeiträge, Prüfung, Freigabe und Versionshistorie.
- Individuelle Prozessschritte, versionierte Durchläufe und gespeicherter Fortschritt.
- Freie Fragen, Quellenkarten und Meldung von Wissenslücken.
- Dokument- und Foto-Upload, private Downloads, PDF-/Text-Extraktion.
- Mikrofonaufnahme mit maximal 60 Sekunden; Mistral-Transkription bei Verbindung.
- Monatliche Prüfungen, Saisonabschluss und Saisonstart.
- Punkte mit idempotenter Buchung und Beispielbelohnungen.
- Verschlüsselte, austauschbare Mistral-Verbindung.
- Zwei optionale WebMCP-Werkzeuge zum Lesen freigegebener Einträge und Öffnen eines Beitragsentwurfs.

## Bewusste Grenzen

- **Hackathon-Demo, kein Produktivsystem:** Der Rollenwechsel ist auf den isolierten synthetischen Demo-Betrieb begrenzt. Echte Benutzerkonten, Einladungen, Mandantenverwaltung und individuelle Wohnungszuweisungen sind noch nicht implementiert. Dafür vor echter Nutzung Supabase Auth und ein normalisiertes Berechtigungsmodell ergänzen.
- Lokal persistente Dateien; für Hosting Supabase vorbereitet. Die Supabase-/Vercel-Veröffentlichung wurde mangels Einrichtung noch nicht ausgeführt oder getestet.
- Echte Mistral-Antworten, OCR und Transkription sind implementiert, aber ohne vom Nutzer hinterlegten Key nicht live verifiziert.
- Dokumente: maximal 8 MB, PDFs bis zu 15 Seiten und extrahierter Text bis 16.000 Zeichen. Keine DOCX-/Videoverarbeitung, keine Hintergrund-Job-Warteschlange. Bei Scan-PDFs wird Mistral OCR benötigt.
- Prozessnavigation und Verwaltung sind überwiegend Deutsch; englische Beispielanleitungen und KI-Antworten werden unterstützt. Vollständige Übersetzung aller Verwaltungslabels ist nicht enthalten.
- Die Quellenanzeigen öffnet das aktuelle Hauswissen; der laufende Prozess behält seinen beim Start gespeicherten Inhalt und seine Prozessversion. Prozesshistorie wird serverseitig bewahrt; eine eigene Historienansicht für Prozesse ist noch nicht enthalten.
- Prüfbedarf wird beim Öffnen anhand von Daten berechnet; keine E-Mail-/Push-Erinnerungen. Belohnungen sind Demo-Anfragen, keine Auszahlungen.
- Keine echten Buchungs-, Zahlungs-, Gästekarten- oder Notrufintegrationen.
- Die Sprachgespräche sind ohne gültigen ElevenLabs-Schlüssel mit *Conversational AI*-Berechtigung nicht live verifiziert – weder die Anleitung noch die Einrichtung. Geprüft sind bisher nur Tokenroute inklusive Rollenprüfung für `flow=onboarding`, Tageslimit und das ehrliche Verhalten ohne Konfiguration.
- 60 KI-Anfragen pro Demo-Arbeitsbereich/Tag. Vor öffentlicher gemeinsamer Key-Nutzung zusätzlich globale Limits und Bot-Schutz vorsehen.

## Prüfungen

```sh
npm test
node tests/api-smoke.mjs
node tests/upload-smoke.mjs
npm run build
```

Die beiden Schnittstellentests benötigen den laufenden lokalen Server und erstellen eigene synthetische Arbeitsbereiche. Produktionsbuild und Entwicklung sollten unterschiedliche Ausgabeverzeichnisse verwenden: `BUILD_CHECK=1 npm run build` baut nach `.next-check`, ohne die laufende Vorschau zu verändern.

Geprüft wurden Rollenfilter, Freigabe und Versionierung, idempotente Punkte/Prüfungen, Durchlauf-Snapshots, echte lokale HTTP-Abläufe, TXT-/PDF-Verarbeitung sowie Browserbedienung auf Desktop- und Smartphone-Breite. Live-Mistral und öffentliches Hosting sind gesondert zu prüfen.
