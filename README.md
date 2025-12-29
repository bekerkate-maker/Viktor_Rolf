# Viktor & Rolf Quality Control System

Een professioneel web-based systeem voor intern gebruik door Viktor & Rolf, speciaal ontwikkeld voor product developers, quality control en productie teams.

## 📋 Overzicht

Dit systeem biedt twee hoofdfuncties:

### 1. Quality Control / Quality Review Dashboard
- Uitvoeren van interne kwaliteitscontroles per sample
- Uploaden van foto's en toevoegen van notities
- Vastleggen van quality issues met severity levels
- Status tracking: Pending Review → Changes Requested → Approved
- Complete audit trail van alle wijzigingen

### 2. Supplier Communication Tracker
- Loggen van alle communicatie met leveranciers (email, call, meeting)
- Deadline tracking voor samples en feedback
- Status management (Waiting for Supplier / Internal Feedback / Completed)
- Bijlagen uploaden (tech packs, foto's, documenten)
- Automatische overdue notificaties

## 🎨 Features

- **Per Collectie & Sample georganiseerd**: SS26 Couture, FW26 RTW, etc.
- **Dashboard met real-time overzicht**: Stats en metrics voor alle activiteiten
- **Complete audit trail**: Wie, wat, wanneer - volledige transparantie
- **Foto management**: Upload meerdere foto's per quality review
- **Fashion-forward design**: Clean, minimalistisch, Viktor & Rolf brand aligned
- **Filters & Search**: Snel zoeken op status, severity, supplier, etc.
- **Responsive**: Werkt op desktop, tablet en mobile

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express**: REST API server
- **SQLite**: Lightweight database (eenvoudig te migreren naar PostgreSQL)
- **Multer**: File upload handling
- **Better-sqlite3**: Fast database driver

### Frontend
- **React 18** + **TypeScript**: Modern UI framework met type safety
- **Vite**: Snelle development server en build tool
- **React Router**: Client-side routing
- **Axios**: HTTP client voor API calls
- **Custom CSS**: Minimalistic, fashion-industry styling

## 📦 Installatie

### Vereisten
- Node.js 18+ en npm
- Git

### Stap 1: Clone het project
```bash
cd "Documents/👘Viktor & Rolf/V&R Vibecoding/Viktor_Rolf"
```

### Stap 2: Installeer dependencies
```bash
# Installeer alle dependencies (root, backend én frontend)
npm run install-all
```

### Stap 3: Setup backend environment
```bash
cd backend
cp .env.example .env
```

### Stap 4: Initialiseer database met dummy data
```bash
cd backend
npm run init-db
```

Dit commando:
- Creëert de SQLite database
- Maakt alle benodigde tabellen aan
- Vult de database met realistische dummy data:
  - 5 gebruikers (Sophie, Marco, Emma, Lucas, Isabella)
  - 4 collecties (SS26 Couture, FW26 RTW, etc.)
  - 10 samples met verschillende statussen
  - 6 quality reviews met issues
  - 6 supplier communications met deadlines
  - Complete audit trail

## 🚀 Gebruik

### Development Mode

Open **twee terminal vensters**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend draait op: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend draait op: `http://localhost:3000`

### Of gebruik beide tegelijk (vanaf root):
```bash
npm run dev
```

Open je browser: **http://localhost:3000**

## 📖 Systeem Gebruik

### Dashboard
- Overzicht van alle active collections
- Statistieken: samples, reviews, overdue items
- Quick access naar recente samples

### Collections
- Bekijk alle collecties (SS26, FW26, etc.)
- Filter op Active/Archived
- Klik op collectie → zie alle samples

### Sample Detail
- Complete informatie per sample
- Alle quality reviews gekoppeld aan het sample
- Alle supplier communications
- Audit trail met volledige geschiedenis

### Quality Control Dashboard
- Overzicht van alle quality reviews
- Filter op status (Pending/Changes Requested/Approved)
- Filter op severity (Low/Medium/High)
- Klik op review → zie details, foto's, comments

### Supplier Communications
- Alle communicatie met leveranciers
- Filter op status
- Automatische overdue warnings (⚠️)
- Important items gemarkeerd met ⭐
- Upload attachments (tech packs, documenten)

## 🗂️ Project Structuur

```
Viktor_Rolf/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.js   # Database connectie
│   │   │   ├── schema.js       # Database schema
│   │   │   ├── seed.js         # Dummy data seeder
│   │   │   └── init.js         # Database initialisatie
│   │   ├── routes/
│   │   │   ├── collections.js  # Collections API
│   │   │   ├── samples.js      # Samples API
│   │   │   ├── qualityReviews.js    # QC API met foto upload
│   │   │   ├── supplierCommunications.js  # Supplier comms API
│   │   │   └── users.js        # Users API
│   │   └── server.js           # Express server
│   ├── uploads/                # Uploaded files (photos, attachments)
│   ├── package.json
│   └── .env
│
├── frontend/                   # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx      # Main layout met sidebar nav
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # Dashboard overzicht
│   │   │   ├── Collections.tsx          # Collections lijst
│   │   │   ├── CollectionDetail.tsx     # Collectie detail
│   │   │   ├── SampleDetail.tsx         # Sample detail
│   │   │   ├── QualityControl.tsx       # QC dashboard
│   │   │   ├── QualityReviewDetail.tsx  # QC detail met foto's
│   │   │   ├── SupplierCommunications.tsx  # Supplier comms lijst
│   │   │   └── SupplierCommDetail.tsx   # Supplier comm detail
│   │   ├── api.ts              # API client functions
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── App.tsx             # Main App component met routing
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles (Viktor & Rolf theme)
│   │   └── App.css             # Component styles
│   ├── package.json
│   └── vite.config.ts
│
├── package.json                # Root package (run all scripts)
├── .gitignore
└── README.md
```

## 🗄️ Database Schema

### Core Tables
- **users**: Medewerkers met rollen (viewer/editor/admin)
- **collections**: Collecties per seizoen (SS26, FW26, etc.)
- **samples**: Individuele samples binnen collecties
- **quality_reviews**: Quality control reviews
- **quality_review_photos**: Foto's bij reviews
- **quality_review_comments**: Comments en feedback
- **supplier_communications**: Communicatie met leveranciers
- **supplier_comm_attachments**: Bijlagen bij communications
- **audit_trail**: Complete geschiedenis van alle wijzigingen

## 🎯 API Endpoints

### Collections
- `GET /api/collections` - Alle collecties
- `GET /api/collections/:id` - Specifieke collectie met samples
- `POST /api/collections` - Nieuwe collectie
- `PUT /api/collections/:id` - Update collectie
- `DELETE /api/collections/:id` - Verwijder collectie

### Samples
- `GET /api/samples` - Alle samples (met filters)
- `GET /api/samples/:id` - Sample details
- `POST /api/samples` - Nieuw sample
- `PUT /api/samples/:id` - Update sample
- `GET /api/samples/:id/audit-trail` - Audit trail

### Quality Reviews
- `GET /api/quality-reviews` - Alle reviews (met filters)
- `GET /api/quality-reviews/:id` - Review details
- `POST /api/quality-reviews` - Nieuwe review
- `PUT /api/quality-reviews/:id` - Update review
- `POST /api/quality-reviews/:id/photos` - Upload foto's
- `POST /api/quality-reviews/:id/comments` - Voeg comment toe
- `GET /api/quality-reviews/stats/overview` - Statistieken

### Supplier Communications
- `GET /api/supplier-communications` - Alle communications
- `GET /api/supplier-communications/:id` - Communication details
- `GET /api/supplier-communications/overdue` - Overdue items
- `GET /api/supplier-communications/important` - Belangrijke items
- `POST /api/supplier-communications` - Nieuwe communication
- `PUT /api/supplier-communications/:id` - Update communication
- `POST /api/supplier-communications/:id/attachments` - Upload bijlagen

### Users
- `GET /api/users` - Alle gebruikers
- `GET /api/users/:id` - Gebruiker details
- `POST /api/users` - Nieuwe gebruiker
- `PUT /api/users/:id` - Update gebruiker

## 👥 Dummy Data

Het systeem wordt geleverd met complete dummy data voor demo doeleinden:

### Gebruikers
- Sophie Laurent (admin)
- Marco Visconti (editor)
- Emma Chen (editor)  
- Lucas van der Berg (viewer)
- Isabella Rossi (editor)

### Collecties
- Spring Summer 2026 Couture
- Fall Winter 2026 RTW
- Spring Summer 2025 Couture (Archived)
- Fall Winter 2025 RTW

### Samples
- 10 samples verspreid over collecties
- Verschillende statussen: In Progress, Review Needed, Approved, Rejected
- Met version numbers (v1, v2, v3)

## 🔒 User Roles

- **Viewer**: Alleen lezen, geen wijzigingen
- **Editor**: Volledige CRUD op samples, reviews, communications
- **Admin**: Alle rechten inclusief user management en collections

## 🚧 Toekomstige Uitbreidingen (Nice to Have)

- [ ] Email notificaties voor overdue items
- [ ] Export naar Excel/PDF voor rapporten
- [ ] Bulk upload van samples
- [ ] Photo comparison view (side-by-side)
- [ ] Advanced filtering en saved filters
- [ ] Dashboard widgets customization
- [ ] Integration met externe systemen (ERP, PLM)
- [ ] Mobile app (React Native)

## 🎨 Design Filosofie

Het systeem volgt de Viktor & Rolf design esthetiek:
- **Minimalistisch**: Focus op functionaliteit zonder onnodige elementen
- **Monochromatisch**: Zwart, wit, grijstinten met gouden accenten
- **Typografie**: Clean sans-serif fonts met ruime spacing
- **Whitespace**: Veel ruimte voor visuele rust
- **Fashion-forward**: Professioneel en luxe uitstraling

## 📝 Development Notes

### Database Migratie
Het systeem gebruikt nu SQLite voor gemak, maar kan eenvoudig gemigreerd worden naar PostgreSQL:
1. Installeer `pg` package
2. Update `backend/src/database/connection.js`
3. Pas connection string aan in `.env`

### File Uploads
Uploads worden opgeslagen in `backend/uploads/`:
- Quality review photos: `uploads/quality-reviews/`
- Supplier attachments: `uploads/supplier-comms/`

In productie: overweeg cloud storage (AWS S3, Azure Blob)

### Error Handling
- Backend: Centralized error middleware
- Frontend: Try-catch blokken met user-friendly messages
- Logging: Console.error (in productie: gebruik logging service)

## 🤝 Support & Contact

Voor vragen of ondersteuning binnen Viktor & Rolf:
- Product Development Team
- IT Support
- Quality Control Manager

## 📄 License

UNLICENSED - Intern gebruik Viktor & Rolf

---

**Ontwikkeld met ❤️ voor Viktor & Rolf**  
*Elevating Fashion Quality Control*
