# Viktor & Rolf - Supabase Migration Guide

## 📋 Overview
Dit document beschrijft hoe je het Viktor & Rolf Quality Control System migreert van SQLite naar Supabase (PostgreSQL).

## 🎯 Voordelen van Supabase
- ✅ **Cloud-hosted database** - Geen lokale SQLite file meer
- ✅ **Real-time subscriptions** - Live updates in de UI
- ✅ **Built-in authentication** - Geen eigen JWT systeem nodig
- ✅ **File storage** - Geïntegreerde bestandsopslag voor foto's
- ✅ **Row Level Security** - Veilige data access policies
- ✅ **Automatische backups** - Data is altijd beschermd
- ✅ **RESTful API** - Direct toegang tot database via API
- ✅ **Schaalbaar** - Groeit met je applicatie

## 📝 Stap 1: Supabase Project Aanmaken

### 1.1 Account Aanmaken
1. Ga naar [supabase.com](https://supabase.com)
2. Klik op "Start your project"
3. Sign up met GitHub of email
4. Gratis tier is perfect voor development

### 1.2 Nieuw Project Maken
1. Klik op "New Project"
2. Vul in:
   - **Name**: viktor-rolf-qc
   - **Database Password**: [kies een sterk wachtwoord - bewaar dit!]
   - **Region**: West EU (Netherlands) - dichtstbij voor beste performance
   - **Pricing Plan**: Free (voor nu)
3. Klik "Create new project"
4. Wacht ~2 minuten tot project klaar is

### 1.3 API Keys Ophalen
1. Ga naar **Settings** → **API**
2. Kopieer deze waarden (heb je straks nodig):
   - `Project URL` (bijv. `https://xxxxx.supabase.co`)
   - `anon` `public` key
   - `service_role` `secret` key (alleen voor backend!)

## 📝 Stap 2: Database Schema Aanmaken

### 2.1 SQL Editor Openen
1. Ga naar **SQL Editor** in je Supabase project
2. Klik op "New query"

### 2.2 Schema Uitvoeren
1. Open het bestand `supabase-migration.sql` uit deze repository
2. Kopieer de volledige inhoud
3. Plak in de SQL Editor
4. Klik op **Run** (of Cmd+Enter)
5. Wacht tot alle queries succesvol zijn uitgevoerd

### 2.3 Verifiëren
Ga naar **Table Editor** en check of je deze tables ziet:
- users
- collections  
- samples
- sample_photos
- quality_reviews
- quality_review_photos
- quality_review_comments
- supplier_communications
- supplier_comm_attachments
- audit_trail

## 📝 Stap 3: Storage Buckets Aanmaken

### 3.1 Sample Photos Bucket
1. Ga naar **Storage** in je Supabase project
2. Klik "New bucket"
3. Naam: `sample-photos`
4. Public bucket: **Yes** (zodat foto's getoond kunnen worden)
5. Click "Create bucket"

### 3.2 Policy Toevoegen
1. Klik op de bucket `sample-photos`
2. Ga naar **Policies** tab
3. Klik "New policy"
4. Template: "Allow public read access"
5. Voeg ook een policy toe voor "authenticated users can upload"

### 3.3 Herhaal voor Andere Buckets
Maak ook deze buckets aan:
- `quality-review-photos` (public)
- `supplier-attachments` (public)

## 📝 Stap 4: Seed Data (Demo Users & Collections)

### 4.1 Test User Aanmaken
In SQL Editor, voer uit:

```sql
-- Insert demo user
INSERT INTO users (first_name, last_name, email, password, job_title, role)
VALUES 
  ('Sophie', 'Laurent', 'sophie.laurent@viktor-rolf.com', 'password123', 'Senior Quality Manager', 'admin'),
  ('Marc', 'Dubois', 'marc.dubois@viktor-rolf.com', 'password123', 'Quality Inspector', 'editor');
```

### 4.2 Collections Aanmaken
```sql
-- Insert collections
INSERT INTO collections (name, season, year, category, status)
VALUES
  ('Spring Summer 2026', 'SS', 2026, 'Ready to Wear', 'Active'),
  ('Fall Winter 2026', 'FW', 2026, 'Ready to Wear', 'Active'),
  ('Spring Summer 2025', 'SS', 2025, 'Ready to Wear', 'Active');
```

## 📝 Stap 5: Backend Configureren

### 5.1 Environment Variables
Maak of update `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Port
PORT=3001

# Optioneel: oude SQLite connectie verwijderen
# DATABASE_PATH=/path/to/database.sqlite
```

⚠️ **Belangrijk**: Vervang de `xxxxx` waarden met je eigen Supabase credentials!

### 5.2 Dependencies Installeren
```bash
cd backend
npm install @supabase/supabase-js
```

## 📝 Stap 6: Frontend Configureren

### 6.1 Environment Variables
Maak `frontend/.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 6.2 Dependencies Installeren
```bash
cd frontend
npm install @supabase/supabase-js
```

## 📝 Stap 7: Code Aanpassingen

### 7.1 Backend Changes Needed
Bestanden die aangepast moeten worden:
- `backend/src/database/connection.js` → Supabase client init
- `backend/src/routes/auth.js` → Supabase auth ipv JWT
- `backend/src/routes/samples.js` → Supabase queries
- `backend/src/routes/collections.js` → Supabase queries
- `backend/src/routes/qualityReviews.js` → Supabase queries
- `backend/src/routes/supplierCommunications.js` → Supabase queries
- `backend/src/routes/photos.js` → Supabase Storage

### 7.2 Frontend Changes Needed
Bestanden die aangepast moeten worden:
- `frontend/src/api.ts` → Supabase client init
- `frontend/src/pages/Login.tsx` → Supabase auth
- `frontend/src/App.tsx` → Auth state management

## 📝 Stap 8: Data Migreren (Optioneel)

Als je bestaande SQLite data wilt migreren:

### 8.1 Export SQLite Data
```bash
cd backend
sqlite3 database.sqlite .dump > sqlite-dump.sql
```

### 8.2 Convert en Import
Je moet de dump file converteren van SQLite naar PostgreSQL format:
- INTEGER → UUID types aanpassen
- AUTOINCREMENT → uuid_generate_v4()
- Date formats aanpassen

Dit is complex en ik kan een script maken als je dit nodig hebt.

## 📝 Stap 9: Testen

### 9.1 Backend Starten
```bash
cd backend
npm run dev
```

Check console output voor errors.

### 9.2 Frontend Starten  
```bash
cd frontend
npm run dev
```

### 9.3 Functionaliteit Testen
- ✅ Login werkt (Supabase auth)
- ✅ Collections laden
- ✅ Samples bekijken, toevoegen, bewerken, verwijderen
- ✅ Foto's uploaden naar Supabase Storage
- ✅ Real-time updates (optioneel)

## 🔧 Troubleshooting

### "Invalid API key"
- Check of je de juiste keys hebt in `.env`
- Zorg dat `VITE_` prefix gebruikt wordt in frontend

### "Row Level Security policy violation"
- Check of RLS policies correct zijn
- Zorg dat gebruiker authenticated is

### "Storage bucket not found"
- Ga naar Supabase dashboard → Storage
- Maak buckets aan zoals beschreven in Stap 3

### "CORS errors"
- Ga naar Supabase dashboard → Settings → API
- Voeg `http://localhost:3000` toe aan allowed origins

## 📚 Handige Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## ❓ Volgende Stappen

Wil je dat ik:
1. ✅ De backend code converteer naar Supabase? (samples.js, etc.)
2. ✅ De frontend auth aanpas naar Supabase auth?
3. ✅ Een seed script maak om je huidige data te migreren?
4. ✅ Real-time features toevoeg (live updates)?

Laat het me weten en ik ga verder met de implementatie!
