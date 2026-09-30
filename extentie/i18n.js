const VERTALINGEN = {
  nl: {
    taal_label: "Taal",
    taal_nl: "Nederlands",
    taal_en: "Engels",
    taal_fr: "Frans",

    algemeen_kopieer: "Kopieer",
    algemeen_download: "Download als tekstbestand",
    algemeen_gekopieerd: "Gekopieerd!",
    algemeen_mislukt: "Mislukt",
    algemeen_kopierenMislukt: "Kopiëren is mislukt. Selecteer en kopieer de tekst handmatig.",
    algemeen_onbekend: "Onbekend",
    algemeen_verwijderen: "Verwijderen",
    algemeen_vulApiKeyIn: "Vul eerst je Anthropic API-key in.",
    algemeen_alleenInExtensie: "Deze functie werkt alleen in de geladen Chrome-extensie.",
    algemeen_foutPrefix: "Fout: ",
    algemeen_algemeneFoutPrefix: "Er ging iets mis: ",
    algemeen_ja: "ja",
    algemeen_nee: "nee",
    algemeen_allesSelecteren: "Alles selecteren",
    algemeen_selectieWissen: "Selectie wissen",
    algemeen_verbergen: "verberg",
    algemeen_tonen: "toon",

    popup_titel: "Verzamelde reacties",
    popup_projectSelectLabel: "Project selecteren",
    popup_nieuw: "Nieuw",
    popup_hernoem: "Hernoem",
    popup_projectnaamPlaceholder: "Projectnaam",
    popup_bewaar: "Bewaar",
    popup_voegPagina: "Voeg pagina toe",
    popup_samenvatten: "Samenvatten met AI",
    popup_kopieerProject: "Kopieer projecttekst",
    popup_exportCsv: "Exporteer CSV",
    popup_minimaliseerAlles: "Minimaliseer alles",
    popup_openGeschiedenis: "Open geschiedenisrapport",
    popup_apiKeyLabel: "Anthropic API-key (blijft lokaal opgeslagen):",
    popup_leeg: "Geen records in dit project.",
    popup_gepubliceerd: "gepubliceerd",
    popup_uitklappen: "Uitklappen",
    popup_inklappen: "Inklappen",
    popup_bevestigVerwijderen: "Dit record definitief verwijderen?",
    popup_bevestigMinimaliseren: 'Alle records in "{{naam}}" minimaliseren?',
    popup_nieuwProjectPrompt: "Naam van het nieuwe project?",
    popup_nieuwProjectDefault: "Nieuw project",
    popup_geenRecordsKopieren: "Er zijn geen records om te kopiëren.",
    popup_geenRecordsSamenvatten: "Er zijn geen records om samen te vatten.",
    popup_bezigSamenvatten: "Bezig met samenvatten...",
    popup_geenTekstGevonden: "Geen zichtbare tekst gevonden op deze pagina.",
    popup_tekstNietGelezen: "De zichtbare tekst kon niet gelezen worden: ",
    popup_openBron: "Open bron",
    popup_screenshotAlt: "Screenshot van bronpagina",
    popup_samenvattenPrompt:
      "Vat onderstaande verzameling tekst, links en screenshots samen in het Nederlands. " +
      "Groepeer per thema, benoem de toon (positief/kritisch/vraag), en stel waar relevant een kort antwoord voor.",

    csv_project: "project",
    csv_geminimaliseerd: "geminimaliseerd",
    csv_type: "type",
    csv_platform: "platform",
    csv_datum: "datum",
    csv_bron: "bron",
    csv_paginatitel: "paginatitel",
    csv_sitenaam: "sitenaam",
    csv_auteur: "auteur",
    csv_gepubliceerdOp: "gepubliceerd_op",
    csv_taal: "taal",
    csv_beschrijving: "beschrijving",
    csv_tekst: "tekst",
    csv_screenshot: "heeft_screenshot",

    geschiedenis_titel: "Geschiedenisrapport",
    geschiedenis_periode: "Periode",
    geschiedenis_vandaag: "Vandaag",
    geschiedenis_gisteren: "Gisteren",
    geschiedenis_aangepast: "Aangepast bereik",
    geschiedenis_vanaf: "Vanaf",
    geschiedenis_tot: "Tot",
    geschiedenis_laadKnop: "Laad geschiedenis",
    geschiedenis_filterPlaceholder: "Filter op titel of URL...",
    geschiedenis_groepeerAuto: "Groepeer automatisch per onderwerp",
    geschiedenis_groepeerTags: "Groepeer op tags",
    geschiedenis_genereerRapport: "Genereer rapport van deze selectie",
    geschiedenis_tagPlaceholder: "Label / tag (bv. Furiant, school)",
    geschiedenis_ongeldigeDatum: "Kies een geldig van- en tot-datum voor het aangepaste bereik.",
    geschiedenis_ladenBezig: "Geschiedenis laden...",
    geschiedenis_resultatenGeladen: "{{aantal}} resultaten geladen.",
    geschiedenis_ladenMislukt: "Kon geschiedenis niet laden: ",
    geschiedenis_geenResultaten: "Geen resultaten. Laad eerst een periode of pas de filter aan.",
    geschiedenis_aantalGeselecteerd: "{{geselecteerd}} geselecteerd van {{totaal}}",
    geschiedenis_selecteerEerst: "Selecteer eerst één of meer items.",
    geschiedenis_vulApiKeyViaPopup: "Vul eerst je Anthropic API-key in via de popup.",
    geschiedenis_bezigGroeperen: "Bezig met groeperen...",
    geschiedenis_zonderLabel: "Zonder label",
    geschiedenis_onderwerpFallback: "Onderwerp",
    geschiedenis_rapportBezig: "Rapport wordt gegenereerd...",
    geschiedenis_afgekaptWaarschuwing:
      "Let op: het antwoord van de AI werd afgekapt (te veel geselecteerde items: {{aantal}}). " +
      "Maak een kleinere selectie of verwerk de geschiedenis in meerdere delen voor een volledig resultaat.",
    geschiedenis_rapportAfgekaptSuffix:
      "\n\n[Let op: dit rapport werd afgekapt door te veel geselecteerde items. Maak een kleinere selectie voor een volledig rapport.]",
    geschiedenis_foutGroeperen: "Fout bij groeperen: ",
    geschiedenis_foutRapport: "Fout bij genereren van rapport: ",
    geschiedenis_groepeerAutoPrompt:
      "Onderstaande lijst zijn bezochte webpagina's (titel, URL, tijdstip). Clusteer ze per herkenbaar onderwerp " +
      'en geef een gestructureerd overzicht terug in het Nederlands. Gebruik voor elke kopregel exact het label ' +
      '"@@ONDERWERP@@" gevolgd door de onderwerpnaam in het Nederlands, en daaronder regels met \'- <tijdstip> · <titel>\'.',
    geschiedenis_rapportPrompt:
      "Hieronder staat een selectie van bezochte webpagina's (titel, URL, tijdstip, eventueel een label). " +
      "Schrijf in het Nederlands een lopend rapport over wat er in deze periode werd opgezocht, gegroepeerd per thema. " +
      "Schrijf per thema een paar zinnen in lopende tekst, geen opsomming van elke URL apart.",

    menu_voegSelectie: "Voeg geselecteerde tekst toe aan opvolglijst",
    menu_bewaarLink: "Bewaar deze link in opvolglijst",
    menu_maakScreenshot: "Maak screenshot voor opvolglijst",
    menu_voegExtraInfo: "Voeg selectie toe als extra info bij laatste record",

    popup_extraInfoTitel: "Extra info",
    popup_verwijderExtraInfo: "Extra info verwijderen",
    popup_verwerktLabel: "Verwerkt",
    popup_prioriteitLabel: "Prioriteit (klik om te wijzigen)",

    csv_verwerkt: "verwerkt",
    csv_prioriteit: "prioriteit"
  },

  en: {
    taal_label: "Language",
    taal_nl: "Dutch",
    taal_en: "English",
    taal_fr: "French",

    algemeen_kopieer: "Copy",
    algemeen_download: "Download as text file",
    algemeen_gekopieerd: "Copied!",
    algemeen_mislukt: "Failed",
    algemeen_kopierenMislukt: "Copying failed. Select and copy the text manually.",
    algemeen_onbekend: "Unknown",
    algemeen_verwijderen: "Delete",
    algemeen_vulApiKeyIn: "Please enter your Anthropic API key first.",
    algemeen_alleenInExtensie: "This feature only works in the loaded Chrome extension.",
    algemeen_foutPrefix: "Error: ",
    algemeen_algemeneFoutPrefix: "Something went wrong: ",
    algemeen_ja: "yes",
    algemeen_nee: "no",
    algemeen_allesSelecteren: "Select all",
    algemeen_selectieWissen: "Clear selection",
    algemeen_verbergen: "hide",
    algemeen_tonen: "show",

    popup_titel: "Collected responses",
    popup_projectSelectLabel: "Select project",
    popup_nieuw: "New",
    popup_hernoem: "Rename",
    popup_projectnaamPlaceholder: "Project name",
    popup_bewaar: "Save",
    popup_voegPagina: "Add page",
    popup_samenvatten: "Summarize with AI",
    popup_kopieerProject: "Copy project text",
    popup_exportCsv: "Export CSV",
    popup_minimaliseerAlles: "Minimize all",
    popup_openGeschiedenis: "Open history report",
    popup_apiKeyLabel: "Anthropic API key (stored locally):",
    popup_leeg: "No records in this project.",
    popup_gepubliceerd: "published",
    popup_uitklappen: "Expand",
    popup_inklappen: "Collapse",
    popup_bevestigVerwijderen: "Delete this record permanently?",
    popup_bevestigMinimaliseren: 'Minimize all records in "{{naam}}"?',
    popup_nieuwProjectPrompt: "Name of the new project?",
    popup_nieuwProjectDefault: "New project",
    popup_geenRecordsKopieren: "There are no records to copy.",
    popup_geenRecordsSamenvatten: "There are no records to summarize.",
    popup_bezigSamenvatten: "Summarizing...",
    popup_geenTekstGevonden: "No visible text found on this page.",
    popup_tekstNietGelezen: "Could not read the visible text: ",
    popup_openBron: "Open source",
    popup_screenshotAlt: "Screenshot of source page",
    popup_samenvattenPrompt:
      "Summarize the following collection of text, links and screenshots in English. " +
      "Group by theme, identify the tone (positive/critical/question), and where relevant suggest a short response.",

    csv_project: "project",
    csv_geminimaliseerd: "minimized",
    csv_type: "type",
    csv_platform: "platform",
    csv_datum: "date",
    csv_bron: "source",
    csv_paginatitel: "page_title",
    csv_sitenaam: "site_name",
    csv_auteur: "author",
    csv_gepubliceerdOp: "published_at",
    csv_taal: "language",
    csv_beschrijving: "description",
    csv_tekst: "text",
    csv_screenshot: "has_screenshot",

    geschiedenis_titel: "History report",
    geschiedenis_periode: "Period",
    geschiedenis_vandaag: "Today",
    geschiedenis_gisteren: "Yesterday",
    geschiedenis_aangepast: "Custom range",
    geschiedenis_vanaf: "From",
    geschiedenis_tot: "To",
    geschiedenis_laadKnop: "Load history",
    geschiedenis_filterPlaceholder: "Filter by title or URL...",
    geschiedenis_groepeerAuto: "Group automatically by topic",
    geschiedenis_groepeerTags: "Group by tags",
    geschiedenis_genereerRapport: "Generate report from this selection",
    geschiedenis_tagPlaceholder: "Label / tag (e.g. Furiant, school)",
    geschiedenis_ongeldigeDatum: "Choose a valid from and to date for the custom range.",
    geschiedenis_ladenBezig: "Loading history...",
    geschiedenis_resultatenGeladen: "{{aantal}} results loaded.",
    geschiedenis_ladenMislukt: "Could not load history: ",
    geschiedenis_geenResultaten: "No results. Load a period first or adjust the filter.",
    geschiedenis_aantalGeselecteerd: "{{geselecteerd}} selected of {{totaal}}",
    geschiedenis_selecteerEerst: "Select one or more items first.",
    geschiedenis_vulApiKeyViaPopup: "Please enter your Anthropic API key via the popup first.",
    geschiedenis_bezigGroeperen: "Grouping...",
    geschiedenis_zonderLabel: "No label",
    geschiedenis_onderwerpFallback: "Topic",
    geschiedenis_rapportBezig: "Generating report...",
    geschiedenis_afgekaptWaarschuwing:
      "Note: the AI's response was cut off (too many selected items: {{aantal}}). " +
      "Make a smaller selection or process the history in multiple parts for a complete result.",
    geschiedenis_rapportAfgekaptSuffix:
      "\n\n[Note: this report was cut off because too many items were selected. Make a smaller selection for a complete report.]",
    geschiedenis_foutGroeperen: "Error while grouping: ",
    geschiedenis_foutRapport: "Error while generating report: ",
    geschiedenis_groepeerAutoPrompt:
      "The list below contains visited webpages (title, URL, timestamp). Cluster them by recognizable topic " +
      'and return a structured overview in English. For each heading, use exactly the label "@@ONDERWERP@@" ' +
      "followed by the topic name in English, and below it lines formatted as '- <timestamp> · <title>'.",
    geschiedenis_rapportPrompt:
      "Below is a selection of visited webpages (title, URL, timestamp, optionally a label). " +
      "Write a flowing report in English about what was looked up during this period, grouped by theme. " +
      "Write a few sentences per theme in flowing text, not a list of every URL separately.",

    menu_voegSelectie: "Add selected text to follow-up list",
    menu_bewaarLink: "Save this link to follow-up list",
    menu_maakScreenshot: "Take screenshot for follow-up list",
    menu_voegExtraInfo: "Add selection as extra info to last record",

    popup_extraInfoTitel: "Extra info",
    popup_verwijderExtraInfo: "Remove extra info",
    popup_verwerktLabel: "Processed",
    popup_prioriteitLabel: "Priority (click to change)",

    csv_verwerkt: "processed",
    csv_prioriteit: "priority"
  },

  fr: {
    taal_label: "Langue",
    taal_nl: "Néerlandais",
    taal_en: "Anglais",
    taal_fr: "Français",

    algemeen_kopieer: "Copier",
    algemeen_download: "Télécharger en fichier texte",
    algemeen_gekopieerd: "Copié !",
    algemeen_mislukt: "Échec",
    algemeen_kopierenMislukt: "La copie a échoué. Sélectionnez et copiez le texte manuellement.",
    algemeen_onbekend: "Inconnu",
    algemeen_verwijderen: "Supprimer",
    algemeen_vulApiKeyIn: "Veuillez d'abord saisir votre clé API Anthropic.",
    algemeen_alleenInExtensie: "Cette fonction ne fonctionne que dans l'extension Chrome chargée.",
    algemeen_foutPrefix: "Erreur : ",
    algemeen_algemeneFoutPrefix: "Une erreur s'est produite : ",
    algemeen_ja: "oui",
    algemeen_nee: "non",
    algemeen_allesSelecteren: "Tout sélectionner",
    algemeen_selectieWissen: "Effacer la sélection",
    algemeen_verbergen: "masquer",
    algemeen_tonen: "afficher",

    popup_titel: "Réactions collectées",
    popup_projectSelectLabel: "Sélectionner un projet",
    popup_nieuw: "Nouveau",
    popup_hernoem: "Renommer",
    popup_projectnaamPlaceholder: "Nom du projet",
    popup_bewaar: "Enregistrer",
    popup_voegPagina: "Ajouter la page",
    popup_samenvatten: "Résumer avec l'IA",
    popup_kopieerProject: "Copier le texte du projet",
    popup_exportCsv: "Exporter en CSV",
    popup_minimaliseerAlles: "Tout réduire",
    popup_openGeschiedenis: "Ouvrir le rapport d'historique",
    popup_apiKeyLabel: "Clé API Anthropic (conservée localement) :",
    popup_leeg: "Aucun enregistrement dans ce projet.",
    popup_gepubliceerd: "publié",
    popup_uitklappen: "Déplier",
    popup_inklappen: "Replier",
    popup_bevestigVerwijderen: "Supprimer définitivement cet enregistrement ?",
    popup_bevestigMinimaliseren: 'Réduire tous les enregistrements de "{{naam}}" ?',
    popup_nieuwProjectPrompt: "Nom du nouveau projet ?",
    popup_nieuwProjectDefault: "Nouveau projet",
    popup_geenRecordsKopieren: "Il n'y a aucun enregistrement à copier.",
    popup_geenRecordsSamenvatten: "Il n'y a aucun enregistrement à résumer.",
    popup_bezigSamenvatten: "Résumé en cours...",
    popup_geenTekstGevonden: "Aucun texte visible trouvé sur cette page.",
    popup_tekstNietGelezen: "Impossible de lire le texte visible : ",
    popup_openBron: "Ouvrir la source",
    popup_screenshotAlt: "Capture d'écran de la page source",
    popup_samenvattenPrompt:
      "Résume la collection de textes, liens et captures d'écran ci-dessous en français. " +
      "Regroupe par thème, indique le ton (positif/critique/question), et propose une courte réponse si pertinent.",

    csv_project: "projet",
    csv_geminimaliseerd: "reduit",
    csv_type: "type",
    csv_platform: "plateforme",
    csv_datum: "date",
    csv_bron: "source",
    csv_paginatitel: "titre_page",
    csv_sitenaam: "nom_du_site",
    csv_auteur: "auteur",
    csv_gepubliceerdOp: "publie_le",
    csv_taal: "langue",
    csv_beschrijving: "description",
    csv_tekst: "texte",
    csv_screenshot: "a_capture_ecran",

    geschiedenis_titel: "Rapport d'historique",
    geschiedenis_periode: "Période",
    geschiedenis_vandaag: "Aujourd'hui",
    geschiedenis_gisteren: "Hier",
    geschiedenis_aangepast: "Période personnalisée",
    geschiedenis_vanaf: "Du",
    geschiedenis_tot: "Au",
    geschiedenis_laadKnop: "Charger l'historique",
    geschiedenis_filterPlaceholder: "Filtrer par titre ou URL...",
    geschiedenis_groepeerAuto: "Regrouper automatiquement par sujet",
    geschiedenis_groepeerTags: "Regrouper par étiquettes",
    geschiedenis_genereerRapport: "Générer un rapport pour cette sélection",
    geschiedenis_tagPlaceholder: "Étiquette (ex. Furiant, école)",
    geschiedenis_ongeldigeDatum: "Choisissez une date de début et de fin valides pour la période personnalisée.",
    geschiedenis_ladenBezig: "Chargement de l'historique...",
    geschiedenis_resultatenGeladen: "{{aantal}} résultats chargés.",
    geschiedenis_ladenMislukt: "Impossible de charger l'historique : ",
    geschiedenis_geenResultaten: "Aucun résultat. Chargez d'abord une période ou ajustez le filtre.",
    geschiedenis_aantalGeselecteerd: "{{geselecteerd}} sélectionné(s) sur {{totaal}}",
    geschiedenis_selecteerEerst: "Sélectionnez d'abord un ou plusieurs éléments.",
    geschiedenis_vulApiKeyViaPopup: "Veuillez d'abord saisir votre clé API Anthropic via la popup.",
    geschiedenis_bezigGroeperen: "Regroupement en cours...",
    geschiedenis_zonderLabel: "Sans étiquette",
    geschiedenis_onderwerpFallback: "Sujet",
    geschiedenis_rapportBezig: "Génération du rapport...",
    geschiedenis_afgekaptWaarschuwing:
      "Attention : la réponse de l'IA a été tronquée (trop d'éléments sélectionnés : {{aantal}}). " +
      "Faites une sélection plus petite ou traitez l'historique en plusieurs parties pour un résultat complet.",
    geschiedenis_rapportAfgekaptSuffix:
      "\n\n[Attention : ce rapport a été tronqué car trop d'éléments étaient sélectionnés. Faites une sélection plus petite pour un rapport complet.]",
    geschiedenis_foutGroeperen: "Erreur lors du regroupement : ",
    geschiedenis_foutRapport: "Erreur lors de la génération du rapport : ",
    geschiedenis_groepeerAutoPrompt:
      "La liste ci-dessous contient des pages web visitées (titre, URL, heure). Regroupe-les par sujet reconnaissable " +
      'et renvoie un aperçu structuré en français. Pour chaque titre, utilise exactement l\'étiquette "@@ONDERWERP@@" ' +
      "suivie du nom du sujet en français, et en dessous des lignes au format '- <heure> · <titre>'.",
    geschiedenis_rapportPrompt:
      "Voici une sélection de pages web visitées (titre, URL, heure, éventuellement une étiquette). " +
      "Rédige en français un rapport suivi sur ce qui a été consulté pendant cette période, regroupé par thème. " +
      "Écris quelques phrases par thème en texte suivi, pas une liste de chaque URL séparément.",

    menu_voegSelectie: "Ajouter le texte sélectionné à la liste de suivi",
    menu_bewaarLink: "Enregistrer ce lien dans la liste de suivi",
    menu_maakScreenshot: "Faire une capture d'écran pour la liste de suivi",
    menu_voegExtraInfo: "Ajouter la sélection comme info supplémentaire au dernier enregistrement",

    popup_extraInfoTitel: "Info supplémentaire",
    popup_verwijderExtraInfo: "Supprimer l'info supplémentaire",
    popup_verwerktLabel: "Traité",
    popup_prioriteitLabel: "Priorité (cliquer pour changer)",

    csv_verwerkt: "traite",
    csv_prioriteit: "priorite"
  }
};

function vertaal(taal, sleutel, vars) {
  const woordenboek = VERTALINGEN[taal] || VERTALINGEN.nl;
  let tekst = woordenboek[sleutel] ?? VERTALINGEN.nl[sleutel] ?? sleutel;

  if (vars) {
    for (const [naam, waarde] of Object.entries(vars)) {
      tekst = tekst.replace(new RegExp(`\\{\\{${naam}\\}\\}`, "g"), waarde);
    }
  }

  return tekst;
}

function pasVertalingenToe(taal, root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = vertaal(taal, el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = vertaal(taal, el.getAttribute("data-i18n-placeholder"));
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = vertaal(taal, el.getAttribute("data-i18n-title"));
  });
  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", vertaal(taal, el.getAttribute("data-i18n-aria-label")));
  });
  root.documentElement && (root.documentElement.lang = taal);
}

async function haalOpgeslagenTaal() {
  if (globalThis.chrome?.storage?.local) {
    const data = await chrome.storage.local.get(["taal"]);
    return data.taal || "nl";
  }
  return localStorage.getItem("preview-taal") || "nl";
}
