# Architectuur Smartschool Notities

## Overzicht

Chrome-extensie (Manifest V3) in vanilla JavaScript. Geen externe bibliotheken en geen build-stap: de bestanden in deze map zijn exact wat Chrome laadt.

De extensie draait als content script op elke `*.smartschool.be`-pagina, maar doet alleen iets in de berichtenmodule. Ze **leest** de berichtenlijst en voegt eigen elementen toe. Ze verzendt, verwijdert of verplaatst nooit berichten.

```
Smartschool-pagina geladen (document_idle)
        |
        v
   content.js ---- geen #messageframe / #msglist ----> stop (console.debug)
        |
        v  dynamische import van de modules
   observer.js: watchMessageList()
        |
        |  bij start en na elke wijziging in de lijst (debounce 150 ms)
        v
   per rij: getRowInfo(row)  ->  enhancers (nu: attachNoteButton)
        |
        v  klik op 📝
   panel.js: openPanel(info)
        |
        v
   store.js: getStore()  ->  localStore.js  ->  chrome.storage.local
```

## Bestandsstructuur

```
extentie_SS/
  manifest.json
  README.md, ARCHITECTUUR.md
  icons/                       icon16/48/128.png
  src/
    content.js                 bootstrap (klassiek script, geen module)
    content.css                stijl van de 📝-knop, klassen met prefix ssn-
    config/selectors.js        ALLE Smartschool-selectors en -attributen
    core/dom.js                rij -> {msgId, box, subject, name, date}, debug()
    core/observer.js           MutationObserver, debounce, idempotente verrijking
    storage/store.js           contract, datamodel, keuze van de opslag
    storage/localStore.js      implementatie met chrome.storage.local
    features/notes/button.js   📝-knop per rij
    features/notes/panel.js    zijpaneel in Shadow DOM
```

Nog te bouwen (zie de status in de README):

```
    core/api.js                client voor de Smartschool-dispatcher (stap 4)
    features/replies/replies.js hook op het "beantwoord"-pijltje (stap 4, fase 2)
  options/options.html, .js    overzicht, zoeken, export/import JSON (stap 3)
```

## Onderdelen

| Onderdeel | Verantwoordelijkheid |
|---|---|
| `content.js` | Controleert of de berichtenmodule er is en laadt dan de modules met `import(chrome.runtime.getURL(...))`. Elke fout wordt opgevangen en alleen met `console.debug` gelogd. |
| `config/selectors.js` | Eén plek voor alle selectors (`SEL`), attributen (`ATTR`) en eigen markeringen (`OWN`). Past Smartschool zijn HTML aan, dan verandert alleen dit bestand. |
| `core/dom.js` | `findMessageRoot()`, `getRows()`, `getRowInfo(row)`. Geeft `null` terug bij een rij zonder geldig numeriek ID of met een `itemtype` dat geen `message` is. |
| `core/observer.js` | `watchMessageList({ enhancers, isDone })`. Observeert `#messageframe` (fallback: `body`) en roept elke *enhancer* aan op rijen die nog niet verrijkt zijn. |
| `storage/store.js` | Contract van de opslag, `noteKey()`, `createNote()`, `normalizeNote()`, `parseTags()` en `getStore()`. |
| `storage/localStore.js` | Implementatie van het contract met `chrome.storage.local`. |
| `features/notes/button.js` | `attachNoteButton(row, info)` en `hasNoteButton(row)`. |
| `features/notes/panel.js` | `openPanel(info, opener)` en `closePanel()`. Bouwt het paneel lui op bij de eerste klik. |

## Opstarten en modules

Content scripts kunnen geen statische `import` gebruiken. Daarom is `content.js` een klassiek script dat de ES-modules dynamisch laadt. Daarvoor moeten de modules in `web_accessible_resources` staan (`src/*.js`, `src/*/*.js`, `src/*/*/*.js`). De geladen modules draaien in dezelfde geïsoleerde wereld als het content script en hebben dus toegang tot `chrome.storage`.

`selectors.js` wordt eerst apart geladen. Zo wordt op pagina's zonder berichtenmodule verder niets ingeladen.

## Rijen verrijken

Smartschool bouwt `#msglist` opnieuw op bij mapwissel, sorteren, zoeken en polling, en kan `#msglist` zelf vervangen. Daarom observeert de extensie de ouder `#messageframe` met `childList` en `subtree`.

- **Debounce 150 ms**: een herlading geeft tientallen mutaties. Er volgt maar één verwerking.
- **Alleen toegevoegde nodes** starten een verwerking. Attribuutwijzigingen (bv. gelezen/ongelezen) niet.
- **Idempotent**: een verwerkte rij krijgt `data-ssn-done="1"`. De rij wordt toch opnieuw verwerkt als `isDone(row)` onwaar is, bijvoorbeeld wanneer Smartschool de inhoud van een bestaande rij vervangt en de knop weg is. Elke enhancer controleert zelf ook of hij al gedraaid heeft.
- **Geen oneindige lus**: het plaatsen van de knop is zelf een mutatie. De volgende verwerking vindt alles als "klaar" en wijzigt niets.

Een **enhancer** is een functie `(row, info) => void`. Een nieuwe functie per rij (bv. de indicator in stap 3 of de reply-hook in stap 4) wordt toegevoegd aan de lijst `enhancers` in `content.js`. Een fout in één enhancer stopt de andere niet.

## De 📝-knop

- Staat in `.modern-message__actions`, vooraan.
- Een rij opent een bericht via een inline `onclick` (`oTriggers.showMessage`). De knop stopt daarom `click` (en `mousedown`, `pointerdown`, `dblclick`) met `stopPropagation()`. Zo opent het bericht niet en start er geen sleepactie naar een map.
- Bij een klik wordt de rij opnieuw gelezen met `getRowInfo(row)`, omdat Smartschool de rij intussen kan bijgewerkt hebben.

## Het zijpaneel

- **Shadow DOM** op een host `#ssn-panel-host` in `body`. De stijl van Smartschool en die van het paneel beïnvloeden elkaar niet. Lettertype en lettergrootte worden wel overgeërfd, zodat het paneel de lettergrootte van de pagina volgt.
- **Geen `innerHTML`**: alle DOM wordt opgebouwd met `createElement` en `textContent` (helper `el()`).
- **Links**: `safeHref()` laat alleen `http(s)` toe (dus geen `javascript:`). Zonder schema wordt `https://` toegevoegd.
- **Toestand**:
  - `ctx = { info, key, note }` voor het geopende bericht
  - `dirty` voor onbewaarde wijzigingen
  - `saveTimer` voor de autosave
  - `inflight` voor een lopende bewaring
- **Bewaren**:
  - na 500 ms zonder typen, met Ctrl+S, bij sluiten, bij het openen van een ander bericht en wanneer het tabblad verborgen wordt
  - een nieuwe notitie zonder inhoud wordt niet bewaard
  - een bewaring wacht op de vorige, zodat ze altijd op de recentste versie verderbouwt
  - na elke `await` controleert de code of `ctx` nog hetzelfde bericht is
- **Verwijderen**: vraagt bevestiging als er inhoud is en wacht op een lopende bewaring. Zo duikt een notitie na het verwijderen niet opnieuw op.
- **Toetsenbord**:
  - Escape sluit het paneel, zowel met de focus in het paneel als erbuiten.
  - Bij sluiten gaat de focus terug naar de 📝-knop.
  - Een gesloten paneel is `inert`, dus niet bereikbaar met Tab.
- **Toetsen afschermen**: `keydown`, `keyup` en `keypress` worden op de host gestopt. Buiten de Shadow DOM lijkt het doel van een toetsaanslag de host-`div` en geen tekstvak. Anders zouden sneltoetsen van Smartschool (bv. Delete) kunnen afgaan terwijl je typt.
- **Synchronisatie**: via `store.onChange` werkt het paneel zich bij als dezelfde notitie elders wijzigt (ander tabblad, options-pagina). Dat gebeurt niet als er onbewaarde wijzigingen zijn.

## Opslag

### Contract

`store.js` legt vast wat elke opslag moet kunnen. De UI-code gebruikt alleen dit contract:

```js
async get(key)                           // → note | null
async set(note)                          // → note (vult createdAt/updatedAt aan)
async remove(key)
async list({ host, box, query, status }) // → note[], nieuwste eerst
async exportAll()                        // → JSON-string
async importAll(json, { merge: true })   // → { imported, skipped }
onChange(callback)                       // → functie om af te melden
```

`getStore()` leest de instelling `settings.storage` in `chrome.storage.local` (standaard `"local"`) en laadt de implementatie uit `BACKENDS`. De implementatie wordt dynamisch geïmporteerd. Zo is er geen import-cyclus tussen `store.js` en `localStore.js`.

**Een nieuwe opslag toevoegen** (bv. `remoteStore.js` voor Supabase of een eigen API):

1. Maak `src/storage/remoteStore.js`, dat `export const store = { ... }` met het volledige contract levert.
2. Voeg een regel toe aan `BACKENDS` in `store.js`.
3. Voeg de keuze toe op de options-pagina (stap 3).

### Sleutel

```
note:{host}:{box}:{msgId}
note:decampusschoolgent.smartschool.be:inbox:9517330
```

- `host` scheidt scholen.
- `box` is het **type** (`realbox`: `inbox`, `outbox`, ...), **nooit** de map (`boxID`).
- Test op 30/09/2026: een bericht dat naar het archief (`boxID` 28962) of een eigen map verplaatst wordt, houdt hetzelfde ID en blijft `realbox="inbox"`. Eigen mappen zijn submappen van het type `inbox`. Zo blijft een notitie aan het bericht hangen, ongeacht de map.

### Datamodel

```js
{
  schemaVersion: 1,
  key, host, box, msgId,
  subject, from, date,   // kopie uit de rij, voor het overzicht
  text, link, tags: [], status: "open" | "opgevolgd",
  createdAt, updatedAt,  // ISO-strings
  replyMsgId: null       // fase 2: gekoppeld antwoord in de outbox
}
```

`from` bevat in Verzonden de ontvanger(s): het is de naam uit de rij. Verandert het model, verhoog dan `schemaVersion` en vang oude versies op in `normalizeNote()`.

### Import

- `normalizeNote()` controleert en vult elk record aan. Records zonder `host`, `box` of `msgId` worden overgeslagen.
- `merge: true`: bestaande notities blijven. Bij hetzelfde `key` wint de recentste `updatedAt`.
- `merge: false`: alle bestaande notities worden eerst gewist.
- Het exportformaat is `{ app, schemaVersion, exportedAt, notes: [...] }`. Een kale array wordt ook aanvaard.

## Koppeling met Smartschool

### DOM (zie `selectors.js`)

| Selector / attribuut | Gebruik |
|---|---|
| `#messageframe` | Observer-doel en detectie van de berichtenmodule |
| `#msglist` | Detectie (fallback) |
| `div.modern-message` | Eén rij per bericht |
| `[msgid="row_…"]` (fallback: `id`) | Bericht-ID, prefix `row_` weggehaald |
| `[realbox]` | Type van de box, deel van de sleutel |
| `[itemtype]` | Alleen `message` wordt verwerkt |
| `.modern-message__actions` | Plaats van de 📝-knop |
| `.modern-message__name` / `__subject` / `__date` | Info voor het paneel |
| `.modern-message__icons` | Plaats van de indicator (stap 3) |
| `.modern-message__icon--replied` | Hook voor fase 2 |

De globale objecten van de pagina (`oTriggers`, `oMessageList`, `oEnvironment`, ...) worden **niet** gebruikt. Een content script kan er niet aan, en een script in de MAIN world is voorlopig niet nodig.

### Dispatcher (voor stap 4 en fase 2)

```
POST /?module=Messages&file=dispatcher
Content-Type: application/x-www-form-urlencoded
body: command=<url-encoded XML>
```

Het verzoek werkt met de bestaande sessiecookie van de gebruiker. Relevante acties in subsystem `postboxes`:

- `show message`: één bericht (`msgID`, `boxType`). `hasReply=1` zegt dat er geantwoord is, maar er staat geen ID van het antwoord in.
- `message list`: 50 berichten van een map (`boxType`, `boxID`).
- `continue_messages`: de volgende 50. **Let op**: deze actie werkt met server-state (zie `VS_Smartschool/export_messages.py`). Ze kan dus interfereren met de lijst die de gebruiker op dat moment open heeft. Nog te testen voor ze in de extensie gebruikt wordt.

Een werkende `fetch` naar dit endpoint staat al in `VS_Smartschool/extension/src/content.js`.

## Fase 2: ga naar antwoord (plan)

1. `original = getMessage(msgId, "inbox")`
2. `sent = listBox("outbox", 0)`
3. Kandidaten:
   - het onderwerp is `Re:` + het origineel (hoofdletterongevoelig, ook `RE:` en `Antw:`, spaties genegeerd)
   - de ontvanger bevat de afzender van het origineel
   - de datum is gelijk aan of later dan die van het origineel
4. Neem de vroegste kandidaat. Bij twijfel: zoek een citaat van het origineel in de body.
5. Niets gevonden in de eerste 50: volgende pagina's of de melding "Antwoord niet gevonden in de laatste berichten".
6. Bewaar de koppeling in `note.replyMsgId` of in een cache `reply:{host}:{msgId}`.
7. Openen: de rij in Verzonden aanklikken of het antwoord in het zijpaneel tonen. De eenvoudigste werkende optie wordt gekozen.

## Ontwerpkeuzes

- **Nooit Smartschool breken**: elke stap faalt stil (`console.debug`). Ontbreekt een selector, dan gebeurt er niets.
- **Geen build-stap**: iedereen kan de map laden en aanpassen zonder Node of npm.
- **Observer in plaats van polling**: reageert meteen op herladen en kost niets als er niets verandert.
- **Opslag achter een contract**: de overstap naar een database raakt alleen `src/storage/`.
- **Sleutel op berichttype, niet op map**: de notitie overleeft archiveren en verplaatsen.
- **Alleen lezen**: de extensie roept geen dispatcher-acties aan die iets wijzigen.

## Beperkingen en risico's

- Alles hangt af van de HTML-structuur en het interne endpoint van Smartschool. Geen van beide is een officiële API.
- `chrome.storage.local` is per browserprofiel en er is geen synchronisatie.
- `web_accessible_resources` maakt de modules opvraagbaar voor Smartschool-pagina's. Dat is onschuldig (er staan geen gegevens in), maar Smartschool kan zo wel zien dat de extensie geïnstalleerd is.
