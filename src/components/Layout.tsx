import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundOrnaments } from '@/components/BackgroundOrnaments';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import logo from '@/assets/logo.png';
import { NotificationBell } from './NotificationBell';
import { TodoWidget } from './TodoWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: 'Home', url: '/', emoji: '🏠', desc: 'Social + Explore' },
  { title: 'Education', url: '/education', emoji: '📚', desc: 'Notes, Docs, Study Hub' },
  { title: 'Messages', url: '/chat', emoji: '💬', desc: 'Chat + VC + Groups' },
  { title: 'Creativity', url: '/creativity', emoji: '🎨', desc: 'Quotes/Ideas/Moods' },
  { title: 'Music & Adventure', url: '/music-adventure', emoji: '🎵', desc: 'Songs + Trips + Maps' },
  { title: 'Marketplace', url: '/marketplace', emoji: '🛒', desc: 'Buy/Sell/Local Business' },
  { title: 'Settings', url: '/settings', emoji: '⚙️', desc: 'Controls + Privacy' },
];

function LayoutContent({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('coc_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [isAuthPage, setIsAuthPage] = useState(false);

  useEffect(() => {
    setIsAuthPage(location.pathname === '/auth');
  }, [location]);

  // Auto-collapse sidebar on navigation
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

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

  // Check if in chat conversation (hide layout on mobile)
  const isChatOpen = location.pathname.startsWith('/chat/');

  return (
    <div className="min-h-screen w-full relative flex">
      <BackgroundOrnaments />
      
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
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
                          <span className="text-lg">{item.emoji}</span>
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
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Header - Crown of Creation, Notification, Theme */}
        <header className="sticky top-0 z-40 glass-card border-b border-border px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!isMobile && <SidebarTrigger className="transition-transform hover:scale-110" />}
              <Link to="/" className="flex items-center gap-2" onClick={handleLogoClick}>
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm gradient-text">Crown of Creation</span>
              </Link>
            </div>

            <div className="flex items-center gap-1">
              {user && <NotificationBell />}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="h-8 w-8"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area with optional Todo Widget on desktop */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-2 md:p-3">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </div>

          {/* Desktop Todo Widget */}
          {!isMobile && location.pathname === '/' && (
            <aside className="hidden lg:block w-72 border-l border-border p-3 overflow-y-auto">
              <TodoWidget />
            </aside>
          )}
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
