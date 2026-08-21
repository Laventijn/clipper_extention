# Social opvolglijst - installatie

## Projectopzet

- `extentie/` bevat alleen de bestanden die je in Chrome importeert via
  "Uitgepakte extensie laden".
- `dev-tools/` bevat hulpmiddelen voor ontwikkeling, zoals een popup-preview.
  - testcommando: start dev-tools\popup-preview.html
- `scripts/` bevat hulpscripts voor Git en versiebeheer.

## Installeren in Chrome

1. Pak deze map uit op je computer.
2. Ga naar `chrome://extensions`.
3. Zet rechtsboven "Ontwikkelaarsmodus" aan.
4. Klik op "Uitgepakte extensie laden" en kies de map `extentie`.
5. Het icoontje verschijnt rechtsboven in Chrome.

## Popup vooraf bekijken

Open `dev-tools/popup-preview.html` in je browser. Die toont dezelfde popup met
testdata, zonder dat je de extensie eerst in Chrome moet herladen.

## Gebruik

1. Selecteer op een website de tekst van een reactie of melding.
2. Klik rechts, kies "Voeg geselecteerde tekst toe aan opvolglijst".
3. Klik op het extensie-icoontje om je verzamelde items te zien.
4. Klik op "Samenvatten met AI" voor een overzicht en antwoordvoorstellen
   (vraagt je Anthropic API-key, blijft enkel lokaal in je browser opgeslagen).
5. Klik op "Exporteer CSV" om alles in een spreadsheet te bewaren.

Je kan de extensie ook gebruiken buiten Facebook en LinkedIn. Dan bewaart ze de
domeinnaam als bron, bijvoorbeeld `nieuwssite.be` of `schoolwebsite.be`.

## Links en screenshots bewaren

Via rechtsklik zijn er drie acties:

- "Voeg geselecteerde tekst toe aan opvolglijst": bewaart de tekst en de URL van
  de huidige pagina.
- "Bewaar deze link in opvolglijst": bewaart de link waarop je rechtsklikt.
- "Maak screenshot voor opvolglijst": bewaart bij voorkeur het actieve
  dialoogvenster of pop-upvenster op de pagina. Als dat niet gevonden wordt,
  probeert de extensie de selectie te bewaren. Als ook dat niet lukt, bewaart
  ze het zichtbare deel van het huidige tabblad.

Een screenshot is handig wanneer tekst niet selecteerbaar is. Chrome laat een
extensie niet op elke website exact hetzelfde element herkennen; daarom is er
een fallback naar selectie of zichtbaar tabblad.

## Belangrijk

- De extensie leest enkel tekst die je zelf selecteert. Er gebeurt geen
  automatisch inloggen, scrapen of geautomatiseerd klikken.
- Screenshots worden lokaal in Chrome storage bewaard. Ze kunnen de opslag
  sneller doen groeien dan tekstitems.
- Je API-key wordt nergens naartoe gestuurd behalve rechtstreeks naar
  api.anthropic.com, vanuit je eigen browser.
- Wil je geen eigen API-key gebruiken: exporteer de CSV en plak de inhoud
  gewoon in een Claude-gesprek voor een samenvatting.

## Mogelijke uitbreiding

- Extra rechtsklik-item om ook je eigen geplaatste reactie op te slaan als
  "opvolgen" (handig om te weten op welke posts je actief bent).
- Automatisch labelen per onderwerp (koor, Groen, school) via een tweede
  AI-aanroep.

## Versiebeheer met Git

De eerste setup kan met:

```bat
scripts\git-eerste-setup.bat
```

Een nieuwe versie bewaren kan met:

```bat
scripts\bewaar-versie.bat
```

Of met een eigen boodschap:

```bat
scripts\bewaar-versie.bat "Popup aangepast"
```

Als er een remote is ingesteld, pusht het script ook automatisch. Zonder remote
maakt het script wel een lokale commit, maar slaat het pushen over.
