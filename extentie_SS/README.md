# Smartschool Notities

Chrome-extensie die in de berichtenmodule van Smartschool een notitie laat toevoegen aan elk bericht. De notities blijven lokaal in de browser. Er gaat niets naar een externe server.

Werkt op alle `*.smartschool.be`-subdomeinen, getest op `decampusschoolgent.smartschool.be`.

Hoe de code in elkaar zit: zie [ARCHITECTUUR.md](ARCHITECTUUR.md).

## Status

De extensie wordt stap voor stap gebouwd. Na elke stap wordt getest.

| Stap | Inhoud | Status |
|---|---|---|
| 1 | Manifest, selectors, observer, 📝-knop per bericht | Klaar en getest |
| 2 | Opslaglaag en zijpaneel om een notitie te bewerken | Gebouwd, nog niet getest |
| 3 | Indicator bij berichten met een notitie, options-pagina (overzicht, export/import) | Gepland |
| 4 | Voorbereiding fase 2: `api.js` en stubs voor "ga naar antwoord" | Gepland |
| 5 | Afwerking README | Gepland |

**Fase 2** (later): vanuit een beantwoord bericht rechtstreeks naar het antwoord in Verzonden springen.

## Installeren

1. Open `chrome://extensions` (of `edge://extensions`).
2. Zet rechtsboven **Ontwikkelaarsmodus** aan.
3. Klik op **Uitgepakte extensie laden** en kies de map `extentie_SS`.
4. Open Smartschool en ga naar **Berichten**.

Na een wijziging aan de code: klik bij de extensie op **Opnieuw laden** (↻) en herlaad daarna de Smartschool-pagina.

## Gebruik

1. In de berichtenlijst staat bij elk bericht een 📝-knop.
2. Klik erop. Het bericht opent niet, maar rechts schuift een paneel open.
3. Vul in wat je wil:
   - **Notitie**: vrije tekst
   - **Link / meer info**: een URL, die klikbaar wordt
   - **Tags**: kommagescheiden, bv. `ict, dringend`
   - **Status**: open of opgevolgd
4. Bewaren gaat automatisch na een halve seconde zonder typen. **Ctrl+S** bewaart meteen. Onderaan staat wanneer de notitie laatst bewaard is.
5. **Escape** of **Sluiten** sluit het paneel. **Verwijderen** vraagt eerst een bevestiging.

Een notitie blijft aan het bericht hangen, ook als het bericht naar het archief of een eigen map verplaatst wordt. Smartschool houdt het bericht-ID dan gelijk (getest op 30/09/2026).

## Privacy en GDPR

- Notities kunnen persoonsgegevens van leerlingen of collega's bevatten.
- Ze staan alleen in `chrome.storage.local` van jouw browserprofiel. Een ander toestel of een andere browser ziet ze niet.
- Er is geen telemetrie en de extensie doet geen externe verzoeken.
- Verwijder je de extensie, dan verdwijnen ook de notities. Maak dus eerst een export zodra die knop er is (stap 3).
- **Bij een latere centrale database** (bv. om notities te delen tussen toestellen of collega's) zijn nodig:
  - een server in de EU
  - een vermelding in het verwerkingsregister van de school
  - toegangsbeheer per gebruiker

## Bekende beperkingen

- De extensie leunt op de HTML-structuur van Smartschool. Verandert Smartschool die, dan verdwijnen de knoppen zonder foutmelding. De aanpassing gebeurt in één bestand: `src/config/selectors.js`.
- Mogelijk toont Smartschool de actiezone van een rij (waar 📝 staat) alleen bij hover. Nog na te kijken bij het testen.
- Een notitie hoort bij één browserprofiel. Er is (nog) geen synchronisatie.
- Wordt een bestaande notitie volledig leeggemaakt, dan blijft een lege notitie bewaard. Echt weghalen gaat via **Verwijderen**.

## Problemen opsporen

1. Open de ontwikkelaarstools (F12) op de Smartschool-pagina en ga naar **Console**.
2. Zet het logniveau op **Verbose**. Meldingen van de extensie beginnen met `[Smartschool Notities]`.
3. Om de bewaarde notities te bekijken: kies bovenaan de console de context **Smartschool Notities** in plaats van "top" en typ:

   ```js
   await chrome.storage.local.get(null)
   ```
