# Schéma de base de données — SGI NEXSTOCK

Base : **PostgreSQL 15+**  
Convention : snake_case, `deleted_at` pour suppressions logiques (RG-GEN-01), prix en `NUMERIC(15,6)` (RG-GEN-05).

---

## Vue d'ensemble

```mermaid
classDiagram
    %% ─── Utilisateurs & Droits ───────────────────────────────────────────────
    class users {
        +int id PK
        +String full_name
        +String email
        +String password
        +String totp_secret
        +Boolean is_2fa_enabled
        +int role_id FK
        +Boolean is_active
        +DateTime deleted_at
        +DateTime created_at
        +DateTime updated_at
    }
    class roles {
        +int id PK
        +String name
        +String label
    }
    class permissions {
        +int id PK
        +String code
        +String module
        +String action
    }
    class role_permissions {
        +int role_id FK
        +int permission_id FK
    }
    class user_permission_overrides {
        +int id PK
        +int user_id FK
        +int permission_id FK
        +Boolean granted
    }
    class audit_logs {
        +long id PK
        +int user_id FK
        +String action
        +String entity_type
        +int entity_id
        +JSON old_values
        +JSON new_values
        +String ip_address
        +DateTime created_at
    }

    roles "1" --> "*" users : attribué à
    roles "1" --> "*" role_permissions : définit
    permissions "1" --> "*" role_permissions : incluse dans
    users "1" --> "*" user_permission_overrides : surcharge
    permissions "1" --> "*" user_permission_overrides : surchargée par
    users "1" --> "*" audit_logs : effectue

    %% ─── Catalogue Produits ──────────────────────────────────────────────────
    class categories {
        +int id PK
        +int parent_id FK
        +String name
        +String code
        +int level
        +Decimal margin_min_rate
        +DateTime deleted_at
    }
    class brands {
        +int id PK
        +String name
        +DateTime deleted_at
    }
    class units_of_measure {
        +int id PK
        +String name
        +String abbreviation
    }
    class tax_rates {
        +int id PK
        +String name
        +Decimal rate
    }
    class products {
        +int id PK
        +String reference
        +String ean13
        +String name
        +Text description
        +int category_id FK
        +int brand_id FK
        +String manufacturer_reference
        +int unit_id FK
        +int tax_rate_id FK
        +Decimal purchase_price_pump
        +Decimal sale_price_ht
        +String valuation_method
        +Boolean is_kit
        +Boolean is_perishable
        +int qty_per_carton
        +Decimal weight_gross_kg
        +Decimal weight_net_kg
        +String status
        +DateTime deleted_at
        +int updated_by FK
        +DateTime created_at
        +DateTime updated_at
    }
    class product_variants {
        +int id PK
        +int product_id FK
        +String reference
        +String name
        +Decimal sale_price_ht_override
        +Decimal weight_gross_override
        +DateTime deleted_at
    }
    class product_kit_components {
        +int id PK
        +int kit_product_id FK
        +int component_product_id FK
        +Decimal quantity
    }
    class product_images {
        +int id PK
        +int product_id FK
        +String url
        +int position
    }
    class product_documents {
        +int id PK
        +int product_id FK
        +String name
        +String url
        +String doc_type
    }

    categories "1" --> "*" categories : parent
    categories "1" --> "*" products : classifie
    brands "1" --> "*" products : marque
    units_of_measure "1" --> "*" products : unité
    tax_rates "1" --> "*" products : taxe
    products "1" --> "*" product_variants : variante de
    products "1" --> "*" product_kit_components : composant de
    products "1" --> "*" product_images : images
    products "1" --> "*" product_documents : documents

    %% ─── Entrepôts & Stocks ──────────────────────────────────────────────────
    class warehouses {
        +int id PK
        +String name
        +String code
        +Text address
        +DateTime deleted_at
    }
    class warehouse_locations {
        +int id PK
        +int warehouse_id FK
        +String code
        +String zone
        +String aisle
        +String shelf
        +String slot
        +Boolean is_active
    }
    class stock_levels {
        +int id PK
        +int product_id FK
        +int variant_id FK
        +int warehouse_id FK
        +int location_id FK
        +Decimal qty_available
        +Decimal qty_reserved
        +Decimal qty_in_transit
        +Decimal qty_blocked
        +Decimal qty_consignment
        +Decimal pump
        +DateTime updated_at
    }
    class stock_lots {
        +int id PK
        +int product_id FK
        +int warehouse_id FK
        +int location_id FK
        +String lot_number
        +Date dluo
        +Decimal quantity_initial
        +Decimal quantity_remaining
        +Decimal unit_purchase_price
        +DateTime received_at
        +String status
    }
    class stock_serial_numbers {
        +int id PK
        +int product_id FK
        +String serial_number
        +int warehouse_id FK
        +String status
        +int lot_id FK
        +int stock_movement_in_id FK
        +int stock_movement_out_id FK
    }
    class stock_movements {
        +long id PK
        +int product_id FK
        +int variant_id FK
        +int warehouse_id_from FK
        +int warehouse_id_to FK
        +int location_id_from FK
        +int location_id_to FK
        +String movement_type
        +Decimal quantity
        +Decimal unit_price_pump
        +int lot_id FK
        +int serial_number_id FK
        +String reference_type
        +int reference_id
        +int user_id FK
        +Text notes
        +DateTime created_at
    }
    class stock_thresholds {
        +int id PK
        +int product_id FK
        +int warehouse_id FK
        +Decimal alert_threshold
        +Decimal critical_threshold
        +Decimal safety_stock
        +Decimal reorder_point
        +Decimal eoq
    }

    warehouses "1" --> "*" warehouse_locations : contient
    warehouses "1" --> "*" stock_levels : héberge
    warehouse_locations "1" --> "*" stock_levels : emplacement
    products "1" --> "*" stock_levels : stocké
    products "1" --> "*" stock_lots : lot
    products "1" --> "*" stock_movements : mouvementé
    products "1" --> "*" stock_thresholds : seuils
    stock_lots "1" --> "*" stock_serial_numbers : contient
    stock_lots "1" --> "*" stock_movements : tracé

    %% ─── Fournisseurs ────────────────────────────────────────────────────────
    class suppliers {
        +int id PK
        +String code
        +String company_name
        +String legal_form
        +String siret
        +String vat_number
        +int payment_terms_days
        +String payment_terms_type
        +Decimal global_discount_rate
        +Decimal franco_amount_ht
        +String preferred_currency
        +Decimal quality_score
        +String status
        +DateTime deleted_at
        +DateTime created_at
    }
    class supplier_addresses {
        +int id PK
        +int supplier_id FK
        +String type
        +Text address
        +String city
        +String postal_code
        +String country
        +Boolean is_default
    }
    class supplier_contacts {
        +int id PK
        +int supplier_id FK
        +String full_name
        +String role
        +String email
        +String phone
    }
    class supplier_products {
        +int id PK
        +int supplier_id FK
        +int product_id FK
        +String supplier_reference
        +Decimal catalog_price_ht
        +Decimal negotiated_price_ht
        +Decimal min_order_qty
        +Decimal packaging_qty
        +Boolean is_primary
        +int priority_rank
        +int delivery_delay_days
        +DateTime deleted_at
    }

    suppliers "1" --> "*" supplier_addresses : adresse
    suppliers "1" --> "*" supplier_contacts : contact
    suppliers "1" --> "*" supplier_products : fournit
    products "1" --> "*" supplier_products : référencé

    %% ─── Achats ──────────────────────────────────────────────────────────────
    class purchase_orders {
        +int id PK
        +String reference
        +int supplier_id FK
        +int warehouse_id FK
        +String status
        +Decimal total_ht
        +Decimal total_ttc
        +String currency
        +Decimal exchange_rate
        +int payment_terms_days
        +Date requested_delivery_date
        +int validated_by FK
        +DateTime validated_at
        +DateTime sent_at
        +DateTime confirmed_at
        +DateTime closed_at
        +Text notes
        +int created_by FK
        +DateTime deleted_at
        +DateTime created_at
        +DateTime updated_at
    }
    class purchase_order_lines {
        +int id PK
        +int purchase_order_id FK
        +int product_id FK
        +String supplier_reference
        +Decimal quantity_ordered
        +Decimal quantity_received
        +Decimal unit_price_ht
        +Decimal discount_rate
        +Decimal total_ht
        +Text notes
    }
    class purchase_receptions {
        +int id PK
        +int purchase_order_id FK
        +int received_by FK
        +DateTime received_at
        +Text notes
        +String status
    }
    class purchase_reception_lines {
        +int id PK
        +int reception_id FK
        +int purchase_order_line_id FK
        +int product_id FK
        +Decimal quantity_received
        +int location_id FK
        +String lot_number
        +Date dluo
        +Decimal unit_price_ht
        +Decimal quantity_qc_blocked
        +DateTime qc_released_at
    }
    class supplier_invoices {
        +int id PK
        +int supplier_id FK
        +int purchase_order_id FK
        +int reception_id FK
        +String reference
        +Decimal total_ht
        +Decimal total_ttc
        +Date issue_date
        +Date due_date
        +String status
        +DateTime matched_at
    }

    suppliers "1" --> "*" purchase_orders : destinataire
    warehouses "1" --> "*" purchase_orders : destination
    purchase_orders "1" --> "*" purchase_order_lines : lignes
    purchase_orders "1" --> "*" purchase_receptions : réceptions
    purchase_receptions "1" --> "*" purchase_reception_lines : lignes
    suppliers "1" --> "*" supplier_invoices : émet
    purchase_orders "1" --> "*" supplier_invoices : rapprochement
    purchase_receptions "1" --> "*" supplier_invoices : rapprochement

    %% ─── Clients ─────────────────────────────────────────────────────────────
    class customers {
        +int id PK
        +String code
        +String type
        +String company_name
        +String first_name
        +String last_name
        +String siret
        +String vat_number
        +int payment_terms_days
        +Decimal global_discount_rate
        +Decimal credit_limit
        +Decimal outstanding_balance
        +String price_group
        +int commercial_user_id FK
        +Decimal rfm_score
        +String status
        +DateTime deleted_at
        +DateTime created_at
        +DateTime updated_at
    }
    class customer_addresses {
        +int id PK
        +int customer_id FK
        +String type
        +String label
        +Text address
        +String city
        +String postal_code
        +String country
        +Boolean is_default
    }
    class customer_contacts {
        +int id PK
        +int customer_id FK
        +String full_name
        +String role
        +String email
        +String phone
    }

    customers "1" --> "*" customer_addresses : adresse
    customers "1" --> "*" customer_contacts : contact
    users "1" --> "*" customers : commercial responsable

    %% ─── Ventes ──────────────────────────────────────────────────────────────
    class sales_orders {
        +int id PK
        +String reference
        +String type
        +int customer_id FK
        +int billing_address_id FK
        +int shipping_address_id FK
        +int commercial_user_id FK
        +String status
        +Decimal total_ht
        +Decimal discount_rate
        +Decimal total_ttc
        +Decimal shipping_cost_ht
        +String carrier
        +String shipping_mode
        +int payment_terms_days
        +String currency
        +Decimal exchange_rate
        +Date valid_until
        +String backorder_option
        +Text notes
        +DateTime confirmed_at
        +DateTime cancelled_at
        +DateTime deleted_at
        +int created_by FK
        +DateTime created_at
        +DateTime updated_at
    }
    class sales_order_lines {
        +int id PK
        +int sales_order_id FK
        +int product_id FK
        +int variant_id FK
        +Decimal quantity
        +Decimal quantity_reserved
        +Decimal quantity_shipped
        +Decimal unit_price_ht
        +Decimal discount_rate
        +Decimal total_ht
        +int tax_rate_id FK
        +int promo_id FK
        +int substitute_product_id FK
        +String status
    }
    class picking_lists {
        +int id PK
        +String type
        +String wave_batch_reference
        +DateTime generated_at
        +DateTime completed_at
        +int user_id FK
    }
    class picking_list_items {
        +int id PK
        +int picking_list_id FK
        +int sales_order_line_id FK
        +int product_id FK
        +int location_id FK
        +int lot_id FK
        +int serial_number_id FK
        +Decimal quantity_to_pick
        +Decimal quantity_picked
        +DateTime picked_at
    }
    class shipments {
        +int id PK
        +int sales_order_id FK
        +int picking_list_id FK
        +String reference
        +String carrier
        +String tracking_number
        +DateTime shipped_at
        +Decimal weight_kg
        +int packages_count
        +Decimal shipping_cost_ht
        +Text notes
    }
    class shipment_lines {
        +int id PK
        +int shipment_id FK
        +int sales_order_line_id FK
        +int product_id FK
        +Decimal quantity
        +int lot_id FK
        +int serial_number_id FK
    }

    customers "1" --> "*" sales_orders : passe
    sales_orders "1" --> "*" sales_order_lines : lignes
    products "1" --> "*" sales_order_lines : commandé
    picking_lists "1" --> "*" picking_list_items : items
    sales_order_lines "1" --> "*" picking_list_items : préparé
    sales_orders "1" --> "*" shipments : expédié via
    shipments "1" --> "*" shipment_lines : lignes

    %% ─── Facturation ─────────────────────────────────────────────────────────
    class invoices {
        +int id PK
        +String reference
        +String type
        +int original_invoice_id FK
        +int customer_id FK
        +String status
        +Decimal total_ht
        +Decimal total_vat
        +Decimal total_ttc
        +String currency
        +Decimal exchange_rate
        +Date issue_date
        +Date service_date
        +Date due_date
        +DateTime paid_at
        +Decimal late_penalties
        +String credit_note_usage
        +Text notes
        +int created_by FK
        +DateTime created_at
    }
    class invoice_sales_orders {
        +int invoice_id FK
        +int sales_order_id FK
        +int shipment_id FK
    }
    class invoice_lines {
        +int id PK
        +int invoice_id FK
        +int sales_order_line_id FK
        +String description
        +Decimal quantity
        +Decimal unit_price_ht
        +Decimal discount_rate
        +Decimal total_ht
        +int tax_rate_id FK
        +Decimal total_ttc
    }
    class payments {
        +int id PK
        +int invoice_id FK
        +int customer_id FK
        +Decimal amount
        +String payment_method
        +Date payment_date
        +String reference
        +Text notes
    }
    class invoice_reminders {
        +int id PK
        +int invoice_id FK
        +int level
        +DateTime sent_at
        +String type
    }

    customers "1" --> "*" invoices : facturé
    invoices "1" --> "*" invoices : avoir de
    invoices "1" --> "*" invoice_sales_orders : regroupe
    sales_orders "1" --> "*" invoice_sales_orders : incluse dans
    invoices "1" --> "*" invoice_lines : détail
    invoices "1" --> "*" payments : réglé
    invoices "1" --> "*" invoice_reminders : relance

    %% ─── Retours & SAV ───────────────────────────────────────────────────────
    class returns {
        +int id PK
        +String rma_number
        +int customer_id FK
        +int sales_order_id FK
        +String status
        +Decimal credit_amount
        +int created_by FK
        +DateTime processed_at
        +DateTime created_at
    }
    class return_lines {
        +int id PK
        +int return_id FK
        +int product_id FK
        +Decimal quantity
        +String motif
        +String condition
        +String stock_destination
        +Decimal restocking_fee_rate
        +Decimal credit_amount
        +int lot_id FK
    }
    class supplier_returns {
        +int id PK
        +int supplier_id FK
        +int purchase_order_id FK
        +String reference
        +String status
        +DateTime created_at
    }
    class supplier_return_lines {
        +int id PK
        +int supplier_return_id FK
        +int product_id FK
        +Decimal quantity
        +Text reason
        +Decimal unit_price_ht
    }

    customers "1" --> "*" returns : retour
    sales_orders "1" --> "*" returns : retour
    returns "1" --> "*" return_lines : lignes
    suppliers "1" --> "*" supplier_returns : retour vers
    purchase_orders "1" --> "*" supplier_returns : origine
    supplier_returns "1" --> "*" supplier_return_lines : lignes

    %% ─── Promotions & Tarifs ─────────────────────────────────────────────────
    class promotions {
        +int id PK
        +String name
        +String type
        +Decimal value
        +Decimal min_qty
        +Decimal free_qty
        +String scope_product
        +String scope_customer
        +DateTime starts_at
        +DateTime ends_at
        +int max_uses
        +int current_uses
        +Boolean is_cumulative
        +Boolean is_active
        +DateTime created_at
    }
    class promotion_products {
        +int promotion_id FK
        +int product_id FK
    }
    class promotion_categories {
        +int promotion_id FK
        +int category_id FK
    }
    class promotion_customer_groups {
        +int promotion_id FK
        +String price_group
    }
    class promotion_customers {
        +int promotion_id FK
        +int customer_id FK
    }
    class customer_product_prices {
        +int id PK
        +int customer_id FK
        +int product_id FK
        +Decimal price_ht
        +Date starts_at
        +Date ends_at
    }
    class price_tiers {
        +int id PK
        +int product_id FK
        +String price_group
        +Decimal min_qty
        +Decimal discount_rate
    }

    promotions "1" --> "*" promotion_products : périmètre produits
    promotions "1" --> "*" promotion_categories : périmètre catégories
    promotions "1" --> "*" promotion_customer_groups : périmètre groupes
    promotions "1" --> "*" promotion_customers : périmètre clients
    customers "1" --> "*" customer_product_prices : prix contractuel
    products "1" --> "*" customer_product_prices : prix contractuel
    products "1" --> "*" price_tiers : paliers

    %% ─── Transferts inter-entrepôts ──────────────────────────────────────────
    class transfers {
        +int id PK
        +String reference
        +int from_warehouse_id FK
        +int to_warehouse_id FK
        +String status
        +Decimal transport_cost
        +int requested_by FK
        +int approved_by FK
        +DateTime shipped_at
        +DateTime received_at
        +DateTime created_at
    }
    class transfer_lines {
        +int id PK
        +int transfer_id FK
        +int product_id FK
        +int from_location_id FK
        +int to_location_id FK
        +Decimal quantity_requested
        +Decimal quantity_shipped
        +Decimal quantity_received
        +int lot_id FK
        +int serial_number_id FK
    }

    warehouses "1" --> "*" transfers : source
    warehouses "1" --> "*" transfers : destination
    transfers "1" --> "*" transfer_lines : lignes
    products "1" --> "*" transfer_lines : transféré

    %% ─── Inventaires ─────────────────────────────────────────────────────────
    class inventory_sessions {
        +int id PK
        +String reference
        +String type
        +int warehouse_id FK
        +String status
        +DateTime frozen_at
        +int validated_by FK
        +DateTime validated_at
        +int created_by FK
        +DateTime created_at
    }
    class inventory_counts {
        +int id PK
        +int session_id FK
        +int product_id FK
        +int location_id FK
        +Decimal expected_qty
        +Decimal counted_qty
        +Decimal recount_qty
        +Decimal variance_qty
        +Decimal variance_value
        +Boolean requires_recount
        +Text justification
        +int adjustment_movement_id FK
    }

    warehouses "1" --> "*" inventory_sessions : inventaire
    inventory_sessions "1" --> "*" inventory_counts : comptages
    products "1" --> "*" inventory_counts : compté
    warehouse_locations "1" --> "*" inventory_counts : emplacement

    %% ─── Notifications ───────────────────────────────────────────────────────
    class notifications {
        +long id PK
        +int user_id FK
        +String type
        +String title
        +Text message
        +String entity_type
        +int entity_id
        +String channel
        +Boolean is_read
        +DateTime sent_at
        +DateTime created_at
    }

    users "1" --> "*" notifications : reçoit

    %% ─── Logistique Flotte ───────────────────────────────────────────────────
    class vehicles {
        +int id PK
        +String registration_plate
        +String vehicle_type
        +String brand
        +String model
        +int year
        +Decimal payload_kg
        +Decimal volume_m3
        +int pallet_capacity
        +int base_warehouse_id FK
        +int mileage_km
        +String fuel_type
        +String status
        +DateTime last_maintenance_at
        +DateTime next_maintenance_at
        +DateTime deleted_at
    }
    class drivers {
        +int id PK
        +int user_id FK
        +String full_name
        +String employee_number
        +String license_type
        +String license_number
        +Date license_expires_at
        +int base_warehouse_id FK
        +String status
        +String phone
        +DateTime deleted_at
    }
    class transport_missions {
        +int id PK
        +String reference
        +String mission_type
        +int vehicle_id FK
        +int driver_id FK
        +int from_warehouse_id FK
        +int to_warehouse_id FK
        +String departure_address
        +String arrival_address
        +DateTime scheduled_departure_at
        +DateTime actual_departure_at
        +DateTime scheduled_arrival_at
        +DateTime actual_arrival_at
        +String status
        +Decimal total_weight_kg
        +Decimal total_volume_m3
        +int total_pallets
        +Decimal distance_km
        +Decimal fuel_cost
        +Decimal toll_cost
        +Decimal total_transport_cost
        +Text notes
        +int created_by FK
        +DateTime created_at
        +DateTime updated_at
    }
    class transport_mission_items {
        +int id PK
        +int mission_id FK
        +String item_type
        +int transfer_id FK
        +int shipment_id FK
        +int purchase_order_id FK
        +int packages_count
        +Decimal weight_kg
        +Decimal volume_m3
        +Text notes
    }
    class vehicle_maintenance {
        +int id PK
        +int vehicle_id FK
        +String maintenance_type
        +Text description
        +int mileage_at_maintenance
        +Decimal cost
        +DateTime performed_at
        +DateTime next_maintenance_at
        +String performed_by
        +int created_by FK
        +DateTime created_at
    }

    warehouses "1" --> "*" vehicles : rattachement
    warehouses "1" --> "*" drivers : rattachement
    vehicles "1" --> "*" transport_missions : utilisé dans
    drivers "1" --> "*" transport_missions : conduit
    warehouses "1" --> "*" transport_missions : départ
    warehouses "1" --> "*" transport_missions : destination
    transport_missions "1" --> "*" transport_mission_items : transporte
    transfers "1" --> "*" transport_mission_items : lié à
    shipments "1" --> "*" transport_mission_items : lié à
    vehicles "1" --> "*" vehicle_maintenance : maintenance
```

---

## 1. Utilisateurs & Droits

### `users`
Stocke tous les comptes utilisateurs du système (commerciaux, magasiniers, comptables, admins…). Chaque action métier est rattachée à un utilisateur via `user_id` pour garantir la traçabilité complète.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique auto-incrémenté de l'utilisateur. Référencé dans la quasi-totalité des tables pour la traçabilité (qui a créé, validé, modifié). |
| full_name | VARCHAR(150) | Nom complet affiché dans l'interface (ex. "Jean Dupont"). Utilisé dans les listes, les audits et les exports. |
| email | VARCHAR(254) UNIQUE | Adresse email servant d'identifiant de connexion. Doit être unique dans le système. Longueur 254 conforme à la RFC 5321. |
| password | VARCHAR | Mot de passe hashé via bcrypt. Jamais stocké en clair. Le hash inclut le sel et le facteur de coût. |
| totp_secret | VARCHAR | Clé secrète TOTP (Time-based One-Time Password) encodée en Base32, générée lors de l'activation du 2FA (RG-USR-04). Sert à générer les codes à 6 chiffres toutes les 30 secondes. |
| is_2fa_enabled | BOOLEAN | Indique si l'authentification à deux facteurs est activée pour cet utilisateur. DEFAULT false. Quand true, le login exige le code TOTP en plus du mot de passe. |
| role_id | INT FK → roles | Rôle principal attribué à l'utilisateur. Détermine l'ensemble des permissions par défaut via la table `role_permissions`. Peut être surchargé individuellement via `user_permission_overrides`. |
| is_active | BOOLEAN | Permet de désactiver un compte sans le supprimer (ex. départ d'un employé). DEFAULT true. Un utilisateur inactif ne peut pas se connecter. |
| deleted_at | TIMESTAMP | Horodatage de la suppression logique (soft delete). NULL = compte existant. Non-NULL = compte supprimé mais conservé pour l'historique et l'audit. |
| created_at | TIMESTAMP | Date et heure de création du compte. Alimenté automatiquement à l'insertion. |
| updated_at | TIMESTAMP | Date et heure de la dernière modification du compte. Mis à jour automatiquement à chaque UPDATE. |

### `roles`
Définit les profils métier du système. Chaque rôle regroupe un ensemble cohérent de permissions correspondant à un type de poste (ex. commercial ne voit pas les prix d'achat, magasinier ne peut pas valider les commandes).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du rôle. Référencé par `users.role_id` et `role_permissions.role_id`. |
| name | VARCHAR(50) UNIQUE | Code technique du rôle en snake_case (ex. `super_admin`, `commercial`, `warehouse_operator`, `accountant`). Utilisé dans le code applicatif pour les vérifications de droits. |
| label | VARCHAR(100) | Libellé lisible affiché dans l'interface (ex. "Super Administrateur", "Commercial", "Magasinier"). |

### `permissions`
Catalogue exhaustif de toutes les actions possibles dans le système. Chaque permission correspond à une action précise sur un module (ex. créer un bon de commande, valider une facture). Le modèle RBAC (Role-Based Access Control) s'appuie sur cette table.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la permission. |
| code | VARCHAR(100) UNIQUE | Code technique unique de la permission, format `module.resource.action` (ex. `stock.movements.create`, `invoices.validate`, `purchase_orders.approve`). Utilisé dans le code pour les vérifications programmatiques. |
| module | VARCHAR(50) | Groupe fonctionnel auquel appartient la permission (ex. `stock`, `sales`, `purchases`, `billing`). Permet de regrouper les permissions par module dans l'interface d'administration. |
| action | VARCHAR(20) | Type d'action autorisée : `read` (consulter), `create` (créer), `update` (modifier), `validate` (valider/approuver), `delete` (supprimer). Permet une granularité fine des droits. |

### `role_permissions`
Table de jonction entre les rôles et leurs permissions. Définit les droits par défaut de chaque rôle. Un rôle peut avoir N permissions, une permission peut appartenir à M rôles.

| Colonne | Type | Notes |
|---------|------|-------|
| role_id | INT FK → roles | Référence le rôle concerné. Partie de la clé primaire composite (role_id, permission_id). |
| permission_id | INT FK → permissions | Référence la permission accordée à ce rôle. Partie de la clé primaire composite. |

### `user_permission_overrides`
Permet d'affiner les droits d'un utilisateur spécifique par rapport à son rôle (RG-USR-01). Permet d'accorder une permission supplémentaire (ex. un commercial autorisé à créer des avoirs) ou de retirer une permission du rôle (ex. un admin restreint temporairement).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la surcharge. |
| user_id | INT FK → users | Utilisateur dont on surcharge les droits. Combinaison (user_id, permission_id) doit être unique. |
| permission_id | INT FK → permissions | Permission spécifiquement accordée ou retirée à cet utilisateur. |
| granted | BOOLEAN | `true` = permission accordée en plus du rôle. `false` = permission retirée malgré le rôle. Permet une gestion différentielle par rapport au rôle de base. |

### `audit_logs`
Journal d'audit immuable qui enregistre toutes les actions significatives réalisées dans le système (RG-USR-02). Aucun UPDATE ni DELETE n'est jamais effectué sur cette table : c'est une append-only log. Sert à la traçabilité légale, à la détection d'anomalies et à la résolution de litiges.

| Colonne | Type | Notes |
|---------|------|-------|
| id | BIGSERIAL PK | Identifiant grand entier (BIGSERIAL) car le volume d'entrées peut être très élevé (des millions de lignes sur plusieurs années). |
| user_id | INT FK → users | Utilisateur qui a effectué l'action. NULL possible si action système automatique (job, trigger). |
| action | VARCHAR(50) | Code de l'action réalisée (ex. `VALIDATE_ORDER`, `UPDATE_PRICE`, `LOGIN`, `DELETE_PRODUCT`). Normalisé en SCREAMING_SNAKE_CASE pour faciliter le filtrage. |
| entity_type | VARCHAR(50) | Nom de la table/entité concernée par l'action (ex. `purchase_orders`, `invoices`, `products`). Permet de retrouver tous les changements sur un type d'objet. |
| entity_id | INT | Identifiant de l'enregistrement précis qui a été modifié. Combiné avec `entity_type`, permet de reconstruire l'historique complet d'un objet. |
| old_values | JSONB | Snapshot JSON des valeurs avant modification. NULL pour les créations. Permet de voir exactement ce qui a changé (diff avant/après). |
| new_values | JSONB | Snapshot JSON des valeurs après modification. NULL pour les suppressions. Stocké en JSONB pour permettre des requêtes sur les champs (ex. `new_values->>'status' = 'VALIDATED'`). |
| ip_address | INET | Adresse IP de l'utilisateur au moment de l'action. Type natif PostgreSQL INET pour les opérations réseau (masques, plages). Utile pour détecter des connexions suspectes. |
| created_at | TIMESTAMP | Horodatage exact de l'action. Index recommandé sur cette colonne pour les requêtes d'historique par période. |

---

## 2. Catalogue Produits

### `categories`
Organise les produits en arborescence hiérarchique à 3 niveaux maximum via une auto-référence (ex. Électronique > Informatique > Ordinateurs portables). Chaque niveau peut avoir son propre taux de marge minimum.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la catégorie. |
| parent_id | INT FK → categories | Référence la catégorie parente. NULL pour les catégories racines (niveau 1). Permet la structure arborescente par auto-jointure. |
| name | VARCHAR(100) | Nom affiché de la catégorie (ex. "Électronique", "Informatique", "Ordinateurs portables"). |
| code | VARCHAR(20) UNIQUE | Code court unique utilisé dans la génération des références produits (format NX-CAT-NNNNN). Permet de catégoriser les produits sans jointure sur la référence. |
| level | SMALLINT | Niveau dans la hiérarchie : 1 = racine, 2 = sous-catégorie, 3 = feuille. Calculé et stocké pour éviter des requêtes récursives coûteuses à chaque affichage. |
| margin_min_rate | NUMERIC(5,4) | Taux de marge minimale applicable aux produits de cette catégorie (RG-PRIX-03). Ex. 0.2000 = 20%. Déclenche une alerte si un prix de vente ne respecte pas ce seuil. |
| deleted_at | TIMESTAMP | Suppression logique. Une catégorie supprimée ne peut plus être assignée à de nouveaux produits mais les produits existants conservent leur catégorie. |

### `brands`
Référentiel des marques / fabricants des produits. Permet de filtrer et regrouper les produits par marque dans les catalogues et les rapports commerciaux.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la marque. |
| name | VARCHAR(100) UNIQUE | Nom unique de la marque (ex. "Apple", "Samsung", "Bosch"). Unicité garantie pour éviter les doublons. |
| deleted_at | TIMESTAMP | Suppression logique. Une marque supprimée n'apparaît plus dans les formulaires mais reste liée aux produits existants. |

### `units_of_measure`
Référentiel des unités de conditionnement et de mesure utilisées pour quantifier les produits (pièce, carton, kg, litre…). Essentiel pour les conversions lors des commandes fournisseurs et les calculs de stock.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'unité. |
| name | VARCHAR(50) | Nom complet de l'unité (ex. "Pièce", "Carton", "Kilogramme", "Litre"). Affiché dans les formulaires et les documents (bons de commande, factures). |
| abbreviation | VARCHAR(10) | Abréviation courte utilisée dans les tableaux et les exports (ex. "pce", "ctn", "kg", "L"). |

### `tax_rates`
Référentiel des taux de TVA applicables. Chaque produit est lié à un taux de TVA, et ce taux est figé sur les lignes de commande et de facture au moment de la transaction.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du taux de TVA. |
| name | VARCHAR(50) | Libellé du taux (ex. "TVA 20%", "TVA 5,5%", "TVA 10%", "Exonéré"). Affiché sur les factures. |
| rate | NUMERIC(5,4) | Valeur numérique du taux (ex. 0.2000 pour 20%, 0.0550 pour 5,5%). Précision à 4 décimales pour les taux atypiques. |

### `products`
Table centrale du catalogue produits. Contient toutes les informations descriptives, commerciales et logistiques d'un produit. C'est le référentiel central autour duquel gravitent les stocks, les commandes, les prix et les mouvements.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du produit. Référencé dans la quasi-totalité des tables de stock, commande et facturation. |
| reference | VARCHAR(30) UNIQUE | Référence interne unique au format NX-CAT-NNNNN (ex. NX-INF-00042). Générée automatiquement à la création. Utilisée sur tous les documents commerciaux et logistiques. |
| ean13 | VARCHAR(13) UNIQUE | Code-barres EAN-13 pour la lecture par scanners en entrepôt. NULL si le produit n'a pas encore de code-barres. Utilisé pour le picking, les réceptions et les inventaires. |
| name | VARCHAR(100) | Nom commercial du produit affiché dans l'interface, les catalogues et les documents. |
| description | TEXT | Description détaillée du produit (caractéristiques techniques, utilisation). Peut contenir du texte long ou du HTML selon l'implémentation frontend. |
| category_id | INT FK → categories | Catégorie d'appartenance du produit. Détermine la hiérarchie d'affichage et le taux de marge minimum applicable (RG-PRIX-03). |
| brand_id | INT FK → brands | Marque du produit. Permet les filtres et les regroupements par fabricant. |
| manufacturer_reference | VARCHAR(100) | Référence du fabricant (distincte de la référence interne). Utile pour les commandes fournisseurs et la correspondance avec les catalogues fabricants. |
| unit_id | INT FK → units_of_measure | Unité de vente de base du produit (ex. pièce, carton). Détermine comment les quantités sont exprimées dans les commandes et les stocks. |
| tax_rate_id | INT FK → tax_rates | Taux de TVA applicable à la vente de ce produit. Hérité sur les lignes de commande et de facture (mais figé au moment de la transaction). |
| purchase_price_pump | NUMERIC(15,6) | Prix Unitaire Moyen Pondéré (PUMP) courant du produit (RG-STOCK-04). Recalculé à chaque réception selon la formule PUMP = (stock × ancien_PUMP + qté_reçue × prix_achat) / (stock + qté_reçue). Sert à la valorisation du stock et au calcul de marge. |
| sale_price_ht | NUMERIC(15,6) | Prix de vente catalogue hors taxes. Point de départ de la cascade de prix (RG-PRIX-01). Peut être écrasé par des prix contractuels, des promotions ou des paliers quantitatifs. |
| valuation_method | VARCHAR(10) | Méthode de valorisation du stock pour ce produit : `PUMP` (Prix Unitaire Moyen Pondéré) ou `FIFO` (Premier Entré, Premier Sorti) (RG-STOCK-05). Le FIFO nécessite la gestion des lots dans `stock_lots`. |
| is_kit | BOOLEAN | Indique si ce produit est un kit composé d'autres produits (ex. pack bureau = PC + écran + clavier). Si true, la composition est définie dans `product_kit_components` et le stock est géré via les composants. |
| is_perishable | BOOLEAN | Indique si le produit est périssable et nécessite une gestion de DLUO (Date Limite d'Utilisation Optimale). Si true, chaque lot doit avoir une date d'expiration dans `stock_lots`. |
| qty_per_carton | INT | Nombre d'unités par carton/conditionnement standard. Utilisé pour calculer les quantités de commandes par carton entier et optimiser le stockage. |
| weight_gross_kg | NUMERIC(8,3) | Poids brut du produit en kilogrammes (emballage inclus). Utilisé pour calculer le poids des expéditions et les frais de transport. |
| weight_net_kg | NUMERIC(8,3) | Poids net du produit en kilogrammes (sans emballage). Utile pour les déclarations douanières et les fiches techniques. |
| dim_l_cm | NUMERIC(7,2) | Longueur du produit emballé en centimètres. Avec largeur et hauteur, permet de calculer le volume et d'optimiser le remplissage des colis. |
| dim_w_cm | NUMERIC(7,2) | Largeur du produit emballé en centimètres. |
| dim_h_cm | NUMERIC(7,2) | Hauteur du produit emballé en centimètres. |
| status | VARCHAR(20) | Cycle de vie commercial du produit : `active` (commercialisé normalement), `inactive` (temporairement retiré de la vente), `delisting` (en cours de déréférencement, plus de réapprovisionnement). |
| deleted_at | TIMESTAMP | Suppression logique. Un produit supprimé n'apparaît plus dans les formulaires mais ses mouvements de stock et lignes de commande historiques sont conservés. |
| updated_by | INT FK → users | Dernier utilisateur ayant modifié la fiche produit. Complète la traçabilité avec `updated_at`. |
| created_at | TIMESTAMP | Date et heure de création de la fiche produit. |
| updated_at | TIMESTAMP | Date et heure de la dernière modification. Utile pour détecter les changements récents (sync catalogue, cache invalidation). |

### `product_variants`
Décline un produit en variantes selon des attributs différenciants (couleur, taille, capacité…) sans dupliquer toute la fiche produit. Chaque variante hérite des caractéristiques du produit parent sauf celles explicitement surchargées.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la variante. |
| product_id | INT FK → products | Produit parent dont cette variante est une déclinaison. Toutes les caractéristiques non surchargées sont héritées du parent. |
| reference | VARCHAR(35) UNIQUE | Référence unique de la variante, dérivée du parent (ex. NX-INF-00042-BLK pour la version noire). Doit être unique dans tout le catalogue. |
| name | VARCHAR(100) | Nom de la variante décrivant l'attribut différenciant (ex. "Noir 256Go", "Rouge XL", "Version EU"). Affiché en complément du nom du produit parent. |
| sale_price_ht_override | NUMERIC(15,6) | Prix de vente HT spécifique à cette variante. NULL = hérite du `sale_price_ht` du produit parent. Permet de valoriser différemment des variantes premium (ex. plus grande capacité = prix plus élevé). |
| weight_gross_override | NUMERIC(8,3) | Poids brut spécifique à cette variante. NULL = hérite du poids du produit parent. Utile si les variantes ont des poids significativement différents. |
| deleted_at | TIMESTAMP | Suppression logique de la variante. La variante n'est plus proposable à la vente mais l'historique des commandes qui la référencent est conservé. |

### `product_kit_components`
Définit la composition des produits kits. Chaque ligne indique qu'un composant donné entre dans la composition d'un kit avec une quantité précise. Utilisé pour calculer la disponibilité d'un kit (limitée par le composant le plus en rupture).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de composition. |
| kit_product_id | INT FK → products | Produit kit dont on définit la composition. Doit avoir `is_kit = true`. |
| component_product_id | INT FK → products | Produit composant entrant dans le kit. Contrainte CHECK garantit que le composant ≠ le kit lui-même (pas d'auto-référence). |
| quantity | NUMERIC(10,3) | Quantité du composant nécessaire pour assembler une unité du kit (ex. 1 PC + 1 écran + 2 câbles). Décimal pour gérer les composants fractionnaires. |

### `product_images`
Stocke les URLs des images associées à un produit. Les images elles-mêmes sont hébergées sur un stockage externe (S3, CDN). La position détermine l'ordre d'affichage (image principale en position 1).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'image. |
| product_id | INT FK → products | Produit auquel cette image est attachée. |
| url | VARCHAR(500) | URL complète de l'image sur le stockage externe (S3/CDN). Longueur 500 pour les URLs signées longues. |
| position | SMALLINT | Ordre d'affichage des images (1 = image principale/miniature, 2+ = galerie). Permet de réordonner sans modifier les URLs. |

### `product_documents`
Stocke les URLs des documents techniques et réglementaires associés à un produit (fiches techniques, certifications CE, notices, guides d'installation). Consultables par les équipes commerciales et logistiques.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du document. |
| product_id | INT FK → products | Produit auquel ce document est rattaché. |
| name | VARCHAR(200) | Nom descriptif du document (ex. "Fiche technique v2.3", "Certificat CE 2024", "Notice d'installation FR"). |
| url | VARCHAR(500) | URL du document sur le stockage externe. |
| doc_type | VARCHAR(50) | Type de document permettant un filtrage : `fiche_technique` (spécifications, dimensions, performances), `certification` (CE, RoHS, ISO…), `notice`, `guide`. |

---

## 3. Entrepôts & Stocks

### `warehouses`
Référentiel des sites de stockage physiques de l'entreprise. Chaque entrepôt est un site autonome avec sa propre gestion de stock, ses emplacements et ses seuils d'alerte.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'entrepôt. Référencé dans les stocks, les commandes, les transferts et les inventaires. |
| name | VARCHAR(100) | Nom de l'entrepôt (ex. "Entrepôt Paris Nord", "Dépôt Lyon"). Affiché dans l'interface et les documents. |
| code | VARCHAR(10) UNIQUE | Code court unique (ex. "PAR", "LYO", "MRS"). Utilisé dans la génération des codes d'emplacement (ex. PAR-A-03-05). |
| address | TEXT | Adresse postale complète de l'entrepôt. Utilisée pour les bons de livraison, les transferts et la géolocalisation. |
| deleted_at | TIMESTAMP | Suppression logique. Un entrepôt supprimé ne peut plus recevoir de nouvelles opérations mais son historique de stock est conservé. |

### `warehouse_locations`
Représente chaque emplacement physique précis dans un entrepôt (case de rayonnage identifiée par zone + allée + étagère + position). Permet une localisation exacte des produits pour optimiser les opérations de picking et d'inventaire.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'emplacement. |
| warehouse_id | INT FK → warehouses | Entrepôt auquel appartient cet emplacement. |
| code | VARCHAR(30) UNIQUE | Code unique de l'emplacement au format ENTREPÔT-ZONE-ALLÉE-ÉTAGÈRE (ex. PAR-A-03-05). Scannable par code-barres pour le picking et les inventaires. |
| zone | VARCHAR(50) | Zone fonctionnelle de l'entrepôt (ex. "Zone A", "Réserve", "Expédition", "Quarantaine", "Zone froid"). Permet de regrouper les emplacements par type. |
| aisle | VARCHAR(20) | Allée dans la zone (ex. "A", "B", "C"). Utilisée pour trier les listes de picking par ordre de parcours et optimiser les déplacements. |
| shelf | VARCHAR(20) | Étagère dans l'allée (ex. "01", "02", "03"). Combinée à l'allée et au slot, permet de localiser précisément un produit. |
| slot | VARCHAR(20) | Position précise sur l'étagère (ex. "01", "05", "G"). Dernier niveau de granularité de la localisation. |
| is_active | BOOLEAN | Indique si l'emplacement est utilisable. DEFAULT true. Un emplacement inactif (maintenance, dommage) n'apparaît plus dans les suggestions de rangement et de picking. |

### `stock_levels`
Solde de stock courant par combinaison unique produit + variante + entrepôt + emplacement. C'est la table de référence pour connaître la disponibilité en temps réel. Mise à jour atomique à chaque mouvement de stock.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de stock. |
| product_id | INT FK → products | Produit dont on suit le stock. |
| variant_id | INT FK → product_variants | Variante du produit. NULL si le produit n'a pas de variantes. |
| warehouse_id | INT FK → warehouses | Entrepôt concerné. |
| location_id | INT FK → warehouse_locations | Emplacement précis dans l'entrepôt. NULL si le stock n'est pas localisé à l'emplacement. |
| qty_available | NUMERIC(12,3) | Quantité physiquement présente et disponible à la vente. C'est la quantité affichée aux commerciaux pour la prise de commandes. |
| qty_reserved | NUMERIC(12,3) | Quantité réservée pour des commandes clients confirmées mais pas encore expédiées (RG-VTE-03). Cette quantité est physiquement présente mais ne peut plus être vendue. DEFAULT 0. |
| qty_in_transit | NUMERIC(12,3) | Quantité en cours de transfert entre entrepôts (débitée à la source, non encore créditée à la destination). DEFAULT 0. |
| qty_blocked | NUMERIC(12,3) | Quantité bloquée pour contrôle qualité (après réception) ou litige. Non disponible à la vente. DEFAULT 0. |
| qty_consignment | NUMERIC(12,3) | Quantité en stock de consignation (appartient encore au fournisseur, sera facturée à la vente). DEFAULT 0. |
| pump | NUMERIC(15,6) | PUMP (Prix Unitaire Moyen Pondéré) calculé spécifiquement pour cet emplacement. Peut différer du PUMP global si des réceptions à des prix différents ont été stockées séparément. |
| updated_at | TIMESTAMP | Horodatage de la dernière mise à jour du stock. Permet de détecter les stocks non mouvementés depuis longtemps (stocks dormants). |
| UNIQUE | (product_id, variant_id, warehouse_id, location_id) | Contrainte d'unicité garantissant qu'il n'existe qu'une seule ligne de stock par combinaison produit/variante/entrepôt/emplacement. |

### `stock_lots`
Gère les lots de produits pour la valorisation FIFO et la traçabilité des dates limites (DLUO). Chaque lot correspond à une réception à un prix donné et avec une date d'expiration. Indispensable pour les produits périssables et la méthode FIFO.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du lot. |
| product_id | INT FK → products | Produit concerné par ce lot. |
| warehouse_id | INT FK → warehouses | Entrepôt où est stocké ce lot. |
| location_id | INT FK → warehouse_locations | Emplacement précis du lot dans l'entrepôt. |
| lot_number | VARCHAR(100) | Numéro de lot tel qu'indiqué par le fournisseur ou généré à la réception. Permet la traçabilité de bout en bout pour les rappels produits. |
| dluo | DATE | Date Limite d'Utilisation Optimale (ou date d'expiration). NULL pour les produits non périssables. Déclencheur des alertes de stock périssable. |
| quantity_initial | NUMERIC(12,3) | Quantité initiale reçue dans ce lot. Conservée pour calculer le taux d'écoulement et l'historique. |
| quantity_remaining | NUMERIC(12,3) | Quantité encore disponible dans ce lot. Décrémentée à chaque sortie de stock utilisant ce lot. Quand = 0, le lot est épuisé. |
| unit_purchase_price | NUMERIC(15,6) | Prix d'achat unitaire de ce lot (prix de la réception). Fondamental pour la valorisation FIFO : les lots les plus anciens sont consommés en premier à leur prix d'entrée respectif. |
| received_at | TIMESTAMP | Date et heure de réception du lot en entrepôt. Détermine l'ordre de consommation FIFO (les plus anciens en premier). |
| status | VARCHAR(20) | État du lot : `active` (utilisable normalement), `alert` (DLUO dans les X jours configurés), `critical` (DLUO imminente), `expired` (DLUO dépassée, non vendable). |

### `stock_serial_numbers`
Assure la traçabilité individuelle des produits serialisés (numéro de série unique par unité physique). Permet de savoir exactement quel numéro de série a été vendu à quel client, expédié dans quel colis, et son historique complet.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de numéro de série. |
| product_id | INT FK → products | Produit auquel appartient ce numéro de série. |
| serial_number | VARCHAR(100) UNIQUE | Numéro de série unique de l'unité physique (ex. SN20240115-0042). Scannable en entrepôt. Doit être unique dans tout le système. |
| warehouse_id | INT FK → warehouses | Entrepôt où se trouve actuellement ce numéro de série. |
| status | VARCHAR(20) | État actuel du numéro de série : `in_stock` (en stock, disponible), `sold` (vendu et expédié), `returned` (retourné par un client, en attente de contrôle), `scrapped` (mis au rebut). |
| lot_id | INT FK → stock_lots | Lot auquel appartient ce numéro de série. Permet de corréler le suivi de lot avec le suivi individuel. |
| stock_movement_in_id | INT FK → stock_movements | Mouvement d'entrée en stock de cette unité (réception, retour…). Permet de retracer l'origine. |
| stock_movement_out_id | INT FK → stock_movements | Mouvement de sortie de stock de cette unité (expédition, mise au rebut…). NULL si l'unité est encore en stock. |

### `stock_movements`
Journal immuable de tous les mouvements de stock (RG-STOCK-03). Chaque entrée, sortie ou transfert de produit génère une ligne dans cette table. Aucun mouvement ne peut être modifié ou supprimé — c'est le livre de bord comptable du stock. Permet de reconstituer l'historique complet du stock à n'importe quelle date.

| Colonne | Type | Notes |
|---------|------|-------|
| id | BIGSERIAL PK | Identifiant grand entier car le volume est potentiellement très élevé (des millions de mouvements sur plusieurs années d'exploitation). |
| product_id | INT FK → products | Produit concerné par le mouvement. |
| variant_id | INT FK → product_variants | Variante concernée. NULL si pas de variante. |
| warehouse_id_from | INT FK → warehouses | Entrepôt source du mouvement. NULL pour les entrées pures (réceptions, retours entrants). |
| warehouse_id_to | INT FK → warehouses | Entrepôt destination du mouvement. NULL pour les sorties pures (ventes, mises au rebut). |
| location_id_from | INT FK → warehouse_locations | Emplacement source précis dans l'entrepôt d'origine. |
| location_id_to | INT FK → warehouse_locations | Emplacement destination précis dans l'entrepôt cible. |
| movement_type | VARCHAR(10) | Type de mouvement standardisé : `ENT_ACH` (entrée achat/réception), `SOR_VTE` (sortie vente/expédition), `TRF_INT` (transfert interne entre entrepôts), `ENT_RET` (entrée retour client), `SOR_REB` (sortie rebut), `AJU_INV` (ajustement inventaire), `ENT_FAB` (entrée fabrication/assemblage). |
| quantity | NUMERIC(12,3) | Quantité du mouvement. Toujours positive. Le sens (entrée/sortie) est déterminé par `movement_type` et les champs `from`/`to`. |
| unit_price_pump | NUMERIC(15,6) | PUMP de l'unité au moment précis du mouvement (RG-STOCK-06). Figé pour garantir la cohérence des valorisations historiques même si le PUMP évolue ensuite. |
| lot_id | INT FK → stock_lots | Lot concerné par ce mouvement. NULL si le produit n'est pas géré par lot. |
| serial_number_id | INT FK → stock_serial_numbers | Numéro de série concerné. NULL si le produit n'est pas sérialisé. |
| reference_type | VARCHAR(50) | Type du document d'origine ayant généré ce mouvement (ex. `purchase_orders`, `sales_orders`, `transfers`, `inventory_sessions`). Clé de la relation polymorphique. |
| reference_id | INT | Identifiant du document d'origine (combiné avec `reference_type` pour retrouver la commande, le transfert ou l'inventaire source). |
| user_id | INT FK → users | Utilisateur ayant déclenché le mouvement (magasinier, système automatique). |
| notes | TEXT | Commentaire libre sur le mouvement (ex. raison d'un ajustement d'inventaire, description d'un rebut). |
| created_at | TIMESTAMP | Horodatage exact du mouvement. Non modifiable. Permet l'audit et la reconstitution du stock à date. |

### `stock_thresholds`
Définit les seuils d'alerte et de réapprovisionnement par produit et par entrepôt (RG-STOCK-07 à RG-STOCK-10). Ces valeurs alimentent les alertes automatiques et les suggestions de commande.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du seuil. |
| product_id | INT FK → products | Produit concerné par ces seuils. |
| warehouse_id | INT FK → warehouses | Entrepôt pour lequel ces seuils sont définis. Chaque entrepôt peut avoir des seuils différents pour un même produit. |
| alert_threshold | NUMERIC(12,3) | Seuil d'alerte (RG-STOCK-07) : quand `qty_available` passe en dessous, une notification de type `stock_alert` est envoyée. Invite à anticiper le réapprovisionnement. |
| critical_threshold | NUMERIC(12,3) | Seuil critique (RG-STOCK-08) : en dessous de ce niveau, le stock est en rupture imminente. Déclenche une alerte prioritaire et peut bloquer certaines fonctionnalités. |
| safety_stock | NUMERIC(12,3) | Stock de sécurité calculé pour absorber les variabilités de la demande et des délais de livraison. Sert de tampon entre le point de commande et la rupture réelle. |
| reorder_point | NUMERIC(12,3) | Point de commande : niveau de stock auquel il faut déclencher une commande fournisseur pour ne pas tomber en rupture avant la livraison (intègre le délai fournisseur et la consommation moyenne). |
| eoq | NUMERIC(12,3) | Quantité Économique de Commande (formule de Wilson) : quantité optimale à commander pour minimiser les coûts de stockage et de passation de commande. Calculée automatiquement à partir des données historiques. |

---

## 4. Fournisseurs

### `suppliers`
Référentiel de tous les fournisseurs de l'entreprise. Centralise les informations administratives, commerciales et de performance pour rationaliser les achats et suivre la qualité fournisseur.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du fournisseur. |
| code | VARCHAR(20) UNIQUE | Code fournisseur unique au format FOUR-NNNNN (ex. FOUR-00001). Utilisé sur les bons de commande et les documents d'achat. |
| company_name | VARCHAR(200) | Raison sociale officielle du fournisseur telle qu'elle apparaît sur les documents légaux et commerciaux. |
| legal_form | VARCHAR(50) | Forme juridique de la société (ex. "SAS", "SARL", "SA", "GmbH", "Ltd"). Nécessaire pour les documents légaux. |
| siret | VARCHAR(14) | Numéro SIRET à 14 chiffres (uniquement pour les entreprises françaises). Identifiant légal unique de l'établissement. |
| vat_number | VARCHAR(20) | Numéro de TVA intracommunautaire (ex. FR12345678901). Obligatoire pour les achats en Europe, détermine l'autoliquidation de TVA. |
| payment_terms_days | SMALLINT | Délai de paiement négocié en jours (ex. 30, 45, 60). Sert à calculer automatiquement la date d'échéance des factures fournisseurs. |
| payment_terms_type | VARCHAR(30) | Type de calcul du délai (ex. `net_30` = 30 jours nets, `end_of_month_30` = fin de mois + 30 jours). Certains fournisseurs appliquent des règles spécifiques. |
| global_discount_rate | NUMERIC(5,4) | Taux de remise globale négociée avec ce fournisseur, applicable sur toutes les commandes (ex. 0.0500 = 5%). Appliqué automatiquement sur les bons de commande. |
| franco_amount_ht | NUMERIC(15,2) | Montant minimum de commande HT à partir duquel les frais de port sont offerts. En dessous de ce seuil, des frais de transport s'ajoutent à la commande. |
| preferred_currency | VARCHAR(3) | Devise préférée du fournisseur pour les transactions (code ISO 4217 : EUR, USD, GBP…). Détermine la devise par défaut des bons de commande. |
| quality_score | NUMERIC(5,2) | Score de qualité fournisseur sur 100 (RG-FOUR-03). Calculé automatiquement à partir du taux de conformité des livraisons, des délais respectés et des litiges. Aide à choisir entre fournisseurs alternatifs. |
| status | VARCHAR(20) | État du fournisseur : `active` (en activité commerciale normale), `inactive` (temporairement suspendu, pas de nouvelles commandes). |
| deleted_at | TIMESTAMP | Suppression logique. Un fournisseur supprimé conserve son historique de commandes et de factures. |
| created_at | TIMESTAMP | Date de référencement du fournisseur dans le système. |

### `supplier_addresses`
Gère les différentes adresses d'un fournisseur (siège social, adresse de facturation, adresse d'expédition/collecte). Un fournisseur peut avoir plusieurs adresses de types différents.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'adresse. |
| supplier_id | INT FK → suppliers | Fournisseur auquel appartient cette adresse. |
| type | VARCHAR(20) | Type d'adresse : `headquarters` (siège social), `billing` (adresse de facturation pour les avoirs), `shipping` (adresse de collecte/enlèvement). |
| address | TEXT | Rue et numéro complets. |
| city | VARCHAR(100) | Ville. |
| postal_code | VARCHAR(10) | Code postal. Longueur 10 pour couvrir les formats internationaux. |
| country | VARCHAR(2) | Code pays ISO 3166-1 alpha-2 (ex. FR, DE, GB, CN). |
| is_default | BOOLEAN | Indique l'adresse principale utilisée par défaut sur les bons de commande. Un seul enregistrement par `supplier_id` et `type` devrait avoir `is_default = true`. |

### `supplier_contacts`
Répertoire des interlocuteurs chez un fournisseur, classés par rôle (commercial, comptabilité, SAV, logistique). Permet de contacter directement la bonne personne selon le motif.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du contact. |
| supplier_id | INT FK → suppliers | Fournisseur auquel appartient ce contact. |
| full_name | VARCHAR(150) | Nom complet du contact (ex. "Marie Lambert"). |
| role | VARCHAR(50) | Fonction du contact chez le fournisseur : `commercial` (suivi des commandes, négociation), `accounting` (facturation, paiements), `sav` (service après-vente, litiges qualité), `logistics` (suivi des expéditions, enlèvements). |
| email | VARCHAR(254) | Adresse email du contact. Utilisée pour les envois de bons de commande et les relances. |
| phone | VARCHAR(20) | Numéro de téléphone. Format libre pour gérer les formats internationaux. |

### `supplier_products`
Catalogue des produits proposés par chaque fournisseur avec leurs conditions commerciales spécifiques (RG-FOUR-01). Un même produit peut être référencé chez plusieurs fournisseurs avec des prix et délais différents. La notion de fournisseur principal et alternatif est gérée ici.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la référence fournisseur. |
| supplier_id | INT FK → suppliers | Fournisseur qui propose ce produit. |
| product_id | INT FK → products | Produit interne correspondant à la référence fournisseur. |
| supplier_reference | VARCHAR(100) | Référence du produit dans le catalogue du fournisseur (différente de la référence interne NX-…). Indiquée sur les bons de commande pour que le fournisseur identifie le produit. |
| catalog_price_ht | NUMERIC(15,6) | Prix catalogue public du fournisseur, avant négociation. Sert de référence pour mesurer les remises obtenues. |
| negotiated_price_ht | NUMERIC(15,6) | Prix d'achat négocié HT, applicable lors des commandes. C'est ce prix qui est utilisé par défaut sur les lignes de bon de commande. |
| min_order_qty | NUMERIC(10,3) | Quantité Minimum de Commande (QMC) exigée par le fournisseur. En dessous de cette quantité, le fournisseur refuse la commande ou applique un surcoût. |
| packaging_qty | NUMERIC(10,3) | Quantité de conditionnement : les commandes doivent être multiples de cette valeur (ex. par carton de 12). Utilisé pour arrondir les suggestions de commande. |
| is_primary | BOOLEAN | Indique si ce fournisseur est le fournisseur principal pour ce produit. Un seul fournisseur principal par produit. Les autres sont des alternatifs. |
| priority_rank | SMALLINT | Rang de priorité parmi les fournisseurs alternatifs (1 = première alternative, 2 = deuxième…). Utilisé pour suggérer automatiquement le meilleur fournisseur disponible. |
| delivery_delay_days | SMALLINT | Délai de livraison habituel en jours ouvrés de ce fournisseur pour ce produit. Utilisé pour calculer le point de commande et la date de livraison prévisionnelle. |
| deleted_at | TIMESTAMP | Suppression logique de la référence fournisseur (déréférencement du produit chez ce fournisseur). |
| UNIQUE | (supplier_id, product_id) | Garantit qu'un fournisseur ne référence un produit qu'une seule fois dans son catalogue. |

---

## 5. Achats (Commandes fournisseurs)

### `purchase_orders`
Gère l'intégralité du cycle d'achat : de la rédaction du bon de commande (BC) jusqu'à sa clôture après réception et rapprochement de facture. Chaque BC est horodaté à chaque changement de statut pour audit complet.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du bon de commande. |
| reference | VARCHAR(30) UNIQUE | Numéro de BC unique au format BC-AAAA-MM-NNNNN (ex. BC-2024-03-00042). Mentionné dans toute la correspondance fournisseur. |
| supplier_id | INT FK → suppliers | Fournisseur destinataire du bon de commande. |
| warehouse_id | INT FK → warehouses | Entrepôt de destination où la marchandise doit être livrée. |
| status | VARCHAR(25) | Statut du BC dans son cycle de vie : `DRAFT` (brouillon en cours de rédaction), `VALIDATED` (validé en interne), `SENT` (envoyé au fournisseur), `CONFIRMED` (confirmé par le fournisseur), `IN_TRANSIT` (marchandise en cours d'acheminement), `PARTIAL` (réception partielle), `RECEIVED` (totalement réceptionné), `CLOSED` (clôturé après rapprochement), `CANCELLED` (annulé), `DISPUTE` (litige en cours). |
| total_ht | NUMERIC(15,2) | Montant total HT de la commande (somme des lignes après remises). Calculé automatiquement. |
| total_ttc | NUMERIC(15,2) | Montant total TTC de la commande. |
| currency | VARCHAR(3) | Devise de la commande (ISO 4217). Peut différer de l'EUR pour les fournisseurs étrangers. |
| exchange_rate | NUMERIC(10,6) | Taux de change figé au moment de la validation (RG-GEN-04). Garantit que les montants en devise locale restent stables même si le cours évolue. |
| payment_terms_days | SMALLINT | Délai de paiement applicable à cette commande spécifique (peut différer des conditions par défaut du fournisseur). |
| requested_delivery_date | DATE | Date de livraison souhaitée par l'acheteur. Communiquée au fournisseur dans le BC. Sert de référence pour mesurer les retards. |
| validated_by | INT FK → users | Utilisateur ayant validé le BC (généralement le responsable achats). Piste d'audit de la validation. |
| validated_at | TIMESTAMP | Horodatage de la validation. |
| sent_at | TIMESTAMP | Horodatage de l'envoi au fournisseur (par email, EDI…). |
| confirmed_at | TIMESTAMP | Horodatage de la confirmation de réception par le fournisseur. |
| closed_at | TIMESTAMP | Horodatage de la clôture du BC (après rapprochement facture complet). |
| notes | TEXT | Instructions particulières au fournisseur (conditionnement spécial, références d'expédition, délais impératifs…). |
| created_by | INT FK → users | Acheteur ayant rédigé le bon de commande. |
| deleted_at | TIMESTAMP | Annulation logique. Un BC annulé est conservé pour l'audit mais n'impacte plus le stock ni les engagements. |
| created_at | TIMESTAMP | Date de création du BC. |
| updated_at | TIMESTAMP | Date de dernière modification. |

### `purchase_order_lines`
Détail des produits commandés dans un bon de commande. Chaque ligne représente un produit avec sa quantité, son prix et son avancement de réception.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de commande. |
| purchase_order_id | INT FK → purchase_orders | BC auquel appartient cette ligne. |
| product_id | INT FK → products | Produit commandé. |
| supplier_reference | VARCHAR(100) | Référence du produit dans le catalogue fournisseur (copié depuis `supplier_products.supplier_reference` pour figer la valeur au moment de la commande). |
| quantity_ordered | NUMERIC(12,3) | Quantité commandée pour ce produit. |
| quantity_received | NUMERIC(12,3) | Quantité effectivement reçue à ce jour (cumulatif des réceptions). Comparée à `quantity_ordered` pour détecter les livraisons partielles. DEFAULT 0. |
| unit_price_ht | NUMERIC(15,6) | Prix d'achat unitaire HT négocié et figé au moment de la commande. Ne change pas si le tarif fournisseur évolue ensuite. |
| discount_rate | NUMERIC(5,4) | Taux de remise spécifique à cette ligne (ex. 0.0300 = 3%). S'ajoute à la remise globale fournisseur. |
| total_ht | NUMERIC(15,2) | Montant HT de la ligne = quantité × prix unitaire × (1 - remise). Calculé et stocké pour les totaux du BC. |
| notes | TEXT | Précisions sur la ligne (ex. couleur, configuration, conditionnement particulier). |

### `purchase_receptions`
Enregistre chaque acte de réception physique de marchandises. Un BC peut donner lieu à plusieurs réceptions (livraisons partielles). Chaque réception est horodatée et attribuée au magasinier l'ayant effectuée.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la réception. |
| purchase_order_id | INT FK → purchase_orders | BC dont cette réception est une livraison (partielle ou totale). |
| received_by | INT FK → users | Magasinier ayant effectué la réception physique et saisi les quantités reçues. |
| received_at | TIMESTAMP | Date et heure de réception effective en entrepôt. Déclenche la mise à jour des stocks et le calcul du nouveau PUMP. |
| notes | TEXT | Observations lors de la réception (emballage endommagé, écarts constatés, instructions CQ). |
| status | VARCHAR(20) | État de la réception : `pending` (saisie en cours), `complete` (toutes les lignes validées), `qc_pending` (en attente de contrôle qualité), `closed` (intégralement traitée). |

### `purchase_reception_lines`
Détail de chaque produit reçu lors d'une réception. Permet d'affecter les marchandises à des emplacements précis, de créer des lots et de bloquer une partie pour contrôle qualité.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de réception. |
| reception_id | INT FK → purchase_receptions | Réception à laquelle appartient cette ligne. |
| purchase_order_line_id | INT FK → purchase_order_lines | Ligne de BC correspondante (pour mise à jour de `quantity_received`). |
| product_id | INT FK → products | Produit reçu (dénormalisé pour faciliter les requêtes de stock sans jointure sur le BC). |
| quantity_received | NUMERIC(12,3) | Quantité effectivement comptée et réceptionnée pour ce produit lors de cette réception. |
| location_id | INT FK → warehouse_locations | Emplacement de rangement en entrepôt. Déclenche la mise à jour de `stock_levels` à cet emplacement précis. |
| lot_number | VARCHAR(100) | Numéro de lot attribué à cette livraison (saisi depuis l'étiquette fournisseur ou généré en interne). Crée un enregistrement dans `stock_lots`. |
| dluo | DATE | Date Limite d'Utilisation Optimale saisie depuis l'étiquette du lot reçu. NULL si produit non périssable. |
| unit_price_ht | NUMERIC(15,6) | Prix d'achat unitaire réel de cette réception (peut différer du prix BC en cas d'avoir, de pénalité ou d'erreur fournisseur corrigée). Sert au recalcul du PUMP. |
| quantity_qc_blocked | NUMERIC(12,3) | Quantité mise en quarantaine pour contrôle qualité (RG-ACH-05 : échantillonnage 5%). Ces articles ne rejoignent pas le stock disponible tant que le CQ n'a pas validé. |
| qc_released_at | TIMESTAMP | Horodatage de la libération du stock qualité. NULL tant que le contrôle n'est pas finalisé. |

### `supplier_invoices`
Gère les factures reçues des fournisseurs et leur rapprochement 3 voies (three-way matching) : bon de commande + réception + facture (RG-ACH-07). Ce rapprochement garantit qu'on ne paie que ce qui a été commandé ET réceptionné au prix convenu.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la facture fournisseur. |
| supplier_id | INT FK → suppliers | Fournisseur émetteur de la facture. |
| purchase_order_id | INT FK → purchase_orders | BC correspondant à cette facture (premier voie du rapprochement). |
| reception_id | INT FK → purchase_receptions | Réception correspondant à cette facture (second voie du rapprochement). |
| reference | VARCHAR(100) | Numéro de facture tel qu'imprimé sur le document fournisseur. Utilisé pour le rapprochement bancaire et les échanges fournisseur. |
| total_ht | NUMERIC(15,2) | Montant HT de la facture fournisseur. Comparé au BC et à la réception pour détecter les écarts. |
| total_ttc | NUMERIC(15,2) | Montant TTC de la facture. Montant qui sera effectivement décaissé (hors autoliquidation). |
| issue_date | DATE | Date d'émission de la facture par le fournisseur. Point de départ du délai de paiement. |
| due_date | DATE | Date d'échéance de paiement calculée (issue_date + payment_terms_days). Alimentée dans le prévisionnel de trésorerie. |
| status | VARCHAR(20) | Statut du rapprochement : `pending` (reçue, rapprochement en cours), `matched` (rapprochement 3 voies réussi, prête à payer), `disputed` (écart détecté, litige en cours), `paid` (paiement effectué). |
| matched_at | TIMESTAMP | Horodatage du rapprochement 3 voies réussi. Déclenche le processus de mise en paiement. |

---

## 6. Clients

### `customers`
Référentiel de tous les clients de l'entreprise (B2B et B2C). Centralise les informations administratives, commerciales et de suivi financier (encours, score RFM) nécessaires à la gestion de la relation client.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du client. |
| code | VARCHAR(20) UNIQUE | Code client unique (CLI-PRO-NNNNN pour B2B, CLI-PAR-NNNNN pour B2C). Identifiant externe utilisé sur les documents commerciaux. |
| type | VARCHAR(5) | Type de client : `B2B` (professionnel/entreprise, TVA déductible, conditions négociées) ou `B2C` (particulier, prix TTC, pas de conditions spéciales). Détermine les règles de TVA et de tarification. |
| company_name | VARCHAR(200) | Raison sociale (pour les clients B2B). NULL pour les particuliers. |
| first_name | VARCHAR(100) | Prénom (pour les clients B2C). NULL pour les entreprises. |
| last_name | VARCHAR(100) | Nom de famille (pour les clients B2C). NULL pour les entreprises. |
| siret | VARCHAR(14) | Numéro SIRET du client B2B. Permet la vérification légale et la facturation conforme. |
| vat_number | VARCHAR(20) | Numéro de TVA intracommunautaire du client B2B. Détermine si la TVA s'applique sur les ventes intra-UE (autoliquidation). |
| payment_terms_days | SMALLINT | Délai de paiement accordé à ce client (ex. 30, 45 jours). Détermine la date d'échéance des factures émises. |
| global_discount_rate | NUMERIC(5,4) | Taux de remise commerciale globale accordée à ce client sur toutes ses commandes. S'applique avant les remises spécifiques et les promotions. |
| credit_limit | NUMERIC(15,2) | Encours maximum autorisé (plafond de crédit). Quand `outstanding_balance` dépasse cette valeur, de nouvelles commandes peuvent être bloquées en attente de paiement. |
| outstanding_balance | NUMERIC(15,2) | Encours courant du client : somme des factures émises et non encore réglées. Mis à jour à chaque nouvelle facture et chaque paiement. Comparé à `credit_limit` pour le contrôle de crédit. |
| price_group | VARCHAR(20) | Groupe tarifaire du client, déterminant la grille de prix applicable : `STANDARD` (tarif catalogue), `RESELLER` (revendeur, remise volume), `BIG_ACCOUNT` (grand compte, conditions spéciales), `VIP` (client stratégique, prix sur mesure). |
| commercial_user_id | INT FK → users | Commercial responsable de ce client (chargé de compte). Permet le filtrage par portefeuille client et le calcul des commissions. |
| rfm_score | NUMERIC(5,2) | Score RFM calculé automatiquement : combine la Récence (date dernier achat), la Fréquence (nombre de commandes) et la valeur Monétaire (CA généré). Aide à segmenter les clients pour les actions marketing. |
| status | VARCHAR(20) | État commercial du client : `active` (client régulier), `inactive` (plus d'activité récente), `blocked` (encours dépassé ou litige, nouvelles commandes refusées), `prospect` (pas encore passé de commande). |
| deleted_at | TIMESTAMP | Suppression logique. Un client supprimé conserve son historique de commandes et de factures. |
| created_at | TIMESTAMP | Date de création du compte client. |
| updated_at | TIMESTAMP | Date de dernière mise à jour du dossier client. |

### `customer_addresses`
Gère les multiples adresses d'un client (facturation et livraison). Un client B2B peut avoir plusieurs sites de livraison (entrepôts, agences) et des adresses de facturation distinctes.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'adresse. |
| customer_id | INT FK → customers | Client auquel appartient cette adresse. |
| type | VARCHAR(10) | Type d'adresse : `billing` (facturation, apparaît sur les factures), `shipping` (livraison, apparaît sur les bons de livraison et étiquettes transport). |
| label | VARCHAR(100) | Libellé interne de l'adresse pour distinguer les multiples sites (ex. "Entrepôt Lyon", "Siège Paris", "Agence Marseille"). |
| address | TEXT | Rue, numéro et compléments d'adresse. |
| city | VARCHAR(100) | Ville. |
| postal_code | VARCHAR(10) | Code postal. |
| country | VARCHAR(2) | Code pays ISO 3166-1 alpha-2. |
| is_default | BOOLEAN | Adresse pré-sélectionnée par défaut lors de la création d'une commande pour ce type (billing ou shipping). |

### `customer_contacts`
Répertoire des interlocuteurs chez un client (directeur commercial, comptable, responsable logistique…). Permet d'adresser les documents et les relances à la bonne personne.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du contact. |
| customer_id | INT FK → customers | Client auquel appartient ce contact. |
| full_name | VARCHAR(150) | Nom complet du contact. |
| role | VARCHAR(50) | Fonction du contact chez le client (ex. "Directeur achats", "Comptable", "Responsable logistique", "Gérant"). |
| email | VARCHAR(254) | Email du contact. Utilisé pour les envois de factures, confirmations de commandes et relances de paiement. |
| phone | VARCHAR(20) | Numéro de téléphone du contact. |

---

## 7. Ventes (Commandes clients)

### `sales_orders`
Table centrale du cycle de vente. Gère à la fois les devis (QUOTE) et les commandes fermes (ORDER) avec l'intégralité de leur cycle de vie : de la création jusqu'à la livraison et la facturation (RG-VTE-01 à RG-VTE-05).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la commande/devis. |
| reference | VARCHAR(30) UNIQUE | Numéro de commande unique (ex. DEV-2024-03-00001 pour un devis, CMD-2024-03-00042 pour une commande ferme). |
| type | VARCHAR(10) | Nature du document : `QUOTE` (devis, non engageant, peut expirer), `ORDER` (commande ferme, engageante, déclenche la réservation de stock). |
| customer_id | INT FK → customers | Client passant la commande. |
| billing_address_id | INT FK → customer_addresses | Adresse de facturation sélectionnée pour cette commande. Figée au moment de la commande. |
| shipping_address_id | INT FK → customer_addresses | Adresse de livraison sélectionnée. Détermine les frais de transport et les délais de livraison. |
| commercial_user_id | INT FK → users | Commercial ayant créé ou gérant cette commande. Permet le suivi du portefeuille et le calcul des commissions. |
| status | VARCHAR(20) | Statut dans le cycle de vie : `QUOTE` (devis ouvert), `ORDER` (commande confirmée), `PICKING` (en cours de préparation en entrepôt), `SHIPPED` (expédié), `DELIVERED` (livré et confirmé), `INVOICED` (facturé), `PAID` (entièrement payé), `CANCELLED` (annulé), `EXPIRED` (devis expiré sans confirmation). |
| total_ht | NUMERIC(15,2) | Montant total HT de la commande (somme des lignes après remises sur ligne). |
| discount_rate | NUMERIC(5,4) | Remise commerciale globale sur l'ensemble de la commande, appliquée après les remises par ligne. |
| total_ttc | NUMERIC(15,2) | Montant total TTC. Montant affiché au client B2C et sur les factures. |
| shipping_cost_ht | NUMERIC(15,2) | Frais de livraison HT facturés au client. 0 si franco de port. |
| carrier | VARCHAR(100) | Transporteur sélectionné pour cette commande (ex. "Chronopost", "DHL", "DB Schenker"). |
| shipping_mode | VARCHAR(30) | Mode d'expédition : `standard` (délai normal J+3 à J+5), `express` (J+1), `pickup` (retrait en entrepôt). |
| payment_terms_days | SMALLINT | Délai de paiement accordé pour cette commande spécifique (peut différer des conditions habituelles du client). |
| currency | VARCHAR(3) | Devise de la commande (ISO 4217). |
| exchange_rate | NUMERIC(10,6) | Taux de change figé à la date de commande (RG-GEN-04). |
| valid_until | DATE | Date d'expiration du devis (RG-VTE-01). Après cette date, le devis passe automatiquement en `EXPIRED` et ne peut plus être confirmé sans revalidation du prix. |
| backorder_option | VARCHAR(20) | Comportement en cas de rupture de stock partielle : `PARTIAL` (livrer ce qui est disponible, le reste en rupture), `FULL_WAIT` (attendre d'avoir tout en stock avant d'expédier), `SUBSTITUTE` (remplacer par un produit de substitution). |
| notes | TEXT | Instructions particulières du client ou du commercial (ex. "Livrer avant 9h", "Palette filmée obligatoire", "Contacter M. Dupont à la livraison"). |
| confirmed_at | TIMESTAMP | Horodatage de confirmation de la commande ferme (passage de QUOTE à ORDER ou création directe en ORDER). |
| cancelled_at | TIMESTAMP | Horodatage d'annulation. NULL si non annulée. |
| deleted_at | TIMESTAMP | Suppression logique (rare : les annulations sont préférables). |
| created_by | INT FK → users | Utilisateur ayant créé le document (commercial, ADV…). |
| created_at | TIMESTAMP | Date de création. |
| updated_at | TIMESTAMP | Date de dernière modification. |

### `sales_order_lines`
Lignes détaillées d'une commande client. Chaque ligne représente un produit/variante avec sa quantité, son prix et son état de préparation/expédition.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne. |
| sales_order_id | INT FK → sales_orders | Commande à laquelle appartient cette ligne. |
| product_id | INT FK → products | Produit commandé. |
| variant_id | INT FK → product_variants | Variante commandée. NULL si le produit n'a pas de variante. |
| quantity | NUMERIC(12,3) | Quantité commandée par le client. |
| quantity_reserved | NUMERIC(12,3) | Quantité physiquement réservée dans le stock pour cette ligne (RG-VTE-03). Déduite de `stock_levels.qty_available` et ajoutée à `qty_reserved`. |
| quantity_shipped | NUMERIC(12,3) | Quantité déjà expédiée dans le cadre d'expéditions partielles. DEFAULT 0. |
| unit_price_ht | NUMERIC(15,6) | Prix unitaire HT après application de la cascade de prix complète (RG-PRIX-01 : tarif catalogue → groupe client → prix contractuel → promotion → remise commerciale). Figé à la validation. |
| discount_rate | NUMERIC(5,4) | Remise spécifique à cette ligne de commande (en plus de la remise globale). |
| total_ht | NUMERIC(15,2) | Montant HT de la ligne = quantité × prix unitaire × (1 - remise). |
| tax_rate_id | INT FK → tax_rates | Taux de TVA applicable à cette ligne (hérité du produit mais figé au moment de la commande). |
| promo_id | INT FK → promotions | Promotion appliquée sur cette ligne. NULL si aucune promotion. Permet de tracer l'origine des remises. |
| substitute_product_id | INT FK → products | Produit de substitution proposé en cas de rupture du produit principal (si `backorder_option = SUBSTITUTE`). |
| status | VARCHAR(20) | État de la ligne : `available` (stock disponible, peut être préparé), `backordered` (en rupture, en attente de réapprovisionnement), `cancelled` (ligne annulée). |

### `picking_lists`
Document de préparation de commande remis aux magasiniers. Liste les produits à prélever dans l'entrepôt pour préparer une ou plusieurs commandes. Supporte le picking mono-commande (SINGLE) et le wave picking (WAVE, préparation groupée de plusieurs commandes en un seul passage).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la liste de picking. |
| type | VARCHAR(10) | Mode de picking : `SINGLE` (une liste = une commande client, simple), `WAVE` (une liste regroupe plusieurs commandes, optimise les déplacements en entrepôt). |
| wave_batch_reference | VARCHAR(50) | Référence du batch de wave picking (RG-PREP-01). Permet de regrouper et d'identifier les listes issues du même batch de préparation groupée. |
| generated_at | TIMESTAMP | Horodatage de génération de la liste. Déclenche la réservation de stock si ce n'est pas déjà fait. |
| completed_at | TIMESTAMP | Horodatage de fin de picking (tous les articles prélevés). NULL tant que la préparation n'est pas terminée. |
| user_id | INT FK → users | Magasinier assigné à la préparation de cette liste. |

### `picking_list_items`
Détail des articles à prélever dans une liste de picking. Chaque ligne indique où aller (emplacement), quoi prendre (produit, lot, numéro de série) et combien. Triée par allée pour optimiser les déplacements.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'article à prélever. |
| picking_list_id | INT FK → picking_lists | Liste de picking à laquelle appartient cet article. |
| sales_order_line_id | INT FK → sales_order_lines | Ligne de commande client correspondante. Permet la mise à jour de `quantity_shipped` après picking. |
| product_id | INT FK → products | Produit à prélever (dénormalisé pour l'affichage rapide sans jointure). |
| location_id | INT FK → warehouse_locations | Emplacement exact où prélever le produit. Trié par allée dans la liste pour optimiser le trajet du magasinier. |
| lot_id | INT FK → stock_lots | Lot à prélever en priorité (déterminé par la méthode FIFO ou la DLUO la plus proche). |
| serial_number_id | INT FK → stock_serial_numbers | Numéro de série spécifique à prélever (pour les produits sérialisés). |
| quantity_to_pick | NUMERIC(12,3) | Quantité à prélever pour cet article. |
| quantity_picked | NUMERIC(12,3) | Quantité effectivement prélevée par le magasinier (peut différer de `quantity_to_pick` en cas de rupture constatée lors du picking). |
| picked_at | TIMESTAMP | Horodatage du prélèvement. NULL tant que l'article n'a pas été prélevé. |

### `shipments`
Enregistre chaque expédition physique effectuée vers un client. Une commande peut donner lieu à plusieurs expéditions (livraisons partielles). Contient les informations de transport (transporteur, tracking) et les données pour le bon de livraison.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'expédition. |
| sales_order_id | INT FK → sales_orders | Commande client dont cette expédition est la livraison (totale ou partielle). |
| picking_list_id | INT FK → picking_lists | Liste de picking à l'origine de cette expédition. |
| reference | VARCHAR(50) | Numéro de bon de livraison (BL) interne, mentionné sur le colis et sur la facture correspondante. |
| carrier | VARCHAR(100) | Transporteur utilisé pour cette expédition (ex. "Chronopost", "DHL Express", "Geodis"). |
| tracking_number | VARCHAR(200) | Numéro de suivi transporteur. Permet au client et aux équipes de suivre l'acheminement en temps réel. |
| shipped_at | TIMESTAMP | Date et heure d'expédition effective (remise au transporteur). Déclenche la mise à jour du stock et la génération du bon de livraison. |
| weight_kg | NUMERIC(8,3) | Poids total de l'expédition en kilogrammes. Utilisé pour vérifier les frais de transport et la conformité avec les limites transporteur. |
| packages_count | SMALLINT | Nombre de colis dans l'expédition. Mentionné sur le bon de livraison et les étiquettes transport. |
| shipping_cost_ht | NUMERIC(15,2) | Coût réel de transport HT pour cette expédition (peut différer du montant facturé au client). |
| notes | TEXT | Instructions spéciales pour la livraison (ex. "Fragile", "Haut de palette", "Appeler avant livraison"). |

### `shipment_lines`
Détail des produits inclus dans une expédition. Permet de savoir exactement quels articles (avec quel lot et quel numéro de série) ont été expédiés dans chaque colis/livraison.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne d'expédition. |
| shipment_id | INT FK → shipments | Expédition à laquelle appartient cette ligne. |
| sales_order_line_id | INT FK → sales_order_lines | Ligne de commande client correspondante (pour mise à jour de `quantity_shipped`). |
| product_id | INT FK → products | Produit expédié (dénormalisé pour le bon de livraison). |
| quantity | NUMERIC(12,3) | Quantité expédiée pour ce produit dans cette livraison. |
| lot_id | INT FK → stock_lots | Lot prélevé pour cette expédition (traçabilité FIFO/DLUO). |
| serial_number_id | INT FK → stock_serial_numbers | Numéro de série expédié (pour les produits sérialisés). Lie définitivement le numéro de série à cette commande client. |

---

## 8. Facturation

### `invoices`
Gère les factures clients et les avoirs. Une fois émise, une facture est immuable (RG-FACT-01). Pour corriger une facture, il faut émettre un avoir (CREDIT_NOTE) qui référence la facture d'origine. Suit le cycle de vie du règlement jusqu'au contentieux.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la facture ou de l'avoir. |
| reference | VARCHAR(30) UNIQUE | Numéro unique séquentiel au format FACT-AAAA-NNNNN (facture) ou AVO-AAAA-NNNNN (avoir). La numérotation séquentielle sans trous est une obligation légale. |
| type | VARCHAR(10) | Nature du document : `INVOICE` (facture de vente), `CREDIT_NOTE` (avoir, document rectificatif en négatif). |
| original_invoice_id | INT FK → invoices | Pour les avoirs uniquement : référence la facture originale que cet avoir vient corriger ou annuler. NULL pour les factures. |
| customer_id | INT FK → customers | Client facturé. |
| status | VARCHAR(20) | Statut de règlement : `draft` (brouillon, non émis), `issued` (émis et envoyé au client), `partially_paid` (acompte reçu), `paid` (intégralement réglé), `overdue` (en retard de paiement, délai dépassé), `litigation` (contentieux en cours, dossier confié au recouvrement). |
| total_ht | NUMERIC(15,2) | Montant total HT de la facture. |
| total_vat | NUMERIC(15,2) | Montant de TVA total. Détaillé par taux dans `invoice_lines`. |
| total_ttc | NUMERIC(15,2) | Montant total TTC. Montant dû par le client. |
| currency | VARCHAR(3) | Devise de facturation (ISO 4217). |
| exchange_rate | NUMERIC(10,6) | Taux de change figé à la date d'émission de la facture. |
| issue_date | DATE | Date d'émission de la facture. Date légale servant de référence pour la TVA et les délais de paiement. |
| service_date | DATE | Date de livraison des biens ou de réalisation du service (peut différer de la date de facturation). Obligatoire légalement pour les factures de prestations. |
| due_date | DATE | Date d'échéance de paiement = issue_date + payment_terms_days. Détermine le déclenchement des relances automatiques. |
| paid_at | TIMESTAMP | Horodatage du paiement complet. NULL tant que la facture n'est pas soldée. |
| late_penalties | NUMERIC(15,2) | Pénalités de retard calculées automatiquement à l'échéance (RG-REGL-03). Selon la législation française, taux minimum = taux BCE + 10 points. |
| credit_note_usage | VARCHAR(20) | Pour les avoirs uniquement, mode d'utilisation : `refund` (remboursement par virement), `impute` (imputation sur une facture existante), `voucher` (avoir à valoir sur une prochaine commande) (RG-AVO-02). |
| notes | TEXT | Mentions légales particulières, conditions de paiement, références de marché public… |
| created_by | INT FK → users | Utilisateur ayant émis la facture (comptable, ADV). |
| created_at | TIMESTAMP | Date de création de la facture dans le système. |

### `invoice_sales_orders`
Table de jonction permettant de regrouper plusieurs bons de livraison et commandes sur une seule facture (RG-FACT-03 : facturation périodique ou groupée). Exemple : facture mensuelle regroupant toutes les livraisons du mois à un client.

| Colonne | Type | Notes |
|---------|------|-------|
| invoice_id | INT FK → invoices | Facture regroupant les BL. |
| sales_order_id | INT FK → sales_orders | Commande client incluse dans cette facture. |
| shipment_id | INT FK → shipments | Bon de livraison précis correspondant (une commande peut avoir plusieurs BL, on peut facturer par BL). |

### `invoice_lines`
Lignes détaillées d'une facture. Chaque ligne décrit une prestation ou un produit facturé avec son prix, sa quantité, sa remise et sa TVA. Détail fiscal obligatoire sur la facture légale.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de facture. |
| invoice_id | INT FK → invoices | Facture à laquelle appartient cette ligne. |
| sales_order_line_id | INT FK → sales_order_lines | Ligne de commande correspondante. NULL pour les lignes de frais de port ou mentions légales. |
| description | VARCHAR(300) | Description de l'article ou du service facturé telle qu'elle apparaît sur la facture (ex. "Ordinateur portable NEXTECH Pro 15 - Réf. NX-INF-00042"). |
| quantity | NUMERIC(12,3) | Quantité facturée. |
| unit_price_ht | NUMERIC(15,6) | Prix unitaire HT facturé. Doit correspondre au prix de la commande sauf avoir ou litige. |
| discount_rate | NUMERIC(5,4) | Remise appliquée sur cette ligne. Apparaît sur la facture légale. |
| total_ht | NUMERIC(15,2) | Montant HT de la ligne (quantité × prix unitaire × (1 - remise)). |
| tax_rate_id | INT FK → tax_rates | Taux de TVA appliqué. Chaque taux doit apparaître dans un sous-total TVA dédié sur la facture. |
| total_ttc | NUMERIC(15,2) | Montant TTC de la ligne = total_ht × (1 + taux TVA). |

### `payments`
Enregistre les règlements reçus des clients. Un paiement peut régler partiellement ou totalement une facture. Plusieurs paiements peuvent être liés à une même facture (paiements échelonnés, acomptes).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du paiement. |
| invoice_id | INT FK → invoices | Facture réglée par ce paiement. |
| customer_id | INT FK → customers | Client effectuant le règlement (dénormalisé pour les rapports de trésorerie sans jointure). |
| amount | NUMERIC(15,2) | Montant encaissé. Peut être inférieur au total de la facture (paiement partiel). |
| payment_method | VARCHAR(30) | Mode de règlement : `wire` (virement bancaire), `check` (chèque), `card` (carte bancaire), `sepa` (prélèvement SEPA), `cash` (espèces). |
| payment_date | DATE | Date de réception effective du règlement (date de valeur bancaire). |
| reference | VARCHAR(100) | Référence du règlement (numéro de virement, numéro de chèque, référence transaction carte). Permet le rapprochement bancaire. |
| notes | TEXT | Observations (ex. "Chèque en attente d'encaissement", "Virement reçu le 15/03 avec mention partielle"). |

### `invoice_reminders`
Gère les relances automatiques et progressives pour les factures impayées (RG-REGL-02). Le niveau de relance augmente avec le retard et l'agressivité du recouvrement va de la relance courtoise à la mise en demeure puis au contentieux.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la relance. |
| invoice_id | INT FK → invoices | Facture faisant l'objet de la relance. |
| level | SMALLINT | Niveau de la relance, déterminant le ton et l'urgence : 1 = J+1 (rappel courtois), 2 = J+8 (relance ferme), 3 = J+15 (mise en demeure), 4 = J+30 (contentieux/huissier). |
| sent_at | TIMESTAMP | Horodatage d'envoi de la relance. |
| type | VARCHAR(20) | Nature de la relance : `reminder` (relance amiable, niveaux 1-2), `formal_notice` (mise en demeure avec valeur légale, niveau 3), `litigation` (transmission au contentieux ou à un cabinet de recouvrement, niveau 4). |

---

## 9. Retours & SAV

### `returns`
Gère les retours clients via un numéro RMA (Return Merchandise Authorization). Chaque retour est autorisé avant l'envoi physique par le client, permettant de contrôler les flux entrants et d'allouer les ressources de traitement (RG-RET-01).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du retour. |
| rma_number | VARCHAR(30) UNIQUE | Numéro RMA unique communiqué au client pour étiqueter son colis retour (RG-RET-01). Permet d'identifier le retour à réception sans ouvrir le colis. |
| customer_id | INT FK → customers | Client effectuant le retour. |
| sales_order_id | INT FK → sales_orders | Commande d'origine des articles retournés. Obligatoire pour tracer la vente initiale. |
| status | VARCHAR(20) | Avancement du traitement : `pending` (RMA accordé, attente réception), `received` (colis reçu en entrepôt), `inspected` (articles inspectés et catégorisés), `processed` (avoir ou échange effectué), `closed` (dossier clôturé). |
| credit_amount | NUMERIC(15,2) | Montant total de l'avoir accordé pour ce retour. Calculé après inspection selon les conditions du retour. |
| created_by | INT FK → users | Utilisateur (ADV, commercial) ayant accordé l'autorisation de retour. |
| processed_at | TIMESTAMP | Horodatage du traitement final (émission de l'avoir ou de l'échange). NULL tant que non traité. |
| created_at | TIMESTAMP | Date d'ouverture du dossier RMA. |

### `return_lines`
Détail des articles retournés dans un dossier RMA. Chaque ligne précise le produit, le motif du retour, l'état constaté et la destination du stock retourné (remise en vente, outlet, rebut…).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de retour. |
| return_id | INT FK → returns | Dossier RMA auquel appartient cette ligne. |
| product_id | INT FK → products | Produit retourné. |
| quantity | NUMERIC(12,3) | Quantité retournée. |
| motif | VARCHAR(30) | Raison du retour : `retraction` (rétractation légale 14 jours B2C), `defective` (article défectueux/en panne), `wrong_order_nexstock` (erreur d'expédition de notre part), `wrong_order_customer` (erreur de commande du client), `non_conform` (produit non conforme à la description), `shipping_damage` (dommages lors du transport). Détermine qui supporte les frais et la responsabilité. |
| condition | VARCHAR(20) | État de l'article retourné après inspection : `new` (non ouvert, revendable immédiatement), `very_good` (ouvert mais état quasi-neuf), `good` (légèrement utilisé, revendable outlet), `damaged` (endommagé, nécessite réparation ou déclassement), `unusable` (inutilisable, à mettre au rebut). |
| stock_destination | VARCHAR(20) | Destination du stock après traitement : `available` (remis dans le stock vendable), `blocked` (mis en quarantaine pour expertise), `outlet` (déclassé, vendu en outlet à prix réduit), `scrapped` (mis au rebut, génère un mouvement de sortie rebut). |
| restocking_fee_rate | NUMERIC(5,4) | Taux de frais de restockage prélevé sur le montant à rembourser (RG-RET-03). Ex. 0.1500 = 15% déduit de l'avoir pour couvrir les frais de réintégration. |
| credit_amount | NUMERIC(15,2) | Montant de l'avoir accordé pour cette ligne spécifique = prix de vente × quantité × (1 - restocking_fee_rate). |
| lot_id | INT FK → stock_lots | Lot auquel est réintégré l'article retourné. Permet la traçabilité de bout en bout. |

### `supplier_returns`
Gère les retours effectués vers les fournisseurs (articles défectueux, excédents, non-conformités…). Génère un mouvement de stock de sortie et attend une note de crédit du fournisseur.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du retour fournisseur. |
| supplier_id | INT FK → suppliers | Fournisseur destinataire du retour. |
| purchase_order_id | INT FK → purchase_orders | Bon de commande d'origine des articles retournés. |
| reference | VARCHAR(50) | Numéro de bon de retour interne. Communiqué au fournisseur pour le rapprochement de l'avoir. |
| status | VARCHAR(20) | Statut : `draft` (en cours de constitution), `sent` (colis envoyé au fournisseur), `credit_received` (note de crédit fournisseur reçue), `closed` (traitement terminé). |
| created_at | TIMESTAMP | Date d'ouverture du dossier de retour fournisseur. |

### `supplier_return_lines`
Détail des articles retournés au fournisseur, avec le motif et le prix de référence pour le calcul de l'avoir attendu.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne. |
| supplier_return_id | INT FK → supplier_returns | Dossier de retour fournisseur auquel appartient cette ligne. |
| product_id | INT FK → products | Produit retourné au fournisseur. |
| quantity | NUMERIC(12,3) | Quantité retournée. |
| reason | TEXT | Explication détaillée du motif du retour (défaut de fabrication, non-conformité au cahier des charges, excédent de livraison…). Transmise au fournisseur. |
| unit_price_ht | NUMERIC(15,6) | Prix d'achat unitaire de référence pour calculer la valeur de l'avoir attendu du fournisseur. |

---

## 10. Promotions & Tarifs

### `promotions`
Gère toutes les opérations commerciales : remises en pourcentage, remises fixes, prix promotionnels et offres quantitatives (3+1 gratuit). Chaque promotion a une période de validité, un périmètre produits/clients et une limite d'utilisation.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la promotion. |
| name | VARCHAR(200) | Nom de la promotion (ex. "Soldes été 2024 -20%", "Pack rentrée informatique", "Offre fidélité grand compte"). |
| type | VARCHAR(20) | Type de remise : `PERCENT` (remise en pourcentage du prix), `FIXED` (montant fixe déduit), `PRICE_OVERRIDE` (prix promotionnel absolu, écrase le prix catalogue), `QUANTITY` (remise quantitative/gratuité). |
| value | NUMERIC(15,6) | Valeur de la remise selon le type : pourcentage (ex. 0.20 = 20%) ou montant fixe (ex. 10.00 = 10€ de réduction). |
| min_qty | NUMERIC(12,3) | Quantité minimale à commander pour déclencher la promotion. NULL = s'applique dès 1 unité. Pour `QUANTITY`, c'est la quantité payante. |
| free_qty | NUMERIC(12,3) | Quantité offerte dans le cadre d'une offre quantitative (ex. free_qty = 1 avec min_qty = 3 → offre 3+1 gratuit). NULL sauf pour le type `QUANTITY`. |
| scope_product | VARCHAR(20) | Périmètre produits : `ALL` (tous les produits du catalogue), `CATEGORY` (produits d'une ou plusieurs catégories), `LIST` (liste précise de produits). Affiné par `promotion_products` et `promotion_categories`. |
| scope_customer | VARCHAR(20) | Périmètre clients : `ALL` (tous les clients), `GROUP` (groupe tarifaire), `LIST` (liste précise de clients). Affiné par `promotion_customer_groups` et `promotion_customers`. |
| starts_at | TIMESTAMP | Date et heure de début de validité de la promotion. La promotion n'est pas applicable avant cette date. |
| ends_at | TIMESTAMP | Date et heure de fin de validité. NULL = promotion sans limite de temps. |
| max_uses | INT | Nombre maximum d'utilisations toutes commandes confondues. NULL = illimité. Évite la sur-utilisation des promotions à volume limité. |
| current_uses | INT | Compteur d'utilisations actuel. Incrémenté à chaque commande utilisant cette promotion. Comparé à `max_uses` pour bloquer si dépassé. DEFAULT 0. |
| is_cumulative | BOOLEAN | Indique si cette promotion peut se combiner avec d'autres promotions simultanées sur la même ligne (RG-PROMO-01). Si false, la promotion la plus avantageuse prend le dessus. |
| is_active | BOOLEAN | Interrupteur manuel pour activer/désactiver la promotion indépendamment de ses dates. Permet une mise en pause rapide. |
| created_at | TIMESTAMP | Date de création de la promotion. |

### `promotion_products`
Définit la liste précise des produits auxquels s'applique une promotion de type `scope_product = LIST`. Table de jonction simple (clé primaire composite).

| Colonne | Type | Notes |
|---------|------|-------|
| promotion_id | INT FK → promotions | Promotion concernée. |
| product_id | INT FK → products | Produit inclus dans le périmètre de la promotion. |

### `promotion_categories`
Définit les catégories de produits incluses dans une promotion de type `scope_product = CATEGORY`. Tous les produits de ces catégories bénéficient de la promotion.

| Colonne | Type | Notes |
|---------|------|-------|
| promotion_id | INT FK → promotions | Promotion concernée. |
| category_id | INT FK → categories | Catégorie incluse. Tous les produits appartenant à cette catégorie (et ses sous-catégories) bénéficient de la promotion. |

### `promotion_customer_groups`
Restreint une promotion aux clients appartenant à un ou plusieurs groupes tarifaires spécifiques (ex. promotion réservée aux revendeurs ou aux grands comptes).

| Colonne | Type | Notes |
|---------|------|-------|
| promotion_id | INT FK → promotions | Promotion concernée. |
| price_group | VARCHAR(20) | Groupe tarifaire éligible (ex. `RESELLER`, `BIG_ACCOUNT`, `VIP`). Correspond aux valeurs de `customers.price_group`. |

### `promotion_customers`
Restreint une promotion à une liste précise de clients nommés (ex. opération commerciale pour un client stratégique spécifique, offre de bienvenue pour un nouveau compte).

| Colonne | Type | Notes |
|---------|------|-------|
| promotion_id | INT FK → promotions | Promotion concernée. |
| customer_id | INT FK → customers | Client spécifiquement éligible à cette promotion. |

### `customer_product_prices`
Stocke les prix contractuels négociés pour une combinaison client-produit spécifique (RG-PRIX-01 niveau 2 de la cascade). Ces prix priment sur le tarif groupe et le catalogue mais sont supplantés par les promotions actives.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du prix contractuel. |
| customer_id | INT FK → customers | Client bénéficiaire du prix contractuel. |
| product_id | INT FK → products | Produit concerné par le prix contractuel. |
| price_ht | NUMERIC(15,6) | Prix d'achat HT contractuel négocié (ex. résultat d'un appel d'offres ou d'une négociation annuelle). |
| starts_at | DATE | Date de début de validité du prix contractuel. |
| ends_at | DATE | Date de fin de validité. NULL = prix permanent jusqu'à révocation. |

### `price_tiers`
Définit les remises quantitatives (paliers de prix) par produit et par groupe de clients (RG-PRIX-04). Plus la quantité commandée est élevée, plus la remise est importante. Appliqué automatiquement lors de la saisie de commandes.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du palier. |
| product_id | INT FK → products | Produit concerné par les paliers de remise. |
| price_group | VARCHAR(20) | Groupe tarifaire client auquel s'applique ce palier. NULL = applicable à tous les groupes. |
| min_qty | NUMERIC(12,3) | Quantité minimale à commander pour bénéficier de la remise de ce palier (ex. 10 = remise appliquée à partir de 10 unités commandées). |
| discount_rate | NUMERIC(5,4) | Taux de remise applicable à ce palier (ex. 0.0500 = 5% pour 10+ unités, 0.1000 = 10% pour 50+ unités). |

---

## 11. Transferts inter-entrepôts

### `transfers`
Gère les mouvements de stock entre entrepôts (ex. rééquilibrage de stock entre Paris et Lyon). Chaque transfert suit un cycle d'approbation et génère des mouvements de stock en sortie à la source et en entrée à la destination.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du transfert. |
| reference | VARCHAR(30) UNIQUE | Numéro de transfert unique (ex. TRF-2024-03-00001). Mentionné sur les documents de transport inter-sites. |
| from_warehouse_id | INT FK → warehouses | Entrepôt source qui expédie les marchandises. Le stock est débité ici à l'expédition. |
| to_warehouse_id | INT FK → warehouses | Entrepôt destination qui reçoit les marchandises. Le stock est crédité ici à la réception. |
| status | VARCHAR(20) | Cycle de vie du transfert : `REQUESTED` (demande créée), `APPROVED` (approuvé par le responsable), `PICKING` (préparation en cours à la source), `SHIPPED` (expédié, stock en transit), `RECEIVED` (reçu à destination), `CLOSED` (clôturé après vérification). |
| transport_cost | NUMERIC(15,2) | Coût de transport entre les deux entrepôts. Impacte le PUMP à la destination (RG-TRF-04) : PUMP destination = (valeur stock source + frais transport) / quantité transférée. |
| requested_by | INT FK → users | Utilisateur ayant initié la demande de transfert (responsable d'entrepôt, gestionnaire de stock). |
| approved_by | INT FK → users | Utilisateur ayant approuvé le transfert (directeur logistique, responsable achats). |
| shipped_at | TIMESTAMP | Horodatage d'expédition depuis l'entrepôt source. Déclenche le mouvement de stock `TRF_INT` en sortie et place les articles en `qty_in_transit`. |
| received_at | TIMESTAMP | Horodatage de réception à l'entrepôt destination. Déclenche le mouvement d'entrée et retire du `qty_in_transit`. |
| created_at | TIMESTAMP | Date de création de la demande de transfert. |

### `transfer_lines`
Détail des produits transférés dans un transfert inter-entrepôts. Suit les quantités demandées, expédiées et reçues pour chaque produit/lot/numéro de série.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la ligne de transfert. |
| transfer_id | INT FK → transfers | Transfert auquel appartient cette ligne. |
| product_id | INT FK → products | Produit transféré. |
| from_location_id | INT FK → warehouse_locations | Emplacement source précis dans l'entrepôt d'origine. |
| to_location_id | INT FK → warehouse_locations | Emplacement destination prévu dans l'entrepôt cible. |
| quantity_requested | NUMERIC(12,3) | Quantité demandée à transférer. |
| quantity_shipped | NUMERIC(12,3) | Quantité effectivement expédiée depuis la source (peut être inférieure si stock insuffisant au moment du picking). DEFAULT 0. |
| quantity_received | NUMERIC(12,3) | Quantité confirmée reçue à destination (peut différer de `quantity_shipped` en cas de perte ou de dommage en transit). DEFAULT 0. |
| lot_id | INT FK → stock_lots | Lot transféré (traçabilité FIFO). Le lot conserve son numéro, sa DLUO et son prix d'entrée d'origine à la destination. |
| serial_number_id | INT FK → stock_serial_numbers | Numéro de série transféré. Son `warehouse_id` est mis à jour à la réception. |

---

## 12. Inventaires

### `inventory_sessions`
Gère les sessions d'inventaire comptable ou tournant. Chaque session fige le stock théorique à un instant T (`frozen_at`), puis les magasiniers comptent le stock réel. Les écarts sont calculés, justifiés et validés avant d'être intégrés dans le stock.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la session d'inventaire. |
| reference | VARCHAR(30) UNIQUE | Numéro de la session (ex. INV-2024-ANNUEL-01, INV-2024-Q1-ROT). |
| type | VARCHAR(20) | Type d'inventaire : `FULL` (inventaire annuel complet de tout le stock), `ROTATING` (inventaire tournant par zone ou catégorie, effectué en continu), `PERMANENT` (comptage aléatoire de lignes de stock au fil de l'eau). |
| warehouse_id | INT FK → warehouses | Entrepôt concerné par cette session d'inventaire. |
| status | VARCHAR(20) | Avancement : `planned` (planifié, pas encore démarré), `in_progress` (comptages en cours), `validating` (comptages terminés, validation des écarts en cours), `validated` (inventaire validé, ajustements appliqués), `cancelled` (session annulée). |
| frozen_at | TIMESTAMP | Date et heure du gel du stock : instantané de la quantité théorique pris à cet instant (RG-INV-01). Après ce gel, les quantités `expected_qty` des `inventory_counts` sont calculées à partir de cet instantané. |
| validated_by | INT FK → users | Responsable ayant validé l'inventaire et autorisé les ajustements de stock. |
| validated_at | TIMESTAMP | Horodatage de la validation finale. Déclenche la création des mouvements d'ajustement `AJU_INV`. |
| created_by | INT FK → users | Utilisateur ayant créé et planifié la session. |
| created_at | TIMESTAMP | Date de création de la session. |

### `inventory_counts`
Enregistre le comptage réel effectué pour chaque produit/emplacement dans une session d'inventaire. Si l'écart entre théorique et réel dépasse 2%, un second comptage est obligatoire (RG-INV-02). Tout écart justifié génère un mouvement d'ajustement.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du comptage. |
| session_id | INT FK → inventory_sessions | Session d'inventaire à laquelle appartient ce comptage. |
| product_id | INT FK → products | Produit compté. |
| location_id | INT FK → warehouse_locations | Emplacement physique compté. |
| expected_qty | NUMERIC(12,3) | Quantité théorique selon le système informatique au moment du gel du stock (`frozen_at`). C'est la référence contre laquelle le comptage réel est comparé. |
| counted_qty | NUMERIC(12,3) | Quantité physiquement comptée lors du premier passage du magasinier dans l'emplacement. |
| recount_qty | NUMERIC(12,3) | Quantité du second comptage, obligatoire si `|counted_qty - expected_qty| / expected_qty > 2%` (RG-INV-02). C'est cette valeur qui fait foi si elle existe. |
| variance_qty | NUMERIC(12,3) | Écart de quantité = comptage (recount ou counted) − expected. Positif = surplus, négatif = manquant. |
| variance_value | NUMERIC(15,2) | Valeur monétaire de l'écart = variance_qty × PUMP du produit. Permet d'évaluer l'impact financier de l'inventaire. |
| requires_recount | BOOLEAN | Indique si un second comptage est requis (écart > 2%). Mis à true automatiquement après saisie du premier comptage si le seuil est dépassé. |
| justification | TEXT | Explication obligatoire de l'écart constaté si variance_qty ≠ 0 (RG-INV-03) : vol, casse, erreur de saisie antérieure, produit mal rangé, etc. Conservée pour l'audit comptable. |
| adjustment_movement_id | INT FK → stock_movements | Référence du mouvement de stock `AJU_INV` créé automatiquement après validation de l'inventaire pour corriger le stock physique. NULL tant que non validé. |

---

## 13. Notifications

### `notifications`
Centralise toutes les notifications envoyées aux utilisateurs du système, quel que soit le canal (push in-app, email, SMS). Permet aux utilisateurs de consulter leurs notifications non lues et à l'application de gérer les envois multicanaux.

| Colonne | Type | Notes |
|---------|------|-------|
| id | BIGSERIAL PK | Identifiant grand entier (BIGSERIAL) car le volume de notifications peut être très important (alertes de stock fréquentes). |
| user_id | INT FK → users | Utilisateur destinataire de la notification. Chaque utilisateur ne voit que ses propres notifications. |
| type | VARCHAR(50) | Type de notification déterminant le template et l'urgence : `stock_alert` (stock sous le seuil d'alerte), `stock_critical` (stock critique), `overdue_invoice` (facture en retard), `order_validated` (commande confirmée), `rma_received` (retour reçu), `transfer_received` (transfert reçu)… |
| title | VARCHAR(200) | Titre court de la notification affiché dans le centre de notifications et le sujet de l'email (ex. "Alerte stock — Produit NX-INF-00042"). |
| message | TEXT | Corps de la notification avec les détails : produit concerné, seuil atteint, action recommandée. Peut contenir du texte ou du HTML selon le canal. |
| entity_type | VARCHAR(50) | Type de l'entité concernée par la notification (ex. `products`, `invoices`, `purchase_orders`). Permet de construire un lien profond vers l'objet dans l'application. |
| entity_id | INT | Identifiant de l'objet concerné (combiné avec `entity_type`). Permet à l'interface de naviguer directement vers la fiche produit, la facture ou la commande concernée depuis la notification. |
| channel | VARCHAR(10) | Canal d'envoi : `push` (notification in-app temps réel via WebSocket), `email` (email envoyé via SMTP/Mailgun), `sms` (SMS via Twilio). Une notification peut être envoyée sur plusieurs canaux (crée plusieurs enregistrements). |
| is_read | BOOLEAN | Indique si l'utilisateur a lu/accusé réception de la notification. DEFAULT false. Les notifications non lues apparaissent en surbrillance dans l'interface. |
| sent_at | TIMESTAMP | Horodatage d'envoi effectif sur le canal. NULL si en attente d'envoi (queue asynchrone). |
| created_at | TIMESTAMP | Horodatage de création de la notification dans la base. |

---

---

## 14. Logistique Flotte

### `vehicles`
Référentiel de la flotte de véhicules internes de l'entreprise. Chaque véhicule possède ses caractéristiques de capacité (poids, volume, palettes) et son statut opérationnel. Rattaché à un entrepôt de base, il peut être affecté à des missions de transport inter-entrepôts ou de livraison directe.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du véhicule. |
| registration_plate | VARCHAR(15) UNIQUE | Immatriculation du véhicule (ex. "AB-123-CD"). Identifiant légal unique. |
| vehicle_type | VARCHAR(30) | Type de véhicule : `light_van` (camionnette ≤ 3,5t), `rigid_truck` (porteur), `semi_trailer` (semi-remorque), `electric_van` (utilitaire électrique). Détermine le type de permis requis. |
| brand | VARCHAR(50) | Marque du véhicule (ex. "Renault", "Mercedes", "Volvo"). |
| model | VARCHAR(100) | Modèle du véhicule (ex. "Master L3H2", "Actros 1848"). |
| year | SMALLINT | Année de mise en circulation. Utile pour évaluer le vieillissement de la flotte. |
| payload_kg | NUMERIC(8,2) | Charge utile maximale en kilogrammes (PTAC − poids à vide). Limite légale et physique du chargement (RG-LOG-02). |
| volume_m3 | NUMERIC(6,2) | Volume utile de la caisse/plateau en m³. Contrôlé lors de la planification des missions. |
| pallet_capacity | SMALLINT | Nombre maximum de palettes standard (120×80 cm) que le véhicule peut transporter. |
| base_warehouse_id | INT FK → warehouses | Entrepôt de rattachement du véhicule (sa base logistique). Détermine l'entrepôt de départ par défaut des missions. |
| mileage_km | INT | Kilométrage total courant du véhicule. Mis à jour à chaque clôture de mission (RG-LOG-06). Utilisé pour déclencher les alertes de maintenance préventive. |
| fuel_type | VARCHAR(15) | Type de carburant : `diesel`, `gasoline` (essence), `electric`, `hybrid`, `lng` (gaz naturel liquéfié). |
| status | VARCHAR(20) | État opérationnel du véhicule : `available` (disponible pour une nouvelle mission), `in_mission` (en cours de mission), `maintenance` (en révision ou réparation), `out_of_service` (hors service définitif ou temporaire). |
| last_maintenance_at | TIMESTAMP | Date de la dernière intervention maintenance. Sert de point de départ pour calculer la prochaine échéance. |
| next_maintenance_at | TIMESTAMP | Date prévisionnelle de la prochaine maintenance. Déclenche une alerte au Responsable Logistique quand la date est à moins de 30 jours ou le kilométrage à moins de 1 000 km (RG-LOG-06). |
| deleted_at | TIMESTAMP | Suppression logique. Un véhicule supprimé conserve son historique de missions et de maintenances. |

### `drivers`
Référentiel des conducteurs de la flotte. Un conducteur peut être un employé NEXSTOCK (avec un compte utilisateur) ou un sous-traitant ponctuel. Le système vérifie automatiquement la validité et le niveau du permis à l'affectation d'une mission (RG-LOG-05).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique du conducteur. |
| user_id | INT FK → users | Compte utilisateur associé si le conducteur est un employé interne. NULL pour les conducteurs sous-traitants. |
| full_name | VARCHAR(150) | Nom complet du conducteur. |
| employee_number | VARCHAR(30) | Matricule interne employé. NULL pour les sous-traitants. |
| license_type | VARCHAR(10) | Type de permis de conduire : `B` (véhicules légers ≤ 3,5t), `C1` (3,5t–7,5t), `C` (porteurs > 7,5t), `CE` (semi-remorques, combinaison > 7,5t). Détermine les véhicules que le conducteur est habilité à conduire. |
| license_number | VARCHAR(50) | Numéro de permis de conduire officiel. |
| license_expires_at | DATE | Date d'expiration du permis. Toute affectation avec un permis expiré est bloquée par le système (RG-LOG-05). |
| base_warehouse_id | INT FK → warehouses | Entrepôt de rattachement du conducteur. Sert à proposer les missions au départ de son site. |
| status | VARCHAR(20) | Disponibilité du conducteur : `active` (disponible), `on_mission` (en cours de mission), `on_leave` (en congé), `unavailable` (indisponible temporairement). |
| phone | VARCHAR(20) | Numéro de téléphone mobile du conducteur (contact en cours de mission). |
| deleted_at | TIMESTAMP | Suppression logique. |

### `transport_missions`
Planifie et trace les missions de transport effectuées par les véhicules de la flotte interne. Une mission peut couvrir un transfert inter-entrepôts, une livraison client directe ou un enlèvement fournisseur. Elle consolide les coûts réels (carburant, péages) et impacte le PUMP des transferts associés (RG-LOG-04).

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de la mission. |
| reference | VARCHAR(30) UNIQUE | Numéro de mission (ex. MIS-2024-03-00001). Mentionné sur les documents de transport. |
| mission_type | VARCHAR(20) | Type de mission : `TRANSFER` (transport d'un transfert inter-entrepôts NEXSTOCK), `DELIVERY` (livraison directe client par véhicule propre), `PICKUP` (enlèvement chez un fournisseur). |
| vehicle_id | INT FK → vehicles | Véhicule affecté à la mission. Vérifié contre le statut et le calendrier pour éviter les conflits (RG-LOG-01, RG-LOG-03). |
| driver_id | INT FK → drivers | Conducteur affecté. Permis vérifié à l'affectation (RG-LOG-05). |
| from_warehouse_id | INT FK → warehouses | Entrepôt de départ. NULL si la mission commence hors d'un entrepôt NEXSTOCK (ex. enlèvement direct chez un fournisseur). |
| to_warehouse_id | INT FK → warehouses | Entrepôt de destination. NULL si la mission se termine hors entrepôt (ex. livraison directe client). |
| departure_address | TEXT | Adresse de départ libre si `from_warehouse_id` est NULL. |
| arrival_address | TEXT | Adresse d'arrivée libre si `to_warehouse_id` est NULL. |
| scheduled_departure_at | TIMESTAMP | Date et heure de départ prévues. Sert à détecter les conflits de planning (RG-LOG-01). |
| actual_departure_at | TIMESTAMP | Date et heure de départ réelles. NULL jusqu'au démarrage effectif de la mission. |
| scheduled_arrival_at | TIMESTAMP | Date et heure d'arrivée prévues. |
| actual_arrival_at | TIMESTAMP | Date et heure d'arrivée réelles. NULL jusqu'à la clôture de la mission. |
| status | VARCHAR(20) | Cycle de vie : `PLANNED` (planifiée, en attente), `CONFIRMED` (validée par le responsable logistique), `IN_PROGRESS` (véhicule en route), `COMPLETED` (mission terminée, coûts saisis), `CANCELLED` (annulée). |
| total_weight_kg | NUMERIC(10,2) | Poids total du chargement en kg. Comparé à `vehicles.payload_kg` lors de la planification (RG-LOG-02). |
| total_volume_m3 | NUMERIC(7,2) | Volume total du chargement en m³. Comparé à `vehicles.volume_m3`. |
| total_pallets | SMALLINT | Nombre total de palettes chargées. Comparé à `vehicles.pallet_capacity`. |
| distance_km | NUMERIC(8,1) | Distance totale parcourue en km. Saisie à la clôture pour mettre à jour le kilométrage du véhicule (RG-LOG-06). |
| fuel_cost | NUMERIC(10,2) | Coût carburant de la mission (calculé ou saisi). |
| toll_cost | NUMERIC(10,2) | Coût des péages. |
| total_transport_cost | NUMERIC(10,2) | Coût total de la mission = fuel_cost + toll_cost + autres frais. Reporté dans `transfers.transport_cost` à la clôture pour les missions de type TRANSFER (RG-LOG-04). |
| notes | TEXT | Instructions particulières (horaires de livraison, contacts sur place, contraintes d'accès). |
| created_by | INT FK → users | Responsable logistique ayant planifié la mission. |
| created_at | TIMESTAMP | Date de création de la mission. |
| updated_at | TIMESTAMP | Date de dernière modification. |

### `transport_mission_items`
Détaille les documents de transport (transferts, expéditions, réceptions) pris en charge par une mission. Une mission peut regrouper plusieurs documents pour optimiser les tournées. La somme des poids et volumes des items doit rester dans les limites du véhicule.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'item de mission. |
| mission_id | INT FK → transport_missions | Mission à laquelle appartient cet item. |
| item_type | VARCHAR(20) | Nature du document transporté : `TRANSFER` (transfert inter-entrepôts), `SHIPMENT` (expédition client), `PURCHASE_RECEPTION` (réception fournisseur / enlèvement). |
| transfer_id | INT FK → transfers | Transfert inter-entrepôts concerné si `item_type = TRANSFER`. NULL sinon. |
| shipment_id | INT FK → shipments | Expédition client concernée si `item_type = SHIPMENT`. NULL sinon. |
| purchase_order_id | INT FK → purchase_orders | Commande achat concernée si `item_type = PURCHASE_RECEPTION`. NULL sinon. |
| packages_count | SMALLINT | Nombre de colis/unités de manutention pour cet item. |
| weight_kg | NUMERIC(10,2) | Poids de cet item. Sommé pour vérifier la capacité du véhicule (RG-LOG-02). |
| volume_m3 | NUMERIC(7,2) | Volume de cet item. Sommé pour vérifier la capacité du véhicule. |
| notes | TEXT | Instructions spécifiques à cet item (fragilité, priorité de déchargement…). |

### `vehicle_maintenance`
Historique complet des opérations de maintenance effectuées sur chaque véhicule. Permet de suivre les coûts de maintenance par véhicule et de planifier les prochaines interventions. Alimente les alertes de maintenance préventive.

| Colonne | Type | Notes |
|---------|------|-------|
| id | SERIAL PK | Identifiant unique de l'intervention. |
| vehicle_id | INT FK → vehicles | Véhicule concerné par cette maintenance. |
| maintenance_type | VARCHAR(30) | Nature de l'intervention : `revision` (révision périodique, vidange, filtres), `repair` (réparation suite à une panne), `technical_control` (contrôle technique obligatoire), `tire_change` (changement de pneumatiques), `bodywork` (carrosserie). |
| description | TEXT | Détail des travaux effectués (pièces remplacées, anomalies constatées, préconisations). |
| mileage_at_maintenance | INT | Kilométrage du véhicule au moment de l'intervention. Permet de calculer le prochain kilométrage de maintenance (ex. tous les 30 000 km). |
| cost | NUMERIC(10,2) | Coût total de l'intervention (main-d'œuvre + pièces). Sert au calcul du coût total de possession du véhicule. |
| performed_at | TIMESTAMP | Date et heure de l'intervention. Mise à jour de `vehicles.last_maintenance_at` après création. |
| next_maintenance_at | TIMESTAMP | Date estimée de la prochaine intervention du même type. Mise à jour de `vehicles.next_maintenance_at` si plus tôt que la valeur existante. |
| performed_by | VARCHAR(200) | Garage ou prestataire ayant effectué l'intervention (ex. "Garage Renault Trucks Paris 15e"). |
| created_by | INT FK → users | Responsable logistique ayant saisi l'intervention. |
| created_at | TIMESTAMP | Date de saisie de l'intervention dans le système. |

---

## Résumé des tables (58 tables)

| Module | Tables |
|--------|--------|
| Utilisateurs & Droits | users, roles, permissions, role_permissions, user_permission_overrides, audit_logs |
| Catalogue | categories, brands, units_of_measure, tax_rates, products, product_variants, product_kit_components, product_images, product_documents |
| Entrepôts & Stocks | warehouses, warehouse_locations, stock_levels, stock_lots, stock_serial_numbers, stock_movements, stock_thresholds |
| Fournisseurs | suppliers, supplier_addresses, supplier_contacts, supplier_products |
| Achats | purchase_orders, purchase_order_lines, purchase_receptions, purchase_reception_lines, supplier_invoices |
| Clients | customers, customer_addresses, customer_contacts |
| Ventes | sales_orders, sales_order_lines, picking_lists, picking_list_items, shipments, shipment_lines |
| Facturation | invoices, invoice_sales_orders, invoice_lines, payments, invoice_reminders |
| Retours | returns, return_lines, supplier_returns, supplier_return_lines |
| Promotions & Tarifs | promotions, promotion_products, promotion_categories, promotion_customer_groups, promotion_customers, customer_product_prices, price_tiers |
| Transferts | transfers, transfer_lines |
| Inventaires | inventory_sessions, inventory_counts |
| Notifications | notifications |
| Logistique Flotte | vehicles, drivers, transport_missions, transport_mission_items, vehicle_maintenance |
