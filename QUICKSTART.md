# Viktor & Rolf QC System - Quick Start Guide

## 🚀 Snelle Start

### 1. Installeer alles
```bash
npm run install-all
```

### 2. Setup database
```bash
cd backend
npm run init-db
cd ..
```

### 3. Start beide servers
```bash
npm run dev
```

### 4. Open browser
Ga naar: **http://localhost:3000**

## 📊 Dummy Data

Het systeem bevat complete dummy data:
- 5 gebruikers
- 4 collecties (SS26 Couture, FW26 RTW, etc.)
- 10 samples met verschillende statussen
- 6 quality reviews
- 6 supplier communications

## 🎯 Hoofdfuncties

### Quality Control Dashboard
1. Ga naar **Quality Control** in de sidebar
2. Bekijk alle quality reviews
3. Filter op status/severity
4. Klik op een review voor details, foto's en comments

### Supplier Communications
1. Ga naar **Supplier Comms** in de sidebar
2. Zie alle communicatie met leveranciers
3. Overdue items zijn gemarkeerd met ⚠️
4. Belangrijke items met ⭐

### Collections & Samples
1. Ga naar **Collections**
2. Klik op een collectie
3. Zie alle samples
4. Klik op een sample voor volledig overzicht

## 🔍 Tips

- **Dashboard**: Start hier voor overzicht
- **Filters**: Gebruik filters om snel te zoeken
- **Audit Trail**: Zie volledige geschiedenis bij elk sample
- **Status Badges**: Kleurgecodeerd voor snelle herkenning

## 🛠️ Troubleshooting

**Backend start niet?**
```bash
cd backend
npm install
```

**Frontend start niet?**
```bash
cd frontend
npm install
```

**Database errors?**
```bash
cd backend
rm database.sqlite
npm run init-db
```

## 📱 Support

Zie volledige documentatie in **README.md**
