# ⚠️ BELANGRIJK: Voer deze stappen uit VOORDAT je de servers start!

## Stap 1: Database Schema Aanmaken

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Ga naar je project**: viktor-rolf-qc
3. **Klik op "SQL Editor"** in het linker menu
4. **Klik op "New query"**
5. **Kopieer de VOLLEDIGE inhoud** van het bestand `supabase-migration.sql`
6. **Plak in de SQL Editor**
7. **Klik op "Run"** (of druk Cmd+Enter)
8. **Wacht tot je ziet**: "Success. No rows returned"

## Stap 2: Verificatie

1. **Ga naar "Table Editor"** in het linker menu
2. **Check of je deze tables ziet**:
   - ✅ users
   - ✅ collections
   - ✅ samples
   - ✅ sample_photos
   - ✅ quality_reviews
   - ✅ quality_review_photos
   - ✅ quality_review_comments
   - ✅ supplier_communications
   - ✅ supplier_comm_attachments
   - ✅ audit_trail

## Stap 3: Storage Buckets Aanmaken

### 3.1 Sample Photos Bucket
1. **Ga naar "Storage"** in het linker menu
2. **Klik op "New bucket"**
3. **Naam**: `sample-photos`
4. **Public bucket**: ✅ JA (vink aan!)
5. **Klik "Create bucket"**

### 3.2 Bucket Policy
1. Klik op de bucket `sample-photos`
2. **Klik op "Policies" tab**
3. **Klik "New policy"**
4. Kies template: **"Allow public read access"**
5. **Klik "Review"** → **"Save policy"**

### 3.3 Upload Policy
1. **Klik nog een keer "New policy"**
2. Kies template: **"Allow authenticated users to upload"**
3. **Klik "Review"** → **"Save policy"**

### 3.4 Herhaal voor Andere Buckets
Maak op dezelfde manier deze buckets aan (beide public):
- `quality-review-photos`
- `supplier-attachments`

## Stap 4: Test User Aanmaken

1. **Ga terug naar "SQL Editor"**
2. **Voer deze query uit**:

```sql
-- Insert demo user (password is 'password123')
INSERT INTO users (first_name, last_name, email, password, job_title, role)
VALUES 
  ('Sophie', 'Laurent', 'sophie.laurent@viktor-rolf.com', 'password123', 'Senior Quality Manager', 'admin');
```

3. **Run de query**

## Stap 5: Test Collections Aanmaken

1. **Nog steeds in SQL Editor**, voer uit:

```sql
-- Insert collections
INSERT INTO collections (name, season, year, category, status)
VALUES
  ('Spring Summer 2026', 'SS', 2026, 'Ready to Wear', 'Active'),
  ('Fall Winter 2026', 'FW', 2026, 'Ready to Wear', 'Active'),
  ('Spring Summer 2025', 'SS', 2025, 'Ready to Wear', 'Active');
```

2. **Run de query**

## Stap 6: Verificatie Check

Ga naar **"Table Editor"** en check:

1. **Klik op "users"** → Zie je Sophie Laurent? ✅
2. **Klik op "collections"** → Zie je 3 collections? ✅
3. **Ga naar "Storage"** → Zie je 3 buckets? ✅

## ✅ Als alles klopt, kun je verder!

Nu kan ik de backend en frontend code aanpassen om Supabase te gebruiken.

**Zeg "klaar" als je alle stappen hebt gedaan, dan ga ik verder met de code!**
