import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext.jsx'
import { TickerProvider } from './shared/context/TickerContext.jsx'
import { VoiceReactionsProvider } from './shared/context/VoiceReactionsContext.jsx'
import ProtectedRoute from './shared/components/ProtectedRoute.jsx'
import Layout from './shared/components/Layout.jsx'
import Login from './features/auth/Login.jsx'
import Signup from './features/auth/Signup.jsx'
import Discussions from './features/discussions/Discussions.jsx'
import NewPost from './features/discussions/NewPost.jsx'
import PostDetail from './features/discussions/PostDetail.jsx'
import NewsReel from './features/news/NewsReel.jsx'
import NewsDetail from './features/news/NewsDetail.jsx'
import Profile from './features/portfolio/Profile.jsx'

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
