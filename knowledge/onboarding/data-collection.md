# Data-Collection-Felder für den Onboarding-Agenten

Manuell im ElevenLabs-Dashboard anlegen: Agent → Analysis → Data collection. Jedes Feld entspricht einem Eintrag in `guidance/betriebsdaten.md`. Typ ist überall `string`, außer wo angegeben. Die Beschreibung ist die Extraktionsanweisung für das LLM nach dem Gespräch; wenn ein Thema nicht besprochen oder als offen markiert wurde, soll das Feld leer bleiben.

| Feld | Typ | Beschreibung |
|---|---|---|
| max_belegung | number | Maximale Personenzahl der Wohnung |
| balkon_terrasse | string | Ob Balkon oder Terrasse vorhanden ist und was dort steht |
| farbsystem | string | Verwendetes Farbsystem für Tücher, oder "Standard" wenn blau/grün/gelb/rot bestätigt |
| spuelmaschine_vorhanden | boolean | Ob eine Spülmaschine in der Wohnung ist |
| waschmaschine_vorhanden | boolean | Ob vor Ort gewaschen wird |
| trockner_vorhanden | boolean | Ob ein Trockner vorhanden ist |
| waschprogramm_bettwaesche_handtuecher | string | Programm und Temperatur |
| waschprogramm_bademaentel | string | Programm und Temperatur |
| waschmittel | string | Verwendetes Waschmittel und Dosierung |
| handtuecher_pro_person | string | Anzahl und Art der Handtücher pro Person |
| anzahl_bademaentel | string | Anzahl Bademäntel pro Wohnung oder Person |
| standardplatz_textilien | string | Wo Handtücher und Bademäntel für den Gast bereitliegen |
| reinigungsmittel | string | Mittel für Dusche/Kalk, WC und Küche inkl. Dosierungshinweisen |
| kuecheninventar | string | Inventarliste oder Mengenregel |
| verbrauchsmaterial_kueche | string | Welche Artikel gestellt werden und in welcher Startmenge |
| reserverollen_toilettenpapier | string | Anzahl Reserverollen je Bad und WC |
| handseife | string | Art der Handseife |
| muellkategorien | string | Gültige Müllkategorien |
| sammelstelle | string | Ort der Müllsammelstelle |
| fensterreinigung_turnus | string | Wie oft die Fenster vollständig gereinigt werden |
| ansprechperson_schaeden | string | Wer bei Schäden und Fehlmengen informiert wird |
| ansprechperson_technik | string | Wer bei technischen Störungen informiert wird |
| meldeweg | string | Wie gemeldet wird: Telefon, Nachricht, App |
| besonderheiten | string | Alles, was vom Standard abweicht oder neue Mitarbeitende wissen müssen |
| offene_punkte | string | Themen, die die Person als unklar oder noch zu klären bezeichnet hat |

Nach einem Gespräch stehen die Werte unter Conversations → Analysis. Für die Demo werden sie von Hand in `guidance/betriebsdaten.md` übertragen und mit `npm run sync-kb` hochgeladen.
