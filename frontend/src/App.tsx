import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import SampleDetail from './pages/SampleDetail';
import QualityControl from './pages/QualityControl';
import QualityReviewDetail from './pages/QualityReviewDetail';
import { ProtectedRoute } from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - with layout */}
        <Route path="/collections" element={<ProtectedRoute><Layout><Collections /></Layout></ProtectedRoute>} />
        <Route path="/collections/:id" element={<ProtectedRoute><Layout><CollectionDetail /></Layout></ProtectedRoute>} />
        <Route path="/samples/:id" element={<ProtectedRoute><Layout><SampleDetail /></Layout></ProtectedRoute>} />
        <Route path="/collections/:collectionId/samples/:id" element={<ProtectedRoute><Layout><SampleDetail /></Layout></ProtectedRoute>} />
        <Route path="/quality-control" element={<ProtectedRoute><Layout><QualityControl /></Layout></ProtectedRoute>} />
        <Route path="/quality-control/:category" element={<ProtectedRoute><Layout><QualityControl /></Layout></ProtectedRoute>} />
        <Route path="/quality-control/:category/:year" element={<ProtectedRoute><Layout><QualityControl /></Layout></ProtectedRoute>} />
        <Route path="/quality-control/:category/:year/:season" element={<ProtectedRoute><Layout><QualityControl /></Layout></ProtectedRoute>} />
        <Route path="/quality-control/manufacturer/:manufacturer" element={<ProtectedRoute><Layout><QualityControl /></Layout></ProtectedRoute>} />
        <Route path="/quality-control/manufacturer/:manufacturer/collection/:collectionId" element={<ProtectedRoute><Layout><QualityControl /></Layout></ProtectedRoute>} />
        <Route path="/quality-reviews/:id" element={<ProtectedRoute><Layout><QualityReviewDetail /></Layout></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
