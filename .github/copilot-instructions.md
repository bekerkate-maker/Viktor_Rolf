# Viktor & Rolf Quality Control System - AI Coding Instructions

## Architecture Overview
Fashion sample management system: Collections → Samples → Quality Reviews + Supplier Communications.

**Stack**: Node.js/Express (ES modules) + Supabase (PostgreSQL) backend on port 3002, React 18 + TypeScript + Vite frontend on port 3000. Vite proxies `/api` and `/uploads` to backend.

**Data Flow**: `Frontend (api.ts) → /api/* → Express routes → Supabase client → PostgreSQL`

## Quick Start
```bash
npm run install-all  # Install root + backend + frontend deps
npm run dev          # Start both servers concurrently
cd backend && npm run init-db  # Reset SQLite with seed data (legacy)
```

## Domain Model & Enums
Use exact values from `frontend/src/types.ts`:
- **sample_round**: `'Proto' | 'SMS' | 'PPS' | 'Final'`
- **category**: `'Mariage' | 'Haute Couture' | 'Ready to Wear'`
- **Sample status**: `'In Review' | 'Changes Needed' | 'Approved' | 'Rejected'`
- **QualityReview status**: `'Open' | 'Resolved' | 'Re-opened'`
- **SupplierComm status**: `'Waiting for Supplier' | 'Waiting for Internal Feedback' | 'Completed'`

## Backend Patterns (`backend/src/routes/`)
Routes use Supabase client with aliased foreign key joins:
```javascript
// Pattern: Load relations using !foreign_key_column syntax
const { data, error } = await supabase
  .from('samples')
  .select(`*, collection:collections(name, season), responsible_user:users!responsible_user_id(first_name, last_name)`)
  .eq('collection_id', collection_id);

// Transform for API response compatibility
const transformed = data.map(s => ({
  ...s,
  collection_name: s.collection?.name,
  responsible_user_name: `${s.responsible_user?.first_name} ${s.responsible_user?.last_name}`
}));
```

## Frontend Patterns
**API calls**: Always use typed wrappers from `frontend/src/api.ts`:
```typescript
import { samplesAPI, collectionsAPI, qualityReviewsAPI, photosAPI } from './api';
const samples = await samplesAPI.getAll({ collection_id: '123' });
```

**Pages**: Standard `useState` + `useEffect` pattern with loading state:
```typescript
const [sample, setSample] = useState<Sample | null>(null);
const [loading, setLoading] = useState(true);
useEffect(() => { loadSample(id); }, [id]);
```

## File Uploads
- Multer configured in route files (`photos.js`, `qualityReviews.js`, `supplierCommunications.js`)
- Storage: `backend/uploads/samples/` for sample photos
- 10MB limit, allowed types: `jpeg|jpg|png|gif|webp`
- Photos API: `photosAPI.uploadPhotos(sampleId, files)` handles FormData

## Environment Variables
**Backend** (`backend/.env`):
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx  # Service role key (bypasses RLS)
JWT_SECRET=xxx
PORT=3002
```

## Key Files
- `backend/src/database/supabase.js` - Supabase client config
- `backend/src/middleware/auth.js` - JWT verification middleware
- `frontend/src/types.ts` - All TypeScript interfaces
- `frontend/vite.config.ts` - Proxy configuration (target port 3002)
