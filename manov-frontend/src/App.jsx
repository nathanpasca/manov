import { NovelsPage } from "@/pages/novels/NovelsPage" // Updated import if you overwrote placeholder
import { NovelDetailPage } from "@/pages/novels/NovelDetailPage" // New
import { AuthorsPage } from "@/pages/authors/AuthorsPage" // Updated import
import { AuthorDetailPage } from "@/pages/authors/AuthorDetailPage" // New
import { SearchPage } from "@/pages/SearchPage" // New
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "sonner"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { RegisterPage } from "./pages/auth/RegisterPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { ProfilePage } from "./pages/user/ProfilePage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { MainLayout } from "./layouts/MainLayout"
import { HomePage } from "./pages/HomePage"
import { UserReadingProgressPage } from "./pages/user/UserReadingProgressPage"
import { ChapterReadingPage } from "./pages/chapters/ChapterReadingPage"
import { UserFavoritesPage } from "./pages/user/UserFavoritesPage"

import { AdminLayout } from "@/layouts/AdminLayout" // New
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute" // New
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage" // New
// Placeholder for other admin pages you'll add in Phase 7 & 8
const AdminDashboardPage = () => (
  <div className='p-4'>
    <h1 className='text-xl font-semibold'>Admin Dashboard (Coming Soon)</h1>
  </div>
)
const AdminLanguagesPage = () => (
  <div className='p-4'>
    <h1 className='text-xl font-semibold'>Language Management (Phase 7)</h1>
  </div>
)
const AdminAuthorsPage = () => (
  <div className='p-4'>
    <h1 className='text-xl font-semibold'>Author Management (Phase 7)</h1>
  </div>
)
const AdminNovelsPage = () => (
  <div className='p-4'>
    <h1 className='text-xl font-semibold'>Novel Management (Phase 8)</h1>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path='/' element={<HomePage />} />

            <Route path='/novels' element={<NovelsPage />} />
            <Route path='/novels/:identifier' element={<NovelDetailPage />} />

            <Route path='/novels/:novelId/chapters/:chapterNumber' element={<ChapterReadingPage />} />

            <Route
              path='/users/me/reading-progress'
              element={
                <ProtectedRoute>
                  <UserReadingProgressPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/users/me/favorites'
              element={
                <ProtectedRoute>
                  <UserFavoritesPage />
                </ProtectedRoute>
              }
            />

            <Route path='/authors' element={<AuthorsPage />} />
            <Route path='/authors/:authorId' element={<AuthorDetailPage />} />

            <Route path='/search' element={<SearchPage />} />

            <Route path='/register' element={<RegisterPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route
              path='/profile/me'
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path='*' element={<NotFoundPage />} />
          </Route>

          {/* Admin Routes with AdminLayout and AdminProtectedRoute */}
          <Route
            path='/admin'
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }>
            <Route index element={<AdminDashboardPage />} /> {/* Default admin page */}
            <Route path='dashboard' element={<AdminDashboardPage />} />
            <Route path='users' element={<AdminUsersPage />} />
            <Route path='languages' element={<AdminLanguagesPage />} /> {/* Placeholder */}
            <Route path='authors' element={<AdminAuthorsPage />} /> {/* Placeholder */}
            <Route path='novels' element={<AdminNovelsPage />} /> {/* Placeholder */}
            {/* Add more admin-specific routes here as needed */}
          </Route>
        </Routes>
        <Toaster richColors position='top-right' />
      </Router>
    </AuthProvider>
  )
}

export default App
