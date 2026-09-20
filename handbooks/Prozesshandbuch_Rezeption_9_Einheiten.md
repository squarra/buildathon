# Prozesshandbuch Rezeption
## Ferienwohnungsbetrieb mit 9 Einheiten und CASABLANCA

**Anwendungsbereich:** Ferienwohnungen und Ferienhäuser mit 9 vermietbaren Einheiten  
**Hotelsoftware / PMS:** CASABLANCA hotelsoftware  
**Version:** 1.0 – Prozessentwurf  
**Stand:** 20.09.2026  
**Status:** Zur betrieblichen Prüfung und Freigabe

---

## 1. Zweck und Geltungsbereich

Dieses Handbuch beschreibt ausschließlich die operativen Rezeptionsabläufe:

- Anfrage und Verfügbarkeitsprüfung;
- Buchung und Buchungsänderung;
- Stornierung und Erstattung;
- Zahlungen und offene Beträge;
- Vorbereitung der Anreise;
- Online-Check-in, Meldedaten und Gästekarte;
- Zugang und Check-in;
- Gästebetreuung während des Aufenthalts;
- Zusammenarbeit mit Housekeeping und Haustechnik;
- Reklamationen und Störungen;
- Check-out, Rechnung und Abreise;
- Schichtübergabe und Tagesabschluss.

Die Abläufe gelten für alle 9 Einheiten. Nicht vorhandene Funktionen oder nicht aktivierte CASABLANCA-Module werden übersprungen. Konkrete Menübezeichnungen, Statuswerte, Zahlungsarten, Zugangslösungen und Meldeprozesse müssen vor der Freigabe im Betrieb geprüft werden.

**Grundsatz:**

> Die Rezeption bearbeitet jeden Vorgang vollständig, dokumentiert die nächste Aktion und übergibt offene Punkte an eine verantwortliche Person.

---

## 2. Grundregeln für jeden Rezeptionsvorgang

Vor jeder Änderung in CASABLANCA prüfen:

1. richtige Reservierung;
2. richtiger Gast;
3. richtiger Zeitraum;
4. richtige Einheit aus Einheit 01 bis 09;
5. Buchungskanal und externe Referenz;
6. Personenzahl und gebuchte Leistungen;
7. Zahlungs- und Rechnungsstatus;
8. Housekeeping- und Unterkunftsstatus;
9. offene Aufgaben und Hinweise;
10. nächste Aktion und zuständige Person.

Nach jeder Änderung:

1. Änderung speichern;
2. gespeicherten Datensatz erneut kontrollieren;
3. Auswirkungen auf Gast, Housekeeping, Haustechnik, Zahlung und Zugang prüfen;
4. betroffene Stelle informieren;
5. offenen Punkt bis zum Abschluss verfolgen.

### 2.1 Nicht zulässig

- Verfügbarkeit oder Preise aus dem Gedächtnis zusagen;
- unbestätigte Leistungen versprechen;
- vollständige Passwörter, Kartendaten oder Zugangscodes in freien Notizen speichern;
- eine Einheit ohne geprüften Status als bezugsbereit bestätigen;
- kritische Änderungen ohne Berechtigung durchführen;
- bei Unsicherheit raten oder einen Vorgang ungeprüft abschließen.

---

## 3. Einheitliche Statuslogik

Die folgenden Statuswerte sind Prozessvorschläge. Die konkrete Umsetzung in CASABLANCA ist zu prüfen.

### Reservierung

- Anfrage
- Option
- bestätigt
- Anzahlung offen
- vollständig bezahlt
- storniert
- nicht angereist
- abgeschlossen
- Erstattung offen

### Einheit und Housekeeping

- Abreise erwartet
- Reinigung offen
- Reinigung läuft
- Qualitätskontrolle offen
- bezugsbereit
- belegt
- Mangel offen
- technisch gesperrt
- außer Betrieb

### Anreise

- Anreise offen
- Daten unvollständig
- Online-Check-in offen
- Meldedaten zu prüfen
- Zugang vorbereitet
- eingecheckt
- Selbstanreise vorbereitet
- verspätete Anreise

### Aufgaben

- offen
- zugewiesen
- in Bearbeitung
- wartet auf Rückmeldung
- erledigt
- geprüft
- eskaliert

---

# 4. Tagesprozesse der Rezeption

## Prozess 1: Schichtbeginn und Tagesübersicht

### Ziel

Alle Vorgänge des Tages sind bekannt, zugewiesen und nach Dringlichkeit geordnet.

### Schritte

1. CASABLANCA und den vereinbarten Aufgabenweg öffnen.
2. Anreisen und Abreisen des Tages prüfen.
3. Einheiten 01 bis 09 einzeln prüfen.
4. Reservierungs- und Belegungsstatus kontrollieren.
5. Housekeeping- und Qualitätsstatus kontrollieren.
6. technische Sperren und offene Mängel prüfen.
7. offene Zahlungen, Anzahlungen und Rechnungen prüfen.
8. Online-Check-ins, Meldedaten und Gästekarten prüfen.
9. Selbstanreisen und Spätanreisen markieren.
10. Sonderwünsche und Zusatzleistungen prüfen.
11. offene Reklamationen und Rückrufzusagen prüfen.
12. jede offene Aufgabe einer verantwortlichen Person zuweisen.

### Qualitätskriterium

Für jede Einheit ist der aktuelle Status bekannt. Keine offene Aufgabe bleibt ohne Zuständigkeit und nächste Aktion.

---

## Prozess 2: Schichtübergabe übernehmen

### Schritte

1. Übergabeliste vollständig lesen.
2. offene Anreisen und Abreisen prüfen.
3. offene Zahlungen und Fristen prüfen.
4. Housekeeping- und Technikmeldungen prüfen.
5. vereinbarte Rückmeldungen an Gäste prüfen.
6. kritische Aufgaben zuerst übernehmen.
7. bei Unklarheiten die übergebende Person fragen.
8. offene Punkte in CASABLANCA oder im vereinbarten Aufgabenweg bestätigen.

### Qualitätskriterium

Die übernehmende Person kennt Aufgabe, Status, nächste Aktion, Frist und Zuständigkeit.

---

# 5. Buchungsprozesse

## Prozess 3: Anfrage bearbeiten

### Ziel

Eine Anfrage wird vollständig geprüft und ohne unbeabsichtigte Zusage beantwortet.

### Schritte

1. Anfrage und Kommunikationskanal öffnen.
2. Name und erforderliche Kontaktmöglichkeit erfassen.
3. gewünschte An- und Abreise prüfen.
4. Personenzahl und benötigte Einheit prüfen.
5. Verfügbarkeit in CASABLANCA kontrollieren.
6. Preise, Mindestaufenthalt und Bedingungen prüfen.
7. Zusatzleistungen und besondere Wünsche prüfen.
8. offene Punkte markieren.
9. Angebot, Rückfrage oder Absage nach freigegebener Vorlage senden.
10. Wiedervorlage und nächste Aktion dokumentieren.

### Qualitätskriterium

Die Anfrage hat einen eindeutigen Status: Angebot gesendet, Rückfrage offen, Absage gesendet oder Entscheidung ausstehend.

---

## Prozess 4: Buchung in CASABLANCA anlegen

### Schritte

1. bestätigte Buchungsquelle öffnen.
2. vorhandenes Gastprofil suchen.
3. nur bei fehlendem Profil einen neuen Datensatz anlegen.
4. An- und Abreisedatum eintragen.
5. passende freie Einheit aus 01 bis 09 zuordnen.
6. Personenzahl, Rate, Preis, Steuern, Gebühren und Leistungen prüfen.
7. Zahlungsart, Zahlungsfrist und Anzahlungsstatus eintragen.
8. Buchungskanal und externe Referenz dokumentieren.
9. besondere Wünsche und erforderliche Vorbereitungen erfassen.
10. Hinweise für Housekeeping oder Haustechnik zuordnen.
11. Reservierung speichern.
12. gespeicherten Datensatz erneut kontrollieren.
13. Belegungsplan auf Konflikte prüfen.
14. Buchungsbestätigung nach freigegebener Vorlage senden.
15. Aufgaben für Zahlung, Anreise, Meldedaten und Housekeeping anlegen oder kontrollieren.

### Qualitätskriterium

Reservierung, Belegungsplan und Buchungsbestätigung stimmen überein. Die Reservierung ist genau einer der 9 Einheiten zugeordnet.

### Bei möglicher Doppelbuchung

- keine weitere Zusage senden;
- betroffene Reservierungen und Buchungskanal prüfen;
- Betriebsleitung informieren;
- Konflikt dokumentieren;
- erst nach Entscheidung weiterarbeiten.

---

## Prozess 5: Buchung ändern

### Mögliche Änderungen

- Reisedaten;
- Personenzahl;
- Einheit;
- Zusatzleistungen;
- Ankunftszeit;
- Zahlungsart;
- Gästekarte oder Meldedaten;
- Kinder- oder Sonderausstattung.

### Schritte

1. Änderungswunsch nachvollziehbar erfassen.
2. Buchung, Gast und Berechtigung prüfen.
3. Verfügbarkeit und Preis neu prüfen.
4. Änderungs-, Zahlungs- und Stornoregel prüfen.
5. Auswirkungen auf Housekeeping, Haustechnik, Zugang und Gästekarte prüfen.
6. Änderung in CASABLANCA durchführen oder zur Freigabe geben.
7. neue Zusammenfassung speichern.
8. gespeicherte Änderung kontrollieren.
9. Gast über Änderung und mögliche Kosten informieren.
10. betroffene Stellen informieren.
11. alte und neue Information nachvollziehbar dokumentieren.

### Qualitätskriterium

CASABLANCA, Gästeinformation, Zahlungsstatus, Einheit und interne Aufgaben stimmen überein.

---

## Prozess 6: Stornierung und Erstattung

### Schritte

1. Stornierungswunsch und Zeitpunkt dokumentieren.
2. Buchung, Gast und Einheit prüfen.
3. gültige Stornobedingung prüfen.
4. bereits eingegangene Zahlungen und offene Leistungen prüfen.
5. Kosten- oder Erstattungsfolge bestimmen.
6. erforderliche Freigabe einholen.
7. Reservierungsstatus in CASABLANCA ändern.
8. prüfen, ob die Einheit wieder verfügbar werden darf.
9. Erstattung nach dem gültigen Zahlungsprozess auslösen oder anweisen.
10. Gast schriftlich bestätigen.
11. Housekeeping und betroffene Stellen informieren.
12. externen Buchungskanal prüfen, sofern die Buchung dort eingegangen ist.

### Wichtig

Eine stornierte Einheit bleibt gesperrt, wenn ein Schaden, eine technische Prüfung oder eine andere betriebliche Ursache vorliegt.

---

# 6. Zahlungs- und Rechnungsprozesse

## Prozess 7: Anzahlung und Zahlung prüfen

### Schritte

1. Zahlungsregel der Reservierung prüfen.
2. Fälligkeit, Betrag, Zahlungsart und Währung prüfen.
3. Zahlung im freigegebenen Zahlungs- oder PMS-System kontrollieren.
4. Zahlung der richtigen Reservierung zuordnen.
5. Zahlungsstatus in CASABLANCA aktualisieren oder automatische Übernahme kontrollieren.
6. Beleg nach dem gültigen Prozess erstellen oder ablegen.
7. offene Beträge in der Tagesübersicht markieren.
8. Gast bei ausstehender Zahlung nach freigegebener Vorlage kontaktieren.
9. erfolglose Zahlungen, Rücklastschriften und Erstattungen eskalieren.
10. Status im Tagesabschluss erneut kontrollieren.

### Qualitätskriterium

Für jede Reservierung ist erkennbar:

- was bezahlt wurde;
- was offen ist;
- bis wann gezahlt werden muss;
- wer die nächste Aktion übernimmt.

### Sicherheitsregel

Keine vollständigen Kartendaten, Passwörter oder vollständigen Zugangscodes in CASABLANDA-Notizen speichern.

---

## Prozess 8: Rechnung und Beleg erstellen

### Schritte

1. Reservierung und Rechnungsempfänger prüfen.
2. Leistungen, Gebühren und Zahlungen abgleichen.
3. Rechnungsadresse nach Bedarf prüfen.
4. Rechnung nach freigegebener Vorlage erstellen.
5. Pflichtangaben nach betrieblicher Vorgabe prüfen.
6. Rechnung über den freigegebenen Weg übergeben oder versenden.
7. Korrekturen nur mit Berechtigung durchführen.
8. Storno- oder Korrekturbeleg nachvollziehbar ablegen.

### Qualitätskriterium

Rechnung, Reservierung, Zahlung und Leistungszeitraum stimmen überein.

---

# 7. Prozesse vor der Anreise

## Prozess 9: Reservierung vor der Anreise prüfen

### Zeitpunkt

Der Betrieb legt den genauen Zeitpunkt fest. Empfohlen wird eine Prüfung vor der Anreise und eine zweite Kontrolle am Anreisetag.

### Schritte

1. Tagesübersicht in CASABLANCA öffnen.
2. Gast, Reservierung, Zeitraum und Einheit prüfen.
3. Personenzahl und Leistungen prüfen.
4. Zahlungsstatus und offene Beträge prüfen.
5. Online-Check-in-Status prüfen.
6. Meldedaten und Gästekartenstatus prüfen.
7. Housekeeping-Status prüfen.
8. Qualitätskontrolle und Bezugsbereitschaft prüfen.
9. Zugangslösung vorbereiten.
10. Sonderausstattung gegen die Reservierung prüfen.
11. Ankunftsart und Ankunftszeit prüfen.
12. Begrüßungs- oder Selbstanreiseinformationen vorbereiten.
13. offene Punkte zuweisen und bis zur Anreise verfolgen.
14. vor der Zugangsausgabe den Status erneut prüfen.

### Qualitätskriterium

Vor der Anreise ist klar:

- ob die Reservierung vollständig ist;
- ob die Einheit bezugsbereit ist;
- wie der Gast Zugang erhält;
- ob Meldedaten und Gästekarte vorbereitet sind;
- wer offene Punkte erledigt.

---

## Prozess 10: Online-Check-in oder Pre-Check-in bearbeiten

### Schritte

1. richtige Reservierung in CASABLANCA auswählen.
2. freigegebenes Online-Check-in-Modul oder Formular verwenden.
3. Frist und erforderliche Daten prüfen.
4. Datenschutz- und Informationshinweise beachten.
5. Nachricht in passender Sprache senden.
6. Versand dokumentieren, sofern kein automatischer Status entsteht.
7. Eingang in CASABLANCA kontrollieren.
8. Vollständigkeit und Lesbarkeit prüfen.
9. fehlende oder widersprüchliche Angaben nachfordern.
10. Meldedaten und Anreisevorbereitung aktualisieren.

### Qualitätskriterium

Der Online-Check-in gilt erst als abgeschlossen, wenn die erforderlichen Daten geprüft und für den nächsten Prozess verfügbar sind.

### Wenn der Online-Check-in nicht funktioniert

- Gast nicht abweisen;
- alternative Erfassung anbieten;
- persönlichen Check-in vorbereiten;
- technische Ursache dokumentieren;
- wiederkehrenden Fehler an die zuständige Person melden.

---

## Prozess 11: Meldedaten und Gästekarte bearbeiten

### Vorab prüfen

- Ist eine Meldung oder Gästekarte erforderlich?
- Welche Daten müssen erfasst werden?
- Muss sie digital, gedruckt oder in beiden Formen bereitgestellt werden?
- Welche regionale Stelle oder Schnittstelle ist beteiligt?
- Wer darf Daten korrigieren oder die Meldung freigeben?

### Schritte

1. richtige Reservierung und zugehörige Gäste auswählen.
2. erforderliche Daten prüfen.
3. Daten über den freigegebenen Prozess erfassen.
4. Meldung oder Gästekarte erstellen.
5. Name, Zeitraum, Einheit und Gültigkeit prüfen.
6. digitale oder gedruckte Version bereitstellen.
7. Gast über Verwendung und wichtige Hinweise informieren.
8. Versand, Ausgabe oder Korrektur dokumentieren.
9. bei Schnittstellen den Übertragungsstatus prüfen.

### Qualitätskriterium

Meldung oder Gästekarte gehören zum richtigen Gast, zur richtigen Einheit und zum richtigen Zeitraum.

**Hinweis:** Regionale Meldepflichten und Gästekartenregeln müssen durch den Betrieb, die zuständige Behörde oder qualifizierte Fachpersonen geprüft werden.

---

## Prozess 12: Zugang, Schlüssel oder Zimmerkarte vorbereiten

### Schritte

1. Reservierung und Einheit prüfen.
2. Name und Aufenthaltszeitraum abgleichen.
3. richtige Tür oder Berechtigungsgruppe auswählen.
4. Zugang nach der freigegebenen Anweisung vorbereiten.
5. Gültigkeitszeitraum prüfen.
6. Funktion nach dem zulässigen Testprozess prüfen.
7. Zugangsmittel sicher bis zur Übergabe verwahren.
8. Ausgabe oder Versand dokumentieren.

### Sicherheitsregeln

- vollständige Zugangscodes nicht in offenen Notizen speichern;
- Zugangsinformationen nicht an unberechtigte Personen weitergeben;
- verlorene Schlüssel oder Karten sofort melden;
- bei unsicherer Identität keine Zugangsausgabe vornehmen;
- bei technischen Problemen die sichere Ersatzlösung verwenden.

---

# 8. Anreise- und Aufenthaltsprozesse

## Prozess 13: Persönlicher Check-in

### Vorbereitung

- Reservierung und Einheit in CASABLANCA prüfen;
- Housekeeping- und Bezugsstatus prüfen;
- Zahlung und offene Beträge prüfen;
- Online-Check-in, Meldedaten und Gästekarte prüfen;
- Zugangsmittel und wichtige Unterlagen vorbereiten.

### Ablauf

1. Gast freundlich begrüßen.
2. Namen und Reservierung abgleichen.
3. fehlende Daten oder Formalitäten verständlich klären.
4. Zugang, WLAN, wichtige Hausregeln und Notfallkontakt erklären.
5. Gästekarte und vorgesehene Leistungen erklären.
6. Schlüssel oder Karte übergeben.
7. Fragen und offene Wünsche aufnehmen.
8. relevante Hinweise in CASABLANCA dokumentieren.
9. Anreise- oder Check-in-Status kontrollieren.

### Qualitätskriterium

Der Gast weiß, wie die Einheit betreten wird, wo Hilfe erreichbar ist und was bei einem Problem zu tun ist.

---

## Prozess 14: Selbstanreise und Spätanreise

### Vorbereitung

1. Identität und Reservierung prüfen.
2. Zahlung, Online-Check-in und erforderliche Daten prüfen.
3. Housekeeping- und Bezugsstatus prüfen.
4. Zugangslösung vorbereiten.
5. Nachricht mit geprüften Informationen senden.
6. Erreichbarkeit und Notfallkontakt nennen.
7. erfolgreiche Ankunft nach betrieblicher Regel kontrollieren.

### Nachricht muss enthalten

- eindeutige Buchungsreferenz;
- Einheit oder sichere Bezeichnung nach Kommunikationsregel;
- Zeitpunkt, ab dem Zugang möglich ist;
- freigegebene Zugangsinformation;
- Hinweis zu Schlüssel oder Karte;
- WLAN-Information nach Betriebsstandard;
- Kontakt bei Problemen;
- Verhalten bei Notfällen;
- relevante Nacht- oder Gebäuderegeln.

### Wenn der Gast nicht hineinkommt

1. Reservierung und Einheit prüfen.
2. Zugangslösung prüfen.
3. Kontakt mit dem Gast halten.
4. sichere Ersatzlösung anbieten.
5. Haustechnik oder Bereitschaft informieren.
6. Ursache und Lösung dokumentieren.

---

## Prozess 15: Gästefragen beantworten

### Schritte

1. Frage vollständig anhören.
2. aktuelle, freigegebene Quelle verwenden.
3. bei Unsicherheit nicht raten.
4. Rückfrage als Aufgabe dokumentieren.
5. zugesagte Rückmeldung einhalten.

### Typische Themen

- Lage und Zugang;
- WLAN und Geräte;
- Heizung und Warmwasser;
- Müll und Abstellbereiche;
- Waschmaschine oder Trockner, sofern vorhanden;
- zusätzliche Handtücher oder Ausstattung;
- Gästekarte und enthaltene Leistungen;
- regionale Angebote;
- Check-out und Gepäck;
- Schäden oder Störungen.

### Antwort bei Unsicherheit

> Ich prüfe das kurz in der aktuellen Information und gebe Ihnen bis [Zeitpunkt] Bescheid. Ich möchte Ihnen keine veraltete Auskunft geben.

---

## Prozess 16: Reklamation bearbeiten

### Grundhaltung

- ruhig bleiben;
- zuhören;
- Problem ernst nehmen;
- keine Schuldzuweisung;
- keine unberechtigte Zusage machen.

### Schritte

1. Gast ausreden lassen.
2. Problem in einem Satz zusammenfassen.
3. Einheit, Raum und Zeitpunkt erfassen.
4. Dringlichkeit und Auswirkung auf den Aufenthalt prüfen.
5. sichere Sofortmaßnahme anbieten, soweit freigegeben.
6. Housekeeping, Haustechnik oder Betriebsleitung informieren.
7. Aufgabe in CASABLANCA oder im vereinbarten Aufgabenweg dokumentieren.
8. Rückmeldung bis zu einem klaren Zeitpunkt zusagen.
9. Lösung oder Nacharbeit kontrollieren.
10. Vorgang abschließen und Verbesserungspotenzial melden.

### Prioritäten

**A – sofort:** Sicherheit, Wasser, Strom, Heizung, Zugang, erhebliche Hygiene- oder Belegungsprobleme.  
**B – zeitnah:** Funktionsstörung oder erhebliche Komfortabweichung ohne unmittelbare Gefahr.  
**C – regulär:** Allgemeine Frage, kleiner Komfortwunsch oder nicht dringende Verbesserung.

---

# 9. Übergabeprozesse

## Prozess 17: Zusammenarbeit mit Housekeeping

### Vor der Anreise

- Anreiseliste und Sonderwünsche weitergeben;
- Belegung und Zusatzbetten prüfen;
- Kinder- oder Sonderausstattung weitergeben;
- relevante Hinweise nur im erforderlichen Umfang teilen.

### Nach der Reinigung

Housekeeping meldet über den vereinbarten Weg:

- Reinigung offen;
- Reinigung läuft;
- Qualitätskontrolle offen;
- bezugsbereit;
- Mangel offen;
- technisch gesperrt.

### Rezeption prüft

1. Status in CASABLANCA oder dem vereinbarten Übergabeweg kontrollieren.
2. offene Mängel prüfen.
3. keine Einheit ohne Freigabe als bezugsbereit bestätigen.
4. kurzfristige Änderungen weitergeben.
5. Rückmeldung dokumentieren.

---

## Prozess 18: Zusammenarbeit mit Haustechnik

### Meldung enthält

- Einheit und Raum;
- Problem und Erkennungsmerkmal;
- Zeitpunkt;
- Dringlichkeit;
- Gast betroffen: ja oder nein;
- Einheit weiter nutzbar: ja oder nein;
- Foto nur, wenn zulässig und sinnvoll;
- gewünschte Rückmeldung;
- zuständige Person.

### Nachverfolgung

1. Meldung zuweisen.
2. Status setzen.
3. Rückmeldung überwachen.
4. Gast informieren, wenn betroffen.
5. Lösung prüfen.
6. Einheit erst nach Freigabe wieder als bezugsbereit behandeln.

---

## Prozess 19: Fundstücke bearbeiten

### Schritte

1. Fundstück nicht behalten oder entsorgen.
2. Einheit, Raum, Datum und Uhrzeit dokumentieren.
3. Fundstück sicher verwahren.
4. zuständige Person informieren.
5. Gast nur über den freigegebenen Kommunikationsweg kontaktieren.
6. Versand oder Abholung nach Betriebsstandard dokumentieren.

---

# 10. Abreise- und Abschlussprozesse

## Prozess 20: Check-out und Abreise

### Vor der Abreise

- Abreisezeit und Sondervereinbarungen prüfen;
- offene Beträge prüfen;
- Rechnung oder Beleg vorbereiten;
- Schlüssel- oder Kartenrückgabe klären;
- Housekeeping über die erwartete Abreise informieren.

### Beim persönlichen Check-out

1. Gast freundlich verabschieden.
2. kurzen Aufenthaltseindruck aufnehmen.
3. Schlüssel oder Karte zurücknehmen, sofern vorgesehen.
4. offene Beträge abschließen.
5. Rechnung oder Beleg übergeben oder versenden.
6. Fundstücke oder nachträgliche Wünsche aufnehmen.
7. Abreise- oder Check-out-Status in CASABLANCA kontrollieren.
8. Einheit als Abreise und Reinigung offen an Housekeeping übergeben.
9. Schäden oder Besonderheiten dokumentieren.

### Bei Selbst- oder Online-Check-out

- Rückgabeweg eindeutig erklären;
- digitale Bestätigung prüfen;
- Abreise in CASABLANCA kontrollieren;
- Einheit als Abreise melden;
- offene Punkte übergeben.

### Qualitätskriterium

Nach der Abreise sind Reservierungsstatus, Zahlungsstatus, Schlüsselsituation, Einheit und interne Aufgaben eindeutig.

---

## Prozess 21: Tagesabschluss und Kasse

### Prüfen

- alle Anreisen bearbeitet;
- alle Abreisen bearbeitet;
- Reservierungen der 9 Einheiten geprüft;
- Doppelbelegungen, Optionen und Sperren kontrolliert;
- Housekeeping- und Einheitenstatus aktuell;
- Zahlungen korrekt zugeordnet;
- offene Beträge und Erstattungen geprüft;
- Kasse gezählt, sofern vorhanden;
- Belege, Stornos und Korrekturen vollständig;
- Meldedaten und Gästekartenstatus geprüft;
- Reklamationen, Schäden und Notfälle übergeben;
- Schlüssel und Zugangsmittel sicher verwahrt;
- Schichtübergabe erstellt;
- betriebliche Abschlussroutine durchgeführt.

### Neun-Einheiten-Kontrolle

| Einheit | Aufenthalt / Abreise | Housekeeping | Zahlung | Zugang | Offene Aufgabe | Verantwortlich |
|---|---|---|---|---|---|---|
| 01 |  |  |  |  |  |  |
| 02 |  |  |  |  |  |  |
| 03 |  |  |  |  |  |  |
| 04 |  |  |  |  |  |  |
| 05 |  |  |  |  |  |  |
| 06 |  |  |  |  |  |  |
| 07 |  |  |  |  |  |  |
| 08 |  |  |  |  |  |  |
| 09 |  |  |  |  |  |  |

### Qualitätskriterium

CASABLANCA, Kassenstatus, Zahlungsstatus, Belegungsplan, Housekeeping-Status und Übergabeliste stimmen überein.

---

# 11. Notfall- und Eskalationsprozesse

## Prozess 22: Notfall oder Sicherheitsereignis

### Beispiele

- Feuer oder Rauch;
- Wasserleck oder Überschwemmung;
- Strom- oder Gasausfall;
- medizinischer Notfall;
- Einbruch oder Verlust eines Zugangsmittels;
- akute Gefahr für Gäste oder Mitarbeitende;
- nicht sicher nutzbare Einheit.

### Grundablauf

1. eigene und unmittelbare Sicherheit beachten;
2. externen Notruf oder zuständige Stelle nach Betriebs- und Behördenvorgabe verständigen;
3. Gäste aus dem Gefahrenbereich bringen, soweit sicher möglich;
4. Betriebsleitung informieren;
5. Einheit sperren oder nicht freigeben, wenn sie unsicher ist;
6. keine riskanten Reparaturversuche durchführen;
7. Ereignis, Zeit, Personen und Maßnahmen dokumentieren;
8. Folgeaufgaben und Rückmeldung festlegen.

**Die konkreten Notfallnummern und standortbezogenen Sicherheitsregeln müssen ergänzt und praktisch geübt werden.**

## Prozess 23: Eskalation bei unklaren oder kritischen Vorgängen

### Sofort eskalieren bei

- möglicher Überbuchung;
- fehlender oder falscher Zahlung mit Anreise am selben Tag;
- nicht bezugsbereiter Einheit kurz vor Anreise;
- Sicherheits- oder Zugangsstörung;
- Wasser, Strom, Gas oder erheblichem Schaden;
- Datenschutz- oder Zahlungsdatenvorfall;
- Gastbeschwerde mit möglicher rechtlicher oder finanzieller Folge;
- unklarer Zuständigkeit bei einem kritischen Vorgang.

### Eskalationsweg

1. Vorgang sichern und nicht weiter verschlimmern.
2. Reservierung, Einheit und Zeitpunkt dokumentieren.
3. Dringlichkeit festlegen.
4. zuständige Rolle informieren.
5. nächste Rückmeldung und Frist festlegen.
6. Gast sachlich über den nächsten Schritt informieren.
7. Lösung und Abschluss dokumentieren.

---

# 12. Prozesskontrolle und Freigabe

## 12.1 Vor der betrieblichen Freigabe prüfen

- interne Bezeichnungen der Einheiten 01 bis 09;
- CASABLANCA-Version und aktivierte Module;
- konkrete Statuswerte;
- Buchungskanäle und Schnittstellen;
- Zahlungs- und Rechnungsprozess;
- Storno- und Erstattungsprozess;
- Online-Check-in;
- Meldedaten und Gästekarte;
- Zugangslösung;
- Housekeeping- und Technikübergabe;
- Check-out und Tagesabschluss;
- Notfallkontakte und Eskalationswege;
- Rollen und Benutzerrechte;
- Datenschutz- und Aufbewahrungsvorgaben.

## 12.2 Prozess gilt als freigegeben, wenn

- die Schritte mit einer Testbuchung durchgeführt wurden;
- die richtige Einheit zugeordnet wurde;
- Statusänderungen nachvollziehbar sind;
- Housekeeping und Rezeption die Übergabe getestet haben;
- Zahlungen und Rechnungen geprüft wurden;
- Zugang und Anreise getestet wurden;
- offene Punkte und Ausnahmefälle dokumentiert sind;
- eine zweite Person den Prozess nachvollziehen kann.

## 12.3 Änderungsprozess

1. Fehler, Änderung oder Verbesserung erfassen.
2. betroffenen Prozess identifizieren.
3. CASABLANCA-Anleitung, Vorlage und Schnittstellen prüfen.
4. Prozess aktualisieren.
5. zweite Person prüfen lassen.
6. Version und Änderungsgrund dokumentieren.
7. betroffene Personen informieren.
8. praktische Umsetzung erneut prüfen.
9. alte Version archivieren.

---

# 13. Freigabefeld

**Betrieb:** __________________________________________  
**Standort:** __________________________________________  
**Verantwortliche Person:** ____________________________  
**Anzahl Einheiten:** 9  
**Hotelsoftware:** CASABLANCA hotelsoftware  
**CASABLANCA-Version / Edition:** ______________________  
**Aktivierte Module:** _________________________________  
**Geprüft durch:** _____________________________________  
**Freigegeben am:** ____________________________________  
**Version:** ___________________________________________

---

# 14. Änderungsprotokoll

| Version | Datum | Änderung | Geprüft durch | Freigegeben durch |
|---|---|---|---|---|
| 1.0 | 20.09.2026 | Reines Prozesshandbuch für die Rezeptionsabläufe erstellt |  |  |
