import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Reader from './pages/Reader';
import NovelDetail from './pages/NovelDetail'; // Import baru
import Home from './pages/Home';
import About from './pages/About'; // Import About
import EditChapter from './pages/admin/EditChapter';
import EditNovelMetadata from './pages/admin/EditNovelMetadata';
import ManageGenres from './pages/admin/ManageGenres';
import AddNovel from './pages/admin/AddNovel';
import AddChapter from './pages/admin/AddChapter';
import AdminDashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Library from './pages/Library';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            className: 'shadow-xl',
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-text)',
              border: '1px solid var(--toast-border)',
              padding: '16px',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }}
        />
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* Rute Login */}
          <Route path="/login" element={<Login />} />

          {/* Rute Register */}
          <Route path="/register" element={<Register />} />

          {/* Rute Detail Novel */}
          <Route path="/novel/:slug" element={<NovelDetail />} />

          {/* Rute Library */}
          <Route path="/library" element={<Library />} />

          {/* Rute Baca */}
          <Route path="/novel/:slug/read/:chapterNum" element={<Reader />} />

          {/* Rute Admin */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/genres" element={<ManageGenres />} />
            <Route path="/admin/add-novel" element={<AddNovel />} />
            <Route path="/admin/add-chapter/:slug" element={<AddChapter />} />
            <Route path="/admin/edit-novel/:slug" element={<EditNovelMetadata />} />
            <Route path="/admin/edit/:slug/:chapterNum" element={<EditChapter />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;