import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { TickerProvider } from './context/TickerContext.jsx'
import { VoiceReactionsProvider } from './context/VoiceReactionsContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Discussions from './pages/Discussions.jsx'
import NewPost from './pages/NewPost.jsx'
import PostDetail from './pages/PostDetail.jsx'
import NewsReel from './pages/NewsReel.jsx'
import NewsDetail from './pages/NewsDetail.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  return (
    <AuthProvider>
      <TickerProvider>
        <VoiceReactionsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/discussions" replace />} />
                <Route path="discussions" element={<Discussions />} />
                <Route path="discussions/new" element={<NewPost />} />
                <Route path="discussions/:id" element={<PostDetail />} />
                <Route path="news" element={<NewsReel />} />
                <Route path="news/:id" element={<NewsDetail />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/discussions" replace />} />
          </Routes>
        </VoiceReactionsProvider>
      </TickerProvider>
    </AuthProvider>
  )
}
