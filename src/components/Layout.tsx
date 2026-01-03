import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Sun, Moon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundOrnaments } from '@/components/BackgroundOrnaments';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  { title: 'Adventure', url: '/music-adventure', emoji: '🏔️', desc: 'Challenges + Discover + Travel' },
  { title: 'Marketplace', url: '/marketplace', emoji: '🛒', desc: 'Buy/Sell/Local Business' },
  { title: 'Settings', url: '/settings', emoji: '⚙️', desc: 'Controls + Privacy' },
];

function MobileSidebar({ isActive, onNavigate }: { isActive: (path: string) => boolean; onNavigate: (url: string) => void }) {
  const [open, setOpen] = useState(false);

  const handleItemClick = (url: string) => {
    onNavigate(url);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 relative"
          style={{
            boxShadow: '0 0 15px 3px hsl(var(--primary) / 0.4), 0 0 30px 5px hsl(var(--primary) / 0.2)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          <Menu className="h-5 w-5 text-primary" />
          <span className="absolute inset-0 rounded-md bg-primary/10 animate-pulse" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 glass-card border-r border-primary/20">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img 
            src={logo} 
            alt="Crown of Creation" 
            className="w-8 h-8 animate-pulse-glow" 
          />
          <span className="text-lg font-bold gradient-text">Crown Of Creation</span>
        </div>
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleItemClick(item.url)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive(item.url) 
                  ? 'bg-primary/20 text-primary' 
                  : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 text-left">
                <span className="font-medium block text-sm">{item.title}</span>
                <span className="text-[10px] text-muted-foreground">{item.desc}</span>
              </div>
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

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

  return (
    <div className="min-h-screen w-full relative flex">
      <BackgroundOrnaments />
      
      {/* Desktop Sidebar - Sticky for desktop/iPad */}
      {!isMobile && (
        <Sidebar className="border-r border-border transition-transform duration-300 sticky top-0 h-screen">
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
        {/* Header */}
        <header className="sticky top-0 z-40 glass-card border-b border-border px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Mobile sidebar trigger + Logo centered on mobile */}
            <div className="flex items-center gap-2">
              {isMobile && (
                <MobileSidebar isActive={isActive} onNavigate={handleMenuClick} />
              )}
              
              {/* Desktop: Logo on left */}
              {!isMobile && (
                <Link to="/" className="flex items-center gap-2" onClick={handleLogoClick}>
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm gradient-text">Crown of Creation</span>
                </Link>
              )}
            </div>

            {/* Center - Mobile logo */}
            {isMobile && (
              <Link to="/" className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2" onClick={handleLogoClick}>
                <Crown className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs gradient-text whitespace-nowrap">Crown of Creation</span>
              </Link>
            )}

            {/* Right side - Notifications + Theme */}
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
