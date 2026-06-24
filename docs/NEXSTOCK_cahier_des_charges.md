# Cahier des Charges — Système de Gestion Intégré (SGI)
## Entreprise fictive : **NEXSTOCK S.A.S.**

---

## 1. PRÉSENTATION DE L'ENTREPRISE

**NEXSTOCK S.A.S.** est une entreprise fictive de distribution B2B et B2C spécialisée dans la vente de matériel électronique, informatique et accessoires. Elle opère sur le territoire français et en Europe avec :

- **3 entrepôts** : Paris (central), Lyon (régional), Bordeaux (régional)
- **~500 références produits actives** en permanence
- **~200 fournisseurs** référencés (dont 40 actifs régulièrement)
- **~2 000 clients** (entreprises et particuliers)
- **~30 employés** répartis sur les sites
- Un chiffre d'affaires fictif de 15M€/an

---

## 2. OBJECTIFS DU PROJET

Remplacer les outils disparates (tableurs Excel, logiciels métier non connectés) par une **solution web centralisée** qui gère :

- Les stocks en temps réel sur plusieurs entrepôts
- Les commandes clients (ventes) de la création à la livraison
- Les commandes fournisseurs (achats) de la demande au réapprovisionnement
- La facturation et les avoirs
- Les retours et le SAV
- Les alertes et le réapprovisionnement automatique
- La traçabilité complète (lots, numéros de série)
- Le reporting et les tableaux de bord

---

## 3. PÉRIMÈTRE FONCTIONNEL

### 3.1 MODULE PRODUITS & CATALOGUE

#### 3.1.1 Fiche produit

Chaque produit possède :

- **Référence interne** (générée automatiquement, format : `NX-[CATÉGORIE]-[SÉQUENCE]`, ex. `NX-INFO-00342`)
- **EAN-13 / code-barres** (saisie manuelle ou scan)
- **Désignation courte** (max 100 caractères) et **description longue**
- **Catégorie / sous-catégorie / famille** (arborescence 3 niveaux)
- **Marque / fabricant**
- **Référence fabricant** (différente de la référence interne)
- **Unité de mesure** (pièce, carton, lot, kg, litre…)
- **Conditionnement** : quantité par carton, poids brut, poids net, dimensions (L×l×H en cm)
- **Prix d'achat HT moyen pondéré** (calculé automatiquement, cf. règle RG-STOCK-04)
- **Prix de vente HT catalogue** + coefficient de marge minimum
- **TVA applicable** (20%, 10%, 5,5%, 0%)
- **Photos** (jusqu'à 10 images, max 5 Mo chacune)
- **Documents attachés** (fiches techniques, certifications)
- **Statut** : actif / inactif / en cours de déréférencement
- **Date de création**, **date de dernière modification**, **utilisateur modificateur**

#### 3.1.2 Variantes produits

Un produit peut avoir des **variantes** (ex. : couleur, taille, capacité). Chaque variante :

- Hérite de la fiche parent mais peut surcharger le prix, le poids, les dimensions
- Possède sa propre référence interne dérivée (`NX-INFO-00342-BLK`, `NX-INFO-00342-WHT`)
- Possède son propre stock par entrepôt

#### 3.1.3 Produits composés (kits/bundles)

Un produit peut être une **nomenclature** (kit) composé de N composants avec leurs quantités. Le stock d'un kit est calculé dynamiquement en fonction des stocks de ses composants.

**RG-PROD-01** : Un produit composé ne peut pas être lui-même composant d'un autre produit composé (pas de récursivité).

**RG-PROD-02** : La modification de la nomenclature d'un kit déjà commandé génère une alerte pour le responsable des achats.

#### 3.1.4 Produits périssables / à durée de vie limitée

Certains produits ont une **date de péremption** (ex. : piles, batteries). Le système doit gérer les lots avec DLUO/DLC.

**RG-PROD-03** : Un produit dont la DLUO est inférieure à 90 jours passe automatiquement en statut "alerte péremption". Inférieure à 30 jours : statut "péremption imminente".

---

### 3.2 MODULE GESTION DES STOCKS

#### 3.2.1 Structure multi-entrepôts / multi-emplacements

Chaque **entrepôt** est découpé en :

- **Zones** (ex. : Zone A, Zone Réfrigérée, Zone Marchandises dangereuses)
- **Allées**
- **Étagères / rayonnages**
- **Emplacements** (case précise, ex. : `PAR-A-03-05` = Paris, Allée A, Étagère 3, Emplacement 5)

Un produit peut être stocké sur **plusieurs emplacements** dans un même entrepôt (stock fragmenté).

#### 3.2.2 Types de stock

| Type | Description |
|------|-------------|
| **Stock disponible** | Quantité physiquement présente et vendable |
| **Stock réservé** | Quantité allouée à des commandes clients en attente d'expédition |
| **Stock en transit** | En cours de réception (commande fournisseur reçue partiellement) |
| **Stock bloqué** | Mis en quarantaine (contrôle qualité, litige) |
| **Stock en consignation** | Appartient à un fournisseur, stocké chez NEXSTOCK |
| **Stock virtual** | Calculé pour les kits/bundles |

**RG-STOCK-01** : Le stock disponible affiché à un client (via API ou interface) est toujours = Stock disponible − Stock réservé.

**RG-STOCK-02** : Un mouvement de stock ne peut pas rendre le stock disponible négatif, sauf autorisation explicite d'un utilisateur avec rôle "Responsable Stock" ou supérieur. Toute exception est tracée.

**RG-STOCK-03** : Tout mouvement de stock génère une **écriture de mouvement immuable** (journal de stock) avec : date/heure, produit, quantité, type de mouvement, entrepôt source/destination, utilisateur, document de référence (commande, BL, inventaire…).

#### 3.2.3 Valorisation du stock

**RG-STOCK-04 (PUMP — Prix Unitaire Moyen Pondéré)** : À chaque entrée en stock, le prix moyen pondéré est recalculé selon la formule :

```
PUMP_nouveau = (Stock_avant × PUMP_avant + Quantité_entrée × Prix_achat_entrée)
               ÷ (Stock_avant + Quantité_entrée)
```

**RG-STOCK-05** : La valorisation au PUMP est la méthode par défaut. Le système doit également permettre la valorisation **FIFO** (First In, First Out) sur activation par produit.

**RG-STOCK-06** : Toute sortie de stock génère une écriture de valorisation en utilisant le PUMP du moment de la sortie. Cette valeur est figée et non recalculée rétroactivement.

#### 3.2.4 Mouvements de stock

Types de mouvements disponibles :

| Code | Libellé | Impact stock |
|------|---------|-------------|
| ENT_ACH | Entrée sur réception commande achat | + Stock disponible |
| ENT_RET | Entrée sur retour client | + Stock disponible ou + Stock bloqué |
| ENT_INV | Régularisation inventaire positive | + Stock disponible |
| SOR_VTE | Sortie sur expédition vente | − Stock disponible |
| SOR_CAS | Sortie casse / perte | − Stock disponible |
| SOR_INV | Régularisation inventaire négative | − Stock disponible |
| TRF_INT | Transfert inter-entrepôts | − Entrepôt A / + Entrepôt B |
| TRF_EMP | Transfert inter-emplacements | Même entrepôt |
| BLQ | Mise en quarantaine | − Disponible / + Bloqué |
| DBL | Levée de quarantaine | + Disponible / − Bloqué |

#### 3.2.5 Inventaires

Le système permet de réaliser des inventaires :

- **Inventaire général** : tous les produits de tous les entrepôts à une date donnée
- **Inventaire tournant** : sélection d'une zone / catégorie / liste de produits
- **Inventaire permanent** : comptage aléatoire quotidien d'un échantillon

**RG-INV-01** : Lors d'un inventaire, le stock est gelé (lecture seule) pour les produits concernés à partir de la création de la session d'inventaire. Les mouvements en cours sont mis en attente.

**RG-INV-02** : L'inventaire doit être validé par un responsable habilité. Tout écart > 2% en valeur sur une ligne déclenche une double vérification obligatoire.

**RG-INV-03** : Après validation, les écarts sont comptabilisés automatiquement avec le type de mouvement `ENT_INV` ou `SOR_INV` et une justification obligatoire.

#### 3.2.6 Alertes de stock

**RG-STOCK-07 (Seuil d'alerte)** : Chaque produit peut avoir un **seuil d'alerte** (stock minimum) et un **seuil critique** définis par entrepôt. Quand le stock disponible passe sous le seuil d'alerte, une notification est envoyée au responsable achats. Sous le seuil critique, une suggestion de réapprovisionnement automatique est créée.

**RG-STOCK-08 (Stock de sécurité)** : Calculé automatiquement selon la formule :

```
Stock_sécurité = (Délai_livraison_max − Délai_livraison_moyen) × Consommation_journalière_moyenne
```

**RG-STOCK-09 (Quantité économique de commande — EOQ)** : Le système calcule et suggère la quantité optimale à commander selon la formule de Wilson :

```
EOQ = √(2 × Demande_annuelle × Coût_passation_commande / Coût_stockage_unitaire_annuel)
```

**RG-STOCK-10 (Délai de réapprovisionnement)** : Le système calcule un **point de commande** :

```
Point_commande = (Consommation_journalière_moyenne × Délai_livraison_fournisseur_en_jours) + Stock_sécurité
```

---

### 3.3 MODULE FOURNISSEURS

#### 3.3.1 Fiche fournisseur

- **Code fournisseur** (généré automatiquement, format : `FOUR-[SÉQUENCE]`)
- Raison sociale, forme juridique, SIRET, numéro TVA intracommunautaire
- Adresses : siège social, facturation, livraison (multiples adresses possibles)
- Contacts multiples avec rôles (commercial, comptabilité, SAV, logistique)
- **Conditions commerciales** : délai de paiement (30j, 45j, 60j, 30j fin de mois…), remise globale, franco de port (montant minimum de commande)
- **Devises** acceptées (EUR, USD, GBP, CHF…) et taux de change de référence
- **Délai de livraison moyen** (en jours ouvrés) par catégorie de produit
- **Score qualité** (calculé automatiquement sur la base des retards, litiges, non-conformités)
- **Catalogue fournisseur** : association produits ↔ fournisseur avec référence fournisseur, prix tarif, prix négocié, quantité minimum de commande (QMC), conditionnement

#### 3.3.2 Multi-fournisseurs par produit

**RG-FOUR-01** : Un produit peut avoir plusieurs fournisseurs. L'un est désigné **fournisseur principal**, les autres sont **fournisseurs alternatifs** avec un rang de priorité.

**RG-FOUR-02** : Lors d'une suggestion de réapprovisionnement, le système propose automatiquement le fournisseur principal. Si celui-ci est en rupture ou en délai anormal, le fournisseur alternatif de rang 1 est proposé.

**RG-FOUR-03** : Le score qualité fournisseur est calculé sur 100 points :

- Taux de livraison dans les délais × 40
- Taux de conformité produit × 30
- Taux de litiges résolus favorablement × 20
- Réactivité SAV (délai moyen réponse) × 10

---

### 3.4 MODULE ACHATS (COMMANDES FOURNISSEURS)

#### 3.4.1 Cycle de vie d'une commande achat

```
BROUILLON → VALIDÉE → ENVOYÉE → CONFIRMÉE_FOUR → EN_TRANSIT → REÇUE_PARTIELLE → REÇUE_TOTALE → CLÔTURÉE
                                                                              ↘ LITIGE
                              ↘ ANNULÉE (avant ENVOYÉE uniquement)
```

**RG-ACH-01** : Une commande achat passe de BROUILLON à VALIDÉE uniquement après approbation d'un utilisateur habilité selon le montant :

- < 500€ HT : validation par Responsable achats (niveau 1)
- 500€ à 5 000€ HT : validation par Directeur achats (niveau 2)
- > 5 000€ HT : validation par Directeur général (niveau 3)

**RG-ACH-02** : Une commande achat ne peut pas être annulée si elle est en statut EN_TRANSIT ou supérieur. Un workflow de litige doit être ouvert.

**RG-ACH-03 (Tolérance de réception)** : Une commande est considérée REÇUE_TOTALE si la quantité reçue est comprise entre 95% et 105% de la quantité commandée. En dehors de cette tolérance, une alerte est déclenchée.

#### 3.4.2 Bon de commande (BC)

Le BC généré en PDF contient :

- Numéro de BC (format : `BC-AAAA-MM-NNNNN`)
- Coordonnées NEXSTOCK et fournisseur
- Adresse de livraison
- Tableau des lignes : référence interne, référence fournisseur, désignation, quantité, UdM, prix unitaire HT, remise, montant HT
- Sous-total HT, remise globale, TVA par taux, **Total TTC**
- Conditions de paiement, délai de livraison demandé
- Mentions légales

#### 3.4.3 Réception de marchandises

Lors de la réception :

1. Scanner ou saisir le numéro de BC
2. Saisir les quantités reçues ligne par ligne (avec possibilité de réception partielle)
3. Affecter à un emplacement de stockage
4. Saisir les numéros de lot et/ou numéros de série si applicable
5. Saisir la DLUO si produit périssable
6. Signer le bon de livraison fournisseur (signature électronique ou visa)

**RG-ACH-04** : À la validation de la réception, le stock est mis à jour immédiatement et de manière irréversible. Une correction ultérieure nécessite un mouvement de régularisation tracé.

**RG-ACH-05 (Contrôle qualité)** : Un échantillon de 5% des unités reçues (min 1, max 10) doit être mis en stock bloqué pour contrôle qualité. Si aucune anomalie constatée dans les 48h, ils passent automatiquement en stock disponible.

**RG-ACH-06** : Si la quantité reçue est inférieure à 95% de la quantité commandée, le reliquat reste ouvert et une relance automatique est programmée J+3 puis J+7.

#### 3.4.4 Facturation fournisseur (rapprochement)

**RG-ACH-07 (Rapprochement 3 voies)** : Toute facture fournisseur doit être rapprochée avec :

1. La commande achat correspondante
2. Le bon de réception correspondant

- Écart de prix toléré : ≤ 1% (sinon alerte et blocage)
- Écart de quantité : 0 (la facture ne peut pas dépasser la réception)

---

### 3.5 MODULE CLIENTS

#### 3.5.1 Fiche client

- **Code client** (format : `CLI-[TYPE]-[SÉQUENCE]`, ex. `CLI-PRO-01234` ou `CLI-PAR-00891`)
- **Type** : Professionnel (B2B) ou Particulier (B2C)
- Raison sociale / Nom Prénom, SIRET (si B2B), numéro TVA intracommunautaire
- Adresses multiples : facturation + livraisons (illimitées)
- Contacts multiples avec rôles
- **Conditions commerciales** : conditions de paiement, remise client, encours autorisé
- **Historique** : CA réalisé N, N-1, N-2 ; nombre de commandes ; taux de retour ; taux de litiges
- **Classement RFM** (Récence, Fréquence, Montant) calculé automatiquement
- **Groupe de prix** : Standard, Revendeur, Grand Compte, VIP
- **Représentant commercial** assigné
- Statut : actif / inactif / bloqué (recouvrement) / prospect

**RG-CLI-01** : Un client en statut "bloqué" ne peut pas passer de nouvelle commande. Une alerte est affichée à chaque tentative.

**RG-CLI-02 (Encours client)** : L'encours d'un client = somme des factures non réglées. Quand l'encours dépasse 80% du plafond autorisé, une alerte est envoyée au commercial. À 100%, toute nouvelle commande nécessite une autorisation du responsable financier.

---

### 3.6 MODULE VENTES (COMMANDES CLIENTS)

#### 3.6.1 Cycle de vie d'une commande vente

```
DEVIS → COMMANDE → PRÉPARATION → EXPÉDITION → LIVRÉE → FACTURÉE → RÉGLÉE
          ↓                                        ↓
       ANNULÉE                               RETOUR_PARTIEL / RETOUR_TOTAL
```

**RG-VTE-01** : Un devis a une durée de validité de **30 jours** par défaut (configurable par client). À expiration, le devis passe automatiquement en statut "EXPIRÉ" et ne peut plus être transformé en commande sans recréation.

**RG-VTE-02** : La transformation d'un devis en commande vérifie automatiquement :

- Disponibilité du stock (alerte si rupture)
- Statut du client (bloqué ?)
- Encours client (dépassement ?)
- Prix de vente ≥ prix minimum autorisé (marge minimale)

**RG-VTE-03 (Réservation de stock)** : Lors de la confirmation d'une commande, les quantités commandées sont **réservées immédiatement** dans le stock. La réservation est libérée en cas d'annulation.

**RG-VTE-04 (Gestion des ruptures)** : Si un produit est en rupture lors de la prise de commande :

- Option 1 : Commande en attente partielle (les lignes disponibles partent, les autres en attente)
- Option 2 : Livraison complète différée (toute la commande attend la disponibilité)
- Option 3 : Proposition d'un produit de substitution

Le client choisit l'option via notification email avec lien de confirmation.

**RG-VTE-05** : Une commande ne peut pas être annulée si elle est en statut EXPÉDITION ou supérieur. Un retour doit être initié.

#### 3.6.2 Tarification et remises

**RG-PRIX-01 (Cascade de prix)** : Le prix de vente appliqué est déterminé dans cet ordre de priorité (le plus spécifique l'emporte) :

1. Prix promotionnel actif sur la période
2. Prix contractuel client-produit
3. Prix groupe de prix du client pour la catégorie produit
4. Prix catalogue de base

**RG-PRIX-02 (Remises cumulables)** : Les remises s'appliquent en cascade (non additivement) :

```
Prix_final = Prix_catalogue × (1 − remise_client) × (1 − remise_quantité) × (1 − remise_promo)
```

**RG-PRIX-03 (Marge minimale)** : Le prix de vente ne peut pas être inférieur au PUMP × (1 + taux_marge_minimum_catégorie). Le taux minimum est configurable par catégorie. Une dérogation nécessite une validation manager.

**RG-PRIX-04 (Remises quantitatives — paliers)** : Chaque produit peut avoir une grille de remises par palier de quantité :

| Quantité | Remise |
|----------|--------|
| 1–9 | 0% |
| 10–49 | 3% |
| 50–99 | 5% |
| 100+ | 8% |

#### 3.6.3 Préparation de commande

Le système génère un **bon de préparation** (picking list) optimisé par emplacement (tri par allée pour minimiser les déplacements). La préparation est validée article par article avec scan code-barres.

**RG-PREP-01** : Si plusieurs commandes utilisent les mêmes produits dans la même période (ex. : même journée), le système peut proposer un **picking groupé** (wave picking) puis un tri par commande.

**RG-PREP-02** : Un produit ne peut être prélevé que depuis un emplacement dont le stock disponible (non bloqué, non réservé pour une autre commande prioritaire) est suffisant.

#### 3.6.4 Expédition

L'expédition génère un **bon de livraison (BL)** et déclenche :

- La sortie de stock définitive
- La mise à jour du statut de commande
- L'envoi d'une notification email au client avec numéro de suivi
- La création d'une facture (si facturation à l'expédition) ou d'un en-cours de facturation

**RG-EXP-01** : Le transporteur, le mode d'expédition (standard, express, retrait en entrepôt) et le coût de port sont définis à la commande et figés à l'expédition.

**RG-EXP-02** : Le franco de port est appliqué si le montant HT de la commande ≥ seuil configuré par groupe de clients.

---

### 3.7 MODULE FACTURATION

#### 3.7.1 Factures de vente

**RG-FACT-01** : Une facture est **immuable** une fois émise. Toute correction passe obligatoirement par un **avoir** (total ou partiel).

**RG-FACT-02 (Numérotation)** : Les factures sont numérotées séquentiellement sans rupture, par exercice fiscal : `FACT-AAAA-NNNNN`. Il est interdit de créer un trou dans la séquence.

**RG-FACT-03** : Une facture peut regrouper plusieurs bons de livraison d'un même client (facturation différée mensuelle, hebdomadaire, ou à chaque BL selon paramétrage client).

**RG-FACT-04 (Mentions légales obligatoires)** : Toute facture doit mentionner :

- Date d'émission et date de livraison des biens/services
- Numéro de TVA du vendeur et de l'acheteur (si B2B)
- Conditions de paiement et date d'échéance
- Taux et montant de pénalités de retard (légal : taux BCE + 10 points, min. 40€ d'indemnité de recouvrement)
- Escompte pour paiement anticipé (si applicable)

#### 3.7.2 Avoirs

**RG-AVO-01** : Un avoir doit toujours référencer la facture d'origine. Il ne peut pas dépasser le montant de la facture d'origine.

**RG-AVO-02** : Un avoir peut être :

- **Remboursé** (virement au client)
- **Imputé** sur une prochaine facture
- **Converti en bon d'achat** (avec accord client)

#### 3.7.3 Suivi des règlements

**RG-REGL-01** : Les modes de règlement acceptés : virement bancaire, chèque, carte bancaire (via module paiement), prélèvement SEPA, espèces (B2C uniquement, max 1 000€ légal).

**RG-REGL-02 (Relances automatiques)** :

- J+1 après échéance : email de rappel automatique
- J+8 : email de relance avec PDF facture en pièce jointe
- J+15 : email de mise en demeure + alerte au responsable financier
- J+30 : passage en contentieux (statut client = bloqué)

**RG-REGL-03** : Les pénalités de retard sont calculées automatiquement à J+1 après l'échéance. Elles sont incluses dans la mise en demeure.

---

### 3.8 MODULE RETOURS & SAV

#### 3.8.1 Retours clients (RMA — Return Merchandise Authorization)

**RG-RET-01** : Tout retour nécessite un numéro RMA généré par le système. Un colis sans RMA est refusé à la réception.

**RG-RET-02 (Délais)** :

- B2C : 14 jours légaux (droit de rétractation) + 30 jours commerciaux
- B2B : 30 jours contractuels (selon contrat cadre)
- Garantie légale défaut : 2 ans (produits neufs)

**RG-RET-03 (Motifs de retour)** et leur traitement :

| Motif | Stock destination | Action financière |
|-------|------------------|-------------------|
| Rétractation (B2C) | Disponible (si neuf) ou Bloqué (contrôle) | Avoir total |
| Produit défectueux | Bloqué → SAV | Avoir total ou échange |
| Erreur de commande (NEXSTOCK) | Disponible | Avoir total + prise en charge retour |
| Erreur de commande (client) | Disponible (si état neuf) | Avoir sous déduction 15% restockage |
| Non conforme à la commande | Bloqué | Avoir total |
| Casse transport | Bloqué | Déclaration sinistre transporteur |

**RG-RET-04** : Lors de la réception d'un retour, une **inspection qualité** obligatoire est effectuée :

- État : neuf, très bon état, bon état, endommagé, inutilisable
- Selon l'état, le produit est réintégré en stock disponible, en stock outlet (prix réduit), ou mis au rebut.

#### 3.8.2 Retours fournisseurs

**RG-RETF-01** : Un retour fournisseur est initié depuis une réception de commande achat. Il génère un **bon de retour fournisseur** et une **note de débit** ou une demande d'avoir.

---

### 3.9 MODULE PROMOTIONS & TARIFS SPÉCIAUX

**RG-PROMO-01** : Les promotions sont définies avec :

- Type : remise en %, remise en montant fixe, prix remplacé (prix promo direct), offre quantitative (3+1 gratuit, 2 achetés = 3ème à -50%)
- Périmètre : tous produits / catégorie / liste de produits
- Périmètre client : tous clients / groupe / liste de clients
- Dates de début et fin avec heure précise
- Cumulabilité avec d'autres remises (oui/non)
- Plafond d'utilisation (nombre maximal d'utilisations)

**RG-PROMO-02** : Le moteur promotionnel évalue toutes les promotions applicables à une ligne de commande et applique la plus avantageuse (ou les combine si cumulables). Le détail des remises appliquées est affiché sur le devis/commande.

---

### 3.10 MODULE TRANSFERTS INTER-ENTREPÔTS

**RG-TRF-01** : Un transfert inter-entrepôts suit le cycle :

```
DEMANDE → APPROUVÉ → EN_PRÉPARATION → EXPÉDIÉ → REÇU → CLÔTURÉ
```

**RG-TRF-02** : Pendant le transit (statut EXPÉDIÉ), les quantités concernées sont en **stock en transit** : ni disponibles dans l'entrepôt source, ni encore dans l'entrepôt destination.

**RG-TRF-03** : Un transfert peut être partiel. Les quantités non encore expédiées restent en stock dans l'entrepôt source.

**RG-TRF-04** : Le coût de transfert (transport interne) est saisi et impacte la valorisation du stock dans l'entrepôt destination :

```
Nouveau_PUMP_destination = (PUMP_source × Qté + Coût_transport) / Qté
```

---

### 3.11 MODULE REPORTING & TABLEAUX DE BORD

#### 3.11.1 Tableaux de bord temps réel

**Dashboard Dirigeant** :

- CA du jour / semaine / mois / année avec comparatif N-1
- Marge brute et taux de marge
- Nombre de commandes en cours par statut
- Top 10 produits vendus (en volume et en valeur)
- Alertes actives (stocks critiques, factures en retard, litiges ouverts)
- Carte de chaleur des ventes par région

**Dashboard Stock** :

- Valeur totale du stock par entrepôt
- Taux de rotation des stocks (rotation = CA / stock moyen)
- Produits en rupture / sous seuil d'alerte
- Produits à rotation nulle depuis > 90 jours (stocks dormants)
- Taux d'occupation des emplacements par entrepôt

**Dashboard Achats** :

- Commandes en attente de réception
- Retards fournisseurs (livraison dépassant la date promise)
- Budget achats consommé vs. prévisionnel
- Performance fournisseurs (score qualité, taux de service)

**Dashboard Commercial** :

- Pipeline des devis (en attente de confirmation)
- Taux de conversion devis → commande
- Encours clients et factures échues
- Performance par commercial (CA, marge, nombre de commandes)

#### 3.11.2 Rapports exportables

Tous les rapports sont exportables en **PDF**, **Excel (.xlsx)** et **CSV**.

| Rapport | Fréquence disponible | Description |
|---------|---------------------|-------------|
| État des stocks | Temps réel / J | Stocks par produit, entrepôt, emplacement, valorisation |
| Mouvements de stock | Période personnalisable | Journal complet des mouvements |
| Inventaire de valorisation | Mensuel / Annuel | Bilan des stocks valorisés (PUMP) |
| Chiffre d'affaires | Jour/Semaine/Mois/Trimestre/Année | Par produit, catégorie, client, commercial |
| Marges | Même grain que CA | Taux de marge par ligne |
| Achats | Période personnalisable | Par fournisseur, produit, catégorie |
| Retards fournisseurs | Mensuel | Analyse des retards avec impact |
| Taux de service client | Mensuel | % commandes livrées dans les délais |
| Analyse ABC | Trimestriel/Annuel | Classification produits par contribution au CA |
| Rotation des stocks | Mensuel | Rotation et couverture en jours par produit |
| Balance âgée clients | Hebdomadaire | Créances par tranche d'âge |
| Balance âgée fournisseurs | Hebdomadaire | Dettes par tranche d'âge |

#### 3.11.3 Analyse ABC-XYZ

**RG-REP-01** : Le système réalise automatiquement une **analyse ABC** :

- Classe A : 20% des produits représentant 80% du CA
- Classe B : 30% des produits représentant 15% du CA
- Classe C : 50% des produits représentant 5% du CA

**RG-REP-02** : Croisée avec l'analyse **XYZ** (prévisibilité de la demande) :

- X : demande régulière et prévisible (CV < 0,25)
- Y : demande variable (CV entre 0,25 et 0,5)
- Z : demande irrégulière ou saisonnière (CV > 0,5)

*(CV = Coefficient de variation = écart-type / moyenne)*

---

### 3.13 MODULE LOGISTIQUE FLOTTE

#### 3.13.1 Fiche véhicule

Chaque véhicule de la flotte possède :

- **Immatriculation** (clé unique, ex. `AB-123-CD`)
- **Type** : camionnette, camion porteur, semi-remorque, utilitaire léger
- **Marque / modèle / année**
- **Charge utile** (kg) et **volume utile** (m³)
- **Dimensions intérieures** (L×l×H en cm) et **capacité palettes**
- **Entrepôt de rattachement** (base logistique du véhicule)
- **Kilométrage courant**
- **Type de carburant** : diesel, essence, électrique, hybride
- **Statut** : disponible / en mission / en maintenance / hors service
- **Date de dernière maintenance** et **prochaine maintenance prévue**

#### 3.13.2 Fiche conducteur

Chaque chauffeur possède :

- **Lien optionnel vers un compte utilisateur** (si employé interne)
- **Numéro de matricule employé**
- **Type de permis** (B, C, CE, C1E…) et **numéro de permis**
- **Date d'expiration du permis**
- **Entrepôt de rattachement**
- **Statut** : actif / en congé / indisponible

#### 3.13.3 Missions de transport

Une mission de transport planifie et trace un trajet physique d'un véhicule de la flotte interne.

**Types de missions :**

| Type | Description |
|------|-------------|
| `TRANSFER` | Transport d'un transfert inter-entrepôts |
| `DELIVERY` | Livraison client directe par véhicule propre |
| `PICKUP` | Enlèvement chez un fournisseur |

**Cycle de vie d'une mission :**

```
PLANIFIÉE → CONFIRMÉE → EN_COURS → TERMINÉE
                ↘ ANNULÉE
```

Une mission peut transporter plusieurs documents (transferts, expéditions, réceptions) regroupés dans ses items.

#### 3.13.4 Maintenance de la flotte

Le système trace l'historique complet des maintenances (révisions, réparations, contrôles techniques) avec kilométrage, coûts et prestataire. Des alertes automatiques sont générées avant les échéances.

**Règles de gestion :**

**RG-LOG-01** : Un véhicule ne peut pas être affecté à deux missions dont les plages horaires se chevauchent.

**RG-LOG-02** : Le poids total de la mission ne peut pas dépasser la charge utile du véhicule. Une alerte est déclenchée si le volume ou le nombre de palettes dépasse la capacité. L'affectation reste possible avec validation explicite d'un responsable logistique.

**RG-LOG-03** : Un véhicule dont le statut est "en maintenance" ou "hors service" ne peut pas être affecté à une mission.

**RG-LOG-04** : À la clôture d'une mission de type `TRANSFER`, le coût de transport réel (carburant + péages) est automatiquement reporté dans `transfers.transport_cost`, déclenchant le recalcul du PUMP destination (RG-TRF-04).

**RG-LOG-05** : Lors de l'affectation d'un conducteur, le système vérifie que son permis est valide (non expiré) et de niveau suffisant pour le type de véhicule. Toute affectation avec permis expiré est bloquée.

**RG-LOG-06** : À la clôture d'une mission, la distance parcourue est saisie et le kilométrage du véhicule est mis à jour. Si le kilométrage atteint le seuil de prochaine maintenance, une alerte est envoyée au responsable logistique.

#### 3.13.5 Tableau de bord Logistique

- Disponibilité de la flotte en temps réel (véhicules disponibles / en mission / en maintenance)
- Planning des missions du jour et de la semaine (vue calendrier)
- Véhicules avec maintenance imminente (< 1 000 km ou < 30 jours)
- Coûts de transport interne par période (carburant, péages, maintenance)
- Taux d'utilisation de la flotte (heures en mission / heures disponibles)

---

### 3.12 MODULE UTILISATEURS & DROITS

#### 3.12.1 Rôles prédéfinis

| Rôle | Description |
|------|-------------|
| Super Admin | Accès total, configuration système |
| Directeur Général | Lecture totale + validation niveau 3 |
| Responsable Financier | Module facturation + recouvrement + validation encours |
| Directeur Achats | Module achats complet + validation niveau 2 |
| Responsable Achats | Module achats opérationnel + validation niveau 1 |
| Responsable Stock | Module stock complet + inventaires |
| Magasinier | Réceptions, expéditions, mouvements de stock |
| Responsable Commercial | Module ventes complet + gestion clients |
| Commercial | Gestion de son portefeuille clients + devis/commandes |
| Gestionnaire SAV | Module retours + litiges |
| Responsable Logistique | Gestion flotte véhicules, planification missions, suivi maintenances |
| Lecteur | Lecture seule sur tous les modules |

#### 3.12.2 Règles de droits

**RG-USR-01** : Chaque action dans le système est contrôlée par une **permission** (lecture, création, modification, validation, suppression logique). Les permissions sont attribuées par rôle et peuvent être affinées individuellement par utilisateur.

**RG-USR-02** : Toute action sensible (validation de commande, modification de prix, régularisation stock) est tracée dans un **journal d'audit** avec : utilisateur, date/heure, action, objet modifié, valeur avant, valeur après.

**RG-USR-03** : La séparation des tâches (SoD) doit être respectée : un utilisateur ne peut pas être à la fois créateur et validateur d'un même document.

**RG-USR-04** : Authentification : login/mot de passe avec politique de sécurité (min 12 caractères, complexité, expiration 90 jours) + **2FA obligatoire** pour les rôles Directeur et supérieur.

---

## 4. RÈGLES DE GESTION TRANSVERSALES

**RG-GEN-01 (Suppression logique)** : Aucun élément du système (produit, client, fournisseur, commande, mouvement) n'est jamais supprimé physiquement. Tout archivage est une suppression logique avec date et utilisateur.

**RG-GEN-02 (Archivage)** : Les documents comptables (factures, avoirs, BL) sont archivés pendant **10 ans** conformément aux obligations légales françaises.

**RG-GEN-03 (Cohérence des exercices)** : Un exercice fiscal clôturé ne peut plus être modifié. Les corrections se font sur l'exercice en cours.

**RG-GEN-04 (Devises)** : Toutes les transactions sont saisies en devise de facturation. La comptabilité est toujours en EUR. La conversion utilise le taux de change du jour de la transaction, figé à la création.

**RG-GEN-05 (Arrondis)** : Les calculs de prix et TVA utilisent 2 décimales pour l'affichage, mais 6 décimales en interne pour éviter les erreurs d'arrondi cumulatives. La TVA est calculée sur le total HT de la ligne (non sur chaque unité).

**RG-GEN-06 (Temps réel)** : Toute modification de stock, commande, ou solde client/fournisseur doit être reflétée dans les tableaux de bord en moins de **5 secondes**.

**RG-GEN-07 (Notifications)** : Le système envoie des notifications via :

- Email (pour tout acteur interne ou externe)
- Notification push dans l'interface web (pour les utilisateurs connectés)
- SMS (optionnel, pour alertes critiques uniquement : stock zéro, retard critique)

---

## 5. EXIGENCES NON FONCTIONNELLES

### 5.1 Performance

- Temps de réponse < 500ms pour 95% des requêtes
- Support de **50 utilisateurs simultanés** sans dégradation
- Capacité à gérer **10 000 commandes/mois** et **1 000 mouvements de stock/jour**

### 5.2 Disponibilité & Résilience

- Disponibilité cible : **99,5%** (hors maintenance planifiée)
- Sauvegarde automatique complète quotidienne (rétention 30 jours)
- Sauvegarde incrémentale toutes les heures
- Plan de reprise d'activité (RTO : 4h, RPO : 1h)

### 5.3 Sécurité

- Toutes les communications chiffrées en **TLS 1.3**
- Données sensibles chiffrées au repos (AES-256)
- Journaux d'accès et d'audit conservés **5 ans**
- Tests de pénétration annuels
- Conformité **RGPD** : consentement, droit à l'oubli (données clients B2C), portabilité

### 5.4 Accessibilité & UX

- Interface **responsive** (desktop, tablette, mobile)
- Interface **offline partielle** pour les magasiniers (scan et préparation sans connexion, synchronisation à la reconnexion)
- Support **lecteur de code-barres USB et Bluetooth**
- Accessibilité **WCAG 2.1 niveau AA**
- Support multilingue : **FR** (par défaut), EN, ES

---

## 6. ARCHITECTURE TECHNIQUE SUGGÉRÉE

### 6.1 Stack recommandée

| Couche | Technologie suggérée |
|--------|---------------------|
| Frontend | **Nuxt.js** (ou React 18+), TypeScript, TailwindCSS |
| Backend | **AdonisJS**** |
| Base de données | **PostgreSQL 15+** (principal) + Redis (cache & sessions) |
| Moteur de recherche | **PostgreSQL** (`pg_trgm` + `tsvector` — recherche full-text native) |
| File de messages | **RabbitMQ** ou **Kafka** (événements stock, notifications) |
| Stockage fichiers | **MinIO** (self-hosted S3-compatible) |
| Génération PDF | **Puppeteer** ou **WeasyPrint** |
| Authentification | **JWT + OAuth2** (Keycloak ou implémentation native) |
| Déploiement | **Docker + Kubernetes** (ou Docker Compose pour dev) |
| CI/CD | **GitHub Actions** ou **GitLab CI** |
| Monitoring | **Prometheus + Grafana** |
| Analytics | **PostHog** |

### 6.2 Architecture générale

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser / Mobile)          │
└─────────────────────────┬───────────────────────────┘
                           │ HTTPS
┌─────────────────────────▼───────────────────────────┐
│                   API Gateway / Nginx                │
│           (rate limiting, auth, load balancing)      │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
┌──────▼──┐ ┌────▼────┐ ┌───▼───┐ ┌───▼──────┐
│ Stock   │ │  Ventes │ │Achats │ │Reporting │  ...microservices
│ Service │ │ Service │ │Service│ │ Service  │
└──────┬──┘ └────┬────┘ └───┬───┘ └──────────┘
       │         │           │
┌──────▼─────────▼───────────▼──────────────────────┐
│              Message Bus (RabbitMQ)                  │
└───────────────────────────────────────────────────┘
       │         │           │
┌──────▼──┐ ┌────▼────┐ ┌───▼──────────────────────┐
│Postgres │ │  Redis  │ │    PostgreSQL FTS          │
└─────────┘ └─────────┘ └──────────────────────────┘
```

### 6.3 API REST & Webhooks

- API REST documentée **OpenAPI 3.0 (Swagger)**
- Versioning : `/api/v1/...`
- **Webhooks** configurables par client : événement commande confirmée, expédiée, stock sous seuil

---

## 7. PHASES DE DÉVELOPPEMENT SUGGÉRÉES

### Phase 1 — MVP (4–6 mois)

- Authentification & gestion des utilisateurs
- Catalogue produits (sans variantes ni kits)
- Gestion des stocks mono-entrepôt
- Commandes ventes (DEVIS → FACTURÉE)
- Commandes achats (BC → RÉCEPTION)
- Facturation simple

### Phase 2 — Consolidation (3–4 mois)

- Multi-entrepôts et transferts
- Variantes produits et kits/nomenclatures
- Module retours & SAV
- Gestion des fournisseurs avancée (multi-four, score qualité)
- Inventaires

### Phase 3 — Avancé (3–4 mois)

- Module promotions complet
- Reporting avancé et tableaux de bord
- Analyse ABC-XYZ
- Réapprovisionnement automatique (EOQ, point de commande)
- Traçabilité lots et numéros de série
- 2FA & audit renforcé

### Phase 4 — Excellence (continu)

- Application mobile (PWA ou native)
- Mode offline magasiniers
- Intégration transporteurs (API Chronopost, Colissimo…)
- Connecteur comptabilité (export FEC, intégration Sage/Cegid)
- EDI fournisseurs

---

## 8. CONTRAINTES LÉGALES & RÉGLEMENTAIRES

- **NF Z42-020** : Archivage des documents comptables (valeur probante)
- **Loi Antifraude TVA (2018)** : Le logiciel de caisse doit être certifié (si vente B2C avec règlement immédiat)
- **RGPD** : Minimisation des données, durées de conservation définies, DPO désigné
- **Code de commerce** : Conservation des documents comptables 10 ans, factures commerciales 10 ans
- **Loi Pacte 2019** : Facturation électronique B2B obligatoire (déploiement progressif — e-invoicing obligatoire)

---

## 9. RÉCAPITULATIF DES RÈGLES DE GESTION

| ID | Module | Intitulé court |
|----|--------|----------------|
| RG-PROD-01 | Produits | Pas de récursivité dans les kits |
| RG-PROD-02 | Produits | Alerte modification nomenclature kit commandé |
| RG-PROD-03 | Produits | Alerte DLUO < 90j et < 30j |
| RG-STOCK-01 | Stock | Stock affiché = disponible − réservé |
| RG-STOCK-02 | Stock | Interdiction stock négatif sans habilitation |
| RG-STOCK-03 | Stock | Journal de mouvement immuable |
| RG-STOCK-04 | Stock | Calcul PUMP à chaque entrée |
| RG-STOCK-05 | Stock | PUMP par défaut, FIFO optionnel par produit |
| RG-STOCK-06 | Stock | Valeur de sortie figée au PUMP du moment |
| RG-STOCK-07 | Stock | Seuils d'alerte et critique par produit/entrepôt |
| RG-STOCK-08 | Stock | Calcul automatique stock de sécurité |
| RG-STOCK-09 | Stock | Calcul EOQ (formule de Wilson) |
| RG-STOCK-10 | Stock | Calcul point de commande |
| RG-INV-01 | Inventaire | Gel du stock lors d'un inventaire |
| RG-INV-02 | Inventaire | Double vérification si écart > 2% |
| RG-INV-03 | Inventaire | Justification obligatoire des écarts |
| RG-FOUR-01 | Fournisseurs | Fournisseur principal + alternatifs classés |
| RG-FOUR-02 | Fournisseurs | Bascule automatique sur alternatif si rupture |
| RG-FOUR-03 | Fournisseurs | Score qualité sur 100 points |
| RG-ACH-01 | Achats | Validation à 3 niveaux selon montant |
| RG-ACH-02 | Achats | Annulation impossible si EN_TRANSIT |
| RG-ACH-03 | Achats | Tolérance réception ±5% |
| RG-ACH-04 | Achats | Mise à jour stock immédiate et irréversible |
| RG-ACH-05 | Achats | Échantillon 5% en contrôle qualité 48h |
| RG-ACH-06 | Achats | Relance automatique J+3 et J+7 si reliquat |
| RG-ACH-07 | Achats | Rapprochement 3 voies (BC + réception + facture) |
| RG-CLI-01 | Clients | Blocage commande si client bloqué |
| RG-CLI-02 | Clients | Alerte à 80% encours, blocage à 100% |
| RG-VTE-01 | Ventes | Devis valide 30 jours |
| RG-VTE-02 | Ventes | Vérifications automatiques devis → commande |
| RG-VTE-03 | Ventes | Réservation stock à la confirmation |
| RG-VTE-04 | Ventes | 3 options client en cas de rupture |
| RG-VTE-05 | Ventes | Annulation impossible si EXPÉDITION |
| RG-PRIX-01 | Prix | Cascade de prix (4 niveaux) |
| RG-PRIX-02 | Prix | Remises en cascade (non additives) |
| RG-PRIX-03 | Prix | Marge minimale par catégorie |
| RG-PRIX-04 | Prix | Grilles de remises quantitatives |
| RG-PREP-01 | Préparation | Wave picking si commandes groupées |
| RG-PREP-02 | Préparation | Prélèvement depuis stock réellement disponible |
| RG-EXP-01 | Expédition | Transporteur et coût figés à l'expédition |
| RG-EXP-02 | Expédition | Franco de port selon seuil groupe client |
| RG-FACT-01 | Facturation | Facture immuable, correction par avoir |
| RG-FACT-02 | Facturation | Numérotation séquentielle sans rupture |
| RG-FACT-03 | Facturation | Facturation différée multi-BL |
| RG-FACT-04 | Facturation | Mentions légales obligatoires |
| RG-AVO-01 | Avoirs | Avoir référencé à la facture origine |
| RG-AVO-02 | Avoirs | 3 modes d'utilisation d'un avoir |
| RG-REGL-01 | Règlements | Modes de règlement acceptés |
| RG-REGL-02 | Règlements | Relances automatiques J+1/J+8/J+15/J+30 |
| RG-REGL-03 | Règlements | Pénalités calculées automatiquement |
| RG-RET-01 | Retours | RMA obligatoire |
| RG-RET-02 | Retours | Délais légaux et commerciaux |
| RG-RET-03 | Retours | Traitement selon motif de retour |
| RG-RET-04 | Retours | Inspection qualité obligatoire |
| RG-RETF-01 | Retours | Retour fournisseur depuis réception |
| RG-PROMO-01 | Promotions | Définition complète d'une promotion |
| RG-PROMO-02 | Promotions | Moteur promotionnel : meilleure offre |
| RG-TRF-01 | Transferts | Cycle de vie transfert inter-entrepôts |
| RG-TRF-02 | Transferts | Stock en transit pendant le transport |
| RG-TRF-03 | Transferts | Transfert partiel autorisé |
| RG-TRF-04 | Transferts | Coût de transfert impacte le PUMP destination |
| RG-REP-01 | Reporting | Analyse ABC automatique |
| RG-REP-02 | Reporting | Analyse XYZ (coefficient de variation) |
| RG-LOG-01 | Logistique | Pas de chevauchement de missions pour un même véhicule |
| RG-LOG-02 | Logistique | Alerte si charge utile ou volume dépassé |
| RG-LOG-03 | Logistique | Véhicule en maintenance non affectable |
| RG-LOG-04 | Logistique | Coût mission reporté dans transport_cost du transfert |
| RG-LOG-05 | Logistique | Permis conducteur vérifié à l'affectation |
| RG-LOG-06 | Logistique | Kilométrage mis à jour à la clôture de mission |
| RG-USR-01 | Utilisateurs | Permissions granulaires par rôle |
| RG-USR-02 | Utilisateurs | Journal d'audit des actions sensibles |
| RG-USR-03 | Utilisateurs | Séparation des tâches (SoD) |
| RG-USR-04 | Utilisateurs | 2FA obligatoire pour rôles Directeur+ |
| RG-GEN-01 | Transversal | Suppression logique uniquement |
| RG-GEN-02 | Transversal | Archivage 10 ans documents comptables |
| RG-GEN-03 | Transversal | Exercice clôturé non modifiable |
| RG-GEN-04 | Transversal | Taux de change figé à la transaction |
| RG-GEN-05 | Transversal | 6 décimales internes, arrondi sur total ligne |
| RG-GEN-06 | Transversal | Mise à jour tableaux de bord < 5 secondes |
| RG-GEN-07 | Transversal | Notifications email / push / SMS |

---

## 10. GLOSSAIRE

| Terme | Définition |
|-------|-----------|
| BL | Bon de Livraison |
| TMS | Transport Management System (système de gestion du transport) |
| PTAC | Poids Total Autorisé en Charge (limite légale du véhicule) |
| CU | Charge Utile (PTAC − poids à vide du véhicule) |
| BC | Bon de Commande |
| PUMP | Prix Unitaire Moyen Pondéré |
| FIFO | First In First Out (premier entré, premier sorti) |
| DLUO | Date Limite d'Utilisation Optimale |
| EOQ | Economic Order Quantity (quantité économique de commande) |
| RMA | Return Merchandise Authorization |
| FEC | Fichier des Écritures Comptables |
| CV | Coefficient de Variation |
| RFM | Récence, Fréquence, Montant (segmentation clients) |
| SoD | Segregation of Duties (séparation des tâches) |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| B2B | Business to Business |
| B2C | Business to Consumer |
| QMC | Quantité Minimum de Commande |
| UdM | Unité de Mesure |
| WCAG | Web Content Accessibility Guidelines |
| TLS | Transport Layer Security |
| RGPD | Règlement Général sur la Protection des Données |
| EDI | Échange de Données Informatisé |
| PWA | Progressive Web App |
| SSR | Server-Side Rendering |
| SoD | Separation of Duties |
| JWT | JSON Web Token |
