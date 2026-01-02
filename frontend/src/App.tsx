import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import SampleDetail from './pages/SampleDetail';
import QualityControl from './pages/QualityControl';
import QualityReviewDetail from './pages/QualityReviewDetail';
import SupplierCommunications from './pages/SupplierCommunications';
import SupplierCommDetail from './pages/SupplierCommDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes - with layout */}
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/collections" element={<Layout><Collections /></Layout>} />
        <Route path="/collections/:id" element={<Layout><CollectionDetail /></Layout>} />
  <Route path="/samples/:id" element={<Layout><SampleDetail /></Layout>} />
  <Route path="/collections/:collectionId/samples/:id" element={<Layout><SampleDetail /></Layout>} />
        <Route path="/quality-control" element={<Layout><QualityControl /></Layout>} />
        <Route path="/quality-control/:category/:year/:season" element={<Layout><QualityControl /></Layout>} />
        <Route path="/quality-reviews/:id" element={<Layout><QualityReviewDetail /></Layout>} />
        <Route path="/supplier-communications" element={<Layout><SupplierCommunications /></Layout>} />
        <Route path="/supplier-communications/:id" element={<Layout><SupplierCommDetail /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
