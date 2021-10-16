# Commandes utiles pour gérer la liste des membres MASA

## Récupérer le XML avec curl

curl 'https://montrougeplongee.com/indexXML.php' -X POST --compressed  -H 'Cookie: PHPSESSID=<>' --data-raw 'what=users'

## Fixer le XML avec ftfy

ftfy -e latin-1 -o liste\ des\ membres-ftfy.xml liste\ des\ membres.xml

## Filtres xq

`xq` est à installer avec `yq`

### Tous les actifs

.users.user | map(select(.statut == "2"))


### Tous les pN1
.users.user[] | select(.statut == "2" and (.groupes.groupe | [(.["@id"]? // .[]["@id"])] | index("5"))) | { nom, prenom, email, tel: (.mobile // .fixe) }

### Tous les pN2
.users.user[] | select(.statut == "2" and (.groupes.groupe | [(.["@id"]? // .[]["@id"])] | index("6"))) | { nom, prenom, email, tel: (.mobile // .fixe) }

#### Générer un CSV

[.nom, .prenom, .email, (.mobile // .fixe)]|@csv

### Problèmes possibles
#### Tous les actifs avec un seul groupe
.users.user[] | select(.statut == "2") | select(.groupes.groupe | length <= 1) | { nom, prenom, tel: (.mobile // .fixe) }

#### Tous les actifs sans téléphone

.users.user[] | select(.statut == "2") | select(.mobile or .fixe | not) | { nom, prenom, tel: (.mobile // .fixe) }

