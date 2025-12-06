import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SplashScreen } from '@/components/SplashScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import Home from '@/pages/Home';
import Education from '@/pages/Education';
import Communication from '@/pages/Communication';
import MusicAdventure from '@/pages/MusicAdventure';
import Marketplace from '@/pages/Marketplace';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import Chat from '@/pages/Chat';

export default function Index() {
  return (
    <>
      <SplashScreen />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Home />} />
              <Route path="/education" element={<Education />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/music-adventure" element={<MusicAdventure />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/chat/:userId?" element={<Chat />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}