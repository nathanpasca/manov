// ... other imports
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
        </Routes>
        <Toaster richColors position='top-right' />
      </Router>
    </AuthProvider>
  )
}

export default App
