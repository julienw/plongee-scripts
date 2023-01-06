# Commandes utiles pour gérer la liste des membres MASA avec Assoconnect

L'export "excel" de Assoconnect est en fait un fichier XML, ce qui permet de le
traiter avec xq. Dans cette petite doc, je garde quelques commandes utiles pour
accéder aux données.

## Filtres xq

`xq` est à installer avec `yq`

### Extraire un workbook "xls" vers json
```
.Workbook.Worksheet.Table.Row | map(.Cell | map_values(.Data | .["#text"]))
```

=> Organisé par ligne

Pour organiser par colonne, on peut ajouter `| transpose`:
```
.Workbook.Worksheet.Table.Row | map(.Cell | map_values(.Data | .["#text"])) | transpose
```

## Scripts node

Ces scripts nécessitent node v18. Installer les dépendances avec la commande
`npm ci`.

Ils prennent tous pour input l'export excel 97 de assoconnect.

### output-json.js

Ce script parse l'export pour mettre en forme un json manipulable plus
facilement.

### fetch-documents.js

Ce script va télécharger les documents des personnes qui font parties de
l'export.
