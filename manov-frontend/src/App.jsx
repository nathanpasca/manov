import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const NovelDetail = React.lazy(() => import('./pages/NovelDetail'));
const Library = React.lazy(() => import('./pages/Library'));
const Reader = React.lazy(() => import('./pages/Reader'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Admin Pages Lazy Load
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ManageGenres = React.lazy(() => import('./pages/admin/ManageGenres'));
const AddNovel = React.lazy(() => import('./pages/admin/AddNovel'));
const AddChapter = React.lazy(() => import('./pages/admin/AddChapter'));
const EditNovelMetadata = React.lazy(() => import('./pages/admin/EditNovelMetadata'));
const EditChapter = React.lazy(() => import('./pages/admin/EditChapter'));



function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
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
          <Suspense fallback={<LoadingSpinner />}>
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
          </Suspense>
        </Router>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;