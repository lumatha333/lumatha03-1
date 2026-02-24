import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SplashScreen } from '@/components/SplashScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import { useGlobalProtection, GlobalWatermark, GlobalBlurOverlay } from '@/components/GlobalContentProtection';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import Home from '@/pages/Home';
import Education from '@/pages/Education';
import MusicAdventure from '@/pages/MusicAdventure';
import RandomConnect from '@/pages/RandomConnect';
import Marketplace from '@/pages/Marketplace';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import Chat from '@/pages/Chat';
import Public from '@/pages/Public';
import Private from '@/pages/Private';
import Saved from '@/pages/Saved';
import Create from '@/pages/Create';
import FunPun from '@/pages/FunPun';
import Notifications from '@/pages/Notifications';
import Search from '@/pages/Search';
import NotFound from '@/pages/NotFound';

export default function Index() {
  return (
    <>
      <SplashScreen />
      <BrowserRouter>
        <AuthProvider>
          <ProtectionLayer />
          <Layout>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Home />} />
              <Route path="/education" element={<Education />} />
              <Route path="/learn" element={<Education />} />
              <Route path="/music-adventure" element={<MusicAdventure />} />
              <Route path="/random-connect" element={<RandomConnect />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/chat/:userId?" element={<Chat />} />
              <Route path="/public" element={<Public />} />
              <Route path="/private" element={<Private />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/create" element={<Create />} />
              <Route path="/funpun" element={<FunPun />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

/** Renders global watermark + blur overlay + activates protection hooks + auto theme */
function ProtectionLayer() {
  const { username } = useGlobalProtection();
  useAutoTheme(); // Auto light/dark based on time of day
  return (
    <>
      <GlobalWatermark username={username} />
      <GlobalBlurOverlay />
    </>
  );
}
