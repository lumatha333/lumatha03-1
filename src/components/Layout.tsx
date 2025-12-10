import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Home, GraduationCap, MessageCircle, Music, Store, Settings, Crown, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundOrnaments } from '@/components/BackgroundOrnaments';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import logo from '@/assets/logo.png';
import { NotificationBell } from './NotificationBell';
import { SearchBar } from './SearchBar';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: 'Home', url: '/', icon: Home, emoji: '🏠', desc: 'Social + Explore' },
  { title: 'Education', url: '/education', icon: GraduationCap, emoji: '📚', desc: 'Notes, Docs, Study Hub' },
  { title: 'Messages', url: '/chat', icon: MessageCircle, emoji: '💬', desc: 'Chat + VC + Groups' },
  { title: 'Creativity', url: '/creativity', icon: Crown, emoji: '🎨', desc: 'Quotes/Ideas/Moods' },
  { title: 'Music & Adventure', url: '/music-adventure', icon: Music, emoji: '🎵', desc: 'Songs + Trips + Maps' },
  { title: 'Marketplace', url: '/marketplace', icon: Store, emoji: '🛒', desc: 'Buy/Sell/Local Business' },
  { title: 'Settings', url: '/settings', icon: Settings, emoji: '⚙️', desc: 'Controls + Privacy' },
];

function LayoutContent({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpen, isMobile, open } = useSidebar();
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('coc_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [isAuthPage, setIsAuthPage] = useState(false);

  useEffect(() => {
    setIsAuthPage(location.pathname === '/auth');
  }, [location]);

  // Auto-collapse sidebar on ANY navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !isAuthPage) {
        navigate('/auth');
      } else if (session && isAuthPage) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isAuthPage) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isAuthPage]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
    localStorage.setItem('coc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMenuClick = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Hide layout completely for active chat on mobile
  const isChatOpen = location.pathname.startsWith('/chat/');

  return (
    <div className="min-h-screen w-full relative flex">
      <BackgroundOrnaments />
      
      <Sidebar className="border-r border-border transition-transform duration-300">
        <SidebarContent className="glass-card">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <img 
              src={logo} 
              alt="Crown of Creation" 
              className="w-8 h-8 animate-pulse-glow cursor-pointer transition-transform hover:scale-110" 
              onClick={handleLogoClick} 
            />
            <span className="text-lg font-bold gradient-text">Crown Of Creation</span>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive(item.url)}
                      onClick={() => handleMenuClick(item.url)}
                      className="cursor-pointer transition-all duration-300 hover:translate-x-1 hover:bg-primary/10"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-lg transition-transform duration-300 group-hover:scale-125">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block">{item.title}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{item.desc}</span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 relative">
        <header className="sticky top-0 z-40 glass-card border-b border-border p-2 md:p-3 transition-all duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="transition-transform hover:scale-110 active:scale-95" />
              <Link 
                to="/" 
                className="flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95" 
                onClick={handleLogoClick}
              >
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <span className="font-bold hidden sm:block text-sm md:text-base gradient-text">Crown Of Creation</span>
              </Link>
            </div>
            
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {user && <NotificationBell />}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="transition-all duration-300 hover:bg-primary/10 hover:scale-110 active:scale-95"
              >
                {theme === 'light' ? <Moon className="h-4 w-4 md:h-5 md:w-5" /> : <Sun className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
            </div>
          </div>
          
          <div className="md:hidden mt-2">
            <SearchBar />
          </div>
        </header>

        <div className="p-2 md:p-4 relative z-10">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}