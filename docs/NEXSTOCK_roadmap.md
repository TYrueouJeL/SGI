# Roadmap — Système de Gestion Intégré (SGI)
## Entreprise fictive : NEXSTOCK S.A.S.

---

## Phase 0 — Fondations (2–3 semaines)

### Infrastructure & outillage
- Repo Git + CI/CD (GitHub Actions)
- Docker Compose dev : PostgreSQL, Redis, RabbitMQ, MinIO
- Structure monorepo : `apps/frontend`, `apps/backend`, `packages/shared`
- Linting, formatters, conventions de commits (Conventional Commits)

### Monitoring dès le départ
- Prometheus + Grafana dans Docker Compose
- Métriques de base : CPU, RAM, requêtes HTTP, temps de réponse
- PostHog en self-hosted pour les analytics utilisateurs

### Livrables
- [ ] Environnement de développement fonctionnel
- [ ] Pipeline CI/CD opérationnel
- [ ] Stack monitoring accessible sur `localhost`

---

## Phase 1 — MVP (4–6 mois)

### Objectif
Un SGI utilisable en production couvrant le cycle de vie complet d'une commande, du devis à la facture.

### Sprints

| Sprint | Durée | Livrable |
|--------|-------|---------|
| S1–S2 | 2 sem | Auth (JWT + rôles), gestion utilisateurs, 2FA pour Directeur+ |
| S3–S4 | 2 sem | Catalogue produits basique (sans variantes ni kits) |
| S5–S6 | 2 sem | Gestion stocks mono-entrepôt, mouvements, journal immuable |
| S7–S9 | 3 sem | Commandes achats : `BROUILLON → RÉCEPTION` |
| S10–S12 | 3 sem | Commandes ventes : `DEVIS → FACTURÉE` |
| S13–S14 | 2 sem | Facturation simple (PDF, numérotation séquentielle sans rupture) |
| S15–S16 | 2 sem | Dashboard dirigeant basique, tests E2E, démo client |

### Règles de gestion couvertes
- RG-USR-01 à 04 (utilisateurs & droits)
- RG-PROD-01 (pas de récursivité kits — contrainte DB)
- RG-STOCK-01 à 06 (stock disponible, journal, PUMP)
- RG-STOCK-07 (seuils d'alerte)
- RG-ACH-01 à 07 (cycle commande achat)
- RG-VTE-01 à 05 (cycle commande vente)
- RG-PRIX-01 à 04 (cascade de prix, remises, marge minimale)
- RG-FACT-01 à 04 (facturation)
- RG-GEN-01 à 07 (règles transversales)

### Livrables
- [ ] Application déployée en staging
- [ ] Tests unitaires et E2E (couverture > 70%)
- [ ] Documentation API OpenAPI 3.0

---

## Phase 2 — Consolidation (3–4 mois)

### Objectif
Étendre le périmètre fonctionnel : multi-sites, produits complexes, retours, fournisseurs avancés.

### Fonctionnalités

| Fonctionnalité | Règles associées |
|----------------|-----------------|
| Multi-entrepôts + transferts inter-sites | RG-TRF-01 à 04 |
| Variantes produits | — |
| Kits / nomenclatures | RG-PROD-01, RG-PROD-02 |
| Module retours clients (RMA) | RG-RET-01 à 04 |
| Retours fournisseurs | RG-RETF-01 |
| Score qualité fournisseurs | RG-FOUR-01 à 03 |
| Multi-fournisseurs par produit | RG-FOUR-01, RG-FOUR-02 |
| Inventaires (général, tournant, permanent) | RG-INV-01 à 03 |
| Avoirs & suivi des règlements | RG-AVO-01, RG-AVO-02, RG-REGL-01 à 03 |

### Livrables
- [ ] Module transferts opérationnel avec stock en transit
- [ ] Interface d'inventaire avec gel de stock
- [ ] Workflow RMA complet
- [ ] Mise à jour dashboards Grafana (alertes stock critique)

---

## Phase 3 — Avancé (3–4 mois)

### Objectif
Automatisation, reporting poussé et fonctionnalités métier avancées.

### Fonctionnalités

| Fonctionnalité | Règles associées |
|----------------|-----------------|
| Moteur promotionnel complet | RG-PROMO-01, RG-PROMO-02 |
| Reporting exportable (PDF / Excel / CSV) | Section 3.11 |
| Analyse ABC-XYZ automatique | RG-REP-01, RG-REP-02 |
| Réapprovisionnement automatique (EOQ) | RG-STOCK-08 à 10 |
| Traçabilité lots & numéros de série | — |
| Gestion DLUO / DLC | RG-PROD-03 |
| Valorisation FIFO par produit | RG-STOCK-05 |
| Journal d'audit renforcé, SoD | RG-USR-02, RG-USR-03 |
| Dashboards métier Grafana | CA, rotation stock, perf fournisseurs |
| **Gestion flotte logistique** | RG-LOG-01 à 06 |
| Fiches véhicules (charge utile, volume, permis requis) | RG-LOG-01, RG-LOG-02, RG-LOG-03 |
| Fiches conducteurs + vérification permis | RG-LOG-05 |
| Planification des missions de transport | RG-LOG-01, RG-LOG-04 |
| Historique et alertes maintenance | RG-LOG-06 |
| Dashboard flotte (disponibilité, coûts, taux utilisation) | Section 3.13.5 |

### Livrables
- [ ] Dashboards Grafana métier complets
- [ ] Rapports automatisés (mensuel, trimestriel)
- [ ] Suggestions de réapprovisionnement automatiques
- [ ] Audit trail complet et export

---

## Phase 4 — Excellence (continu)

### Objectif
Ouverture vers l'écosystème externe et optimisation de l'expérience terrain.

### Fonctionnalités
- Application mobile (PWA ou native)
- Mode offline pour les magasiniers (scan & préparation sans connexion, sync à la reconnexion)
- Intégration transporteurs (Chronopost, Colissimo, DHL…)
- Connecteur comptabilité (export FEC, intégration Sage / Cegid)
- EDI fournisseurs
- Support lecteur code-barres Bluetooth
- Multilingue EN, ES

---

## Stack de monitoring — intégration progressive

```
Phase 0  →  Prometheus + Grafana (infra : CPU, RAM, latence)
Phase 1  →  PostHog (funnels utilisateurs, session replay, feature flags)
Phase 2  →  Alertes Grafana (seuils stock critiques, erreurs 5xx)
Phase 3  →  Dashboards métier Grafana (CA, rotation stock, perf fournisseurs)
Phase 4  →  Alertes SMS (stock zéro, retard critique) via Grafana OnCall
```

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Nuxt.js, TypeScript, TailwindCSS |
| Backend | AdonisJS, TypeScript |
| Base de données | PostgreSQL 15+ |
| Cache & sessions | Redis |
| Recherche full-text | PostgreSQL (`pg_trgm` + `tsvector`) |
| File de messages | RabbitMQ |
| Stockage fichiers | MinIO (S3-compatible) |
| Génération PDF | Puppeteer |
| Auth | JWT + OAuth2 |
| Déploiement | Docker + Docker Compose (dev) / Kubernetes (prod) |
| CI/CD | GitHub Actions |
| Monitoring infra | Prometheus + Grafana |
| Analytics produit | PostHog |

---

## Critères de passage entre phases

| Phase | Critère de sortie |
|-------|-----------------|
| 0 → 1 | Environnement dev stable, CI verte, monitoring actif |
| 1 → 2 | Cycle commande complet testé en staging, 0 bug bloquant |
| 2 → 3 | Multi-entrepôts validé, inventaire fonctionnel, retours opérationnels |
| 3 → 4 | Reporting validé par le métier, réapprovisionnement auto en production |
