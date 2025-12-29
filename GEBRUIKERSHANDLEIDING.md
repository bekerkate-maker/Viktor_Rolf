# Viktor & Rolf QC System - Gebruikershandleiding

## 🎯 Voor Wie Is Dit Systeem?

- **Product Developers**: Beheer samples en kwaliteitscontroles
- **Quality Control Team**: Uitvoeren van reviews en vastleggen van issues
- **Productie Teams**: Communicatie tracken met leveranciers

## 📱 Toegang

Open je browser en ga naar: **http://localhost:3000**

## 🗺️ Navigatie

Het systeem heeft een zwarte sidebar aan de linkerkant met 4 hoofdsecties:

### 1. Dashboard
Je startpunt met overzicht van:
- Active collections
- Total samples
- Pending reviews
- Overdue communications

### 2. Collections
- Bekijk alle collecties (SS26 Couture, FW26 RTW, etc.)
- Klik op een collectie → zie alle samples
- Klik op een sample → volledig detail

### 3. Quality Control
- Overzicht van alle quality reviews
- Filter op status of severity
- Klik op review → zie details, foto's, comments

### 4. Supplier Communications
- Alle communicatie met leveranciers
- Filter op status
- Overdue items zijn rood gemarkeerd met ⚠️
- Belangrijke items met ⭐

## 🎨 Status & Labels

### Sample Status
- **🔵 In Progress**: Sample in ontwikkeling
- **🟡 Review Needed**: Sample klaar voor quality check
- **🟢 Approved**: Sample goedgekeurd
- **🔴 Rejected**: Sample afgekeurd, nieuwe versie nodig

### Quality Review Severity
- **Low**: Kleine issues, niet kritisch
- **Medium**: Belangrijke issues, aandacht vereist
- **High**: Kritische issues, directe actie nodig

### Supplier Communication Status
- **Waiting for Supplier**: Wachten op leverancier
- **Waiting for Internal Feedback**: Intern review nodig
- **Completed**: Afgerond

## 📸 Quality Reviews - Hoe Werkt Het?

### Een Review Bekijken
1. Ga naar **Quality Control**
2. Klik op een review in de lijst
3. Je ziet:
   - Issue beschrijving
   - Severity level
   - Foto's (als geüpload)
   - Comments en geschiedenis
   - Action points

### Foto's Bekijken
- Klik op een foto voor groter beeld
- Alle foto's staan in een gallery view
- Je kunt meerdere foto's per review hebben

## 📞 Supplier Communications - Hoe Werkt Het?

### Een Communicatie Bekijken
1. Ga naar **Supplier Communications**
2. Klik op een entry in de lijst
3. Je ziet:
   - Supplier naam
   - Type communicatie (Email/Call/Meeting)
   - Volledige samenvatting
   - Deadlines (Sample due, Feedback due)
   - Bijlagen (als geüpload)
   - Link naar gekoppelde sample

### Overdue Items Herkennen
- Rood gemarkeerd met ⚠️
- Staat bovenaan in de lijst
- Deadline is verstreken

### Belangrijke Items
- Gemarkeerd met ⭐
- Vaak kritische issues of urgent

## 🔍 Zoeken & Filteren

### Collections
- Filter op **Active** of **Archived**
- Zie direct aantal samples per status

### Quality Control
- Filter op **Status** (Pending/Changes Requested/Approved)
- Filter op **Severity** (Low/Medium/High)
- Beide filters combineerbaar

### Supplier Communications
- Filter op **Status**
- Bekijk alleen **Overdue** items
- Bekijk alleen **Important** items

## 📊 Sample Details Pagina

De sample detail pagina is je centrale overzicht:

### Informatie Blok
- Sample code (bijv. SS26-C-001)
- Status
- Versie nummer
- Verantwoordelijke persoon
- Timestamps

### Quality Reviews Sectie
- Alle reviews voor dit sample
- Quick links naar review details
- Status overview

### Supplier Communications Sectie
- Alle communicatie voor dit sample
- Deadlines overzicht
- Quick links naar details

### Audit Trail
- Complete geschiedenis
- Wie heeft wat gewijzigd en wanneer
- Transparantie en traceability

## 🎓 Tips & Best Practices

### Voor Product Developers
1. Check dashboard dagelijks voor overview
2. Let op overdue communications
3. Update sample status regelmatig
4. Koppel samples aan de juiste collection

### Voor Quality Control
1. Begin bij Quality Control dashboard
2. Prioriteer High severity issues
3. Gebruik foto's om issues duidelijk te maken
4. Voeg gedetailleerde comments toe
5. Update status na elke actie

### Voor Productie Teams
1. Check Supplier Communications dagelijks
2. Markeer belangrijke items met ⭐
3. Houd deadlines in de gaten
4. Upload relevante documenten (tech packs)
5. Noteer alle afspraken in de summary

## 🚨 Problemen Oplossen

### Backend Error
Als je geen data ziet:
1. Check of backend draait (terminal 1)
2. Zou moeten zeggen: "running on port 3001"
3. Herstart: `npm run dev` in backend folder

### Frontend Error
Als de pagina niet laadt:
1. Check of frontend draait (terminal 2)
2. Zou moeten zeggen: "ready" en "http://localhost:3000"
3. Herstart: `npm run dev` in frontend folder

### Database Reset
Als data corrupt lijkt:
```bash
cd backend
rm database.sqlite
npm run init-db
```

## 🔐 User Roles (Toekomstig)

Momenteel is het systeem open voor iedereen op het netwerk. In toekomstige versies:
- **Viewer**: Alleen lezen
- **Editor**: Volledige CRUD
- **Admin**: User management + alles

## 📱 Toetsenbord Shortcuts

- `Ctrl/Cmd + K`: Quick search (toekomstig)
- `Esc`: Sluit modals
- Browser back button: Terug naar vorige pagina

## 💡 Wist Je Dat...

- Het systeem automatisch alle wijzigingen logt in de audit trail
- Je multiple foto's per review kunt uploaden
- Deadlines automatisch gemarkeerd worden als overdue
- Samples versie nummers hebben voor tracking
- Je meerdere quality reviews per sample kunt hebben

## 📧 Support

Voor vragen of problemen:
- IT Support Team
- Product Development Lead
- Quality Control Manager

---

**Happy Quality Controlling! 👗✨**
