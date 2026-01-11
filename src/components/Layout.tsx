import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Sun, Moon, Menu, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundOrnaments } from '@/components/BackgroundOrnaments';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SubNavigation } from '@/components/SubNavigation';
import { DesktopMessagesPanel } from './DesktopMessagesPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: 'Home', url: '/', emoji: '🏠', desc: 'Social + Explore' },
  { title: 'Education', url: '/education', emoji: '📚', desc: 'Notes, Docs, Study Hub' },
  { title: 'Messages', url: '/chat', emoji: '💬', desc: 'Chat + VC + Groups' },
  { title: 'FunPun', url: '/funpun', emoji: '🎮', desc: 'Games for Fresh Mind' },
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
          <Crown className="w-7 h-7 text-primary animate-pulse" />
          <span className="text-lg font-bold gradient-text">Zenpeace</span>
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
    const saved = localStorage.getItem('zenpeace_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [isAuthPage, setIsAuthPage] = useState(false);
  
  // Scroll hide/show state for Facebook-like behavior
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    setIsAuthPage(location.pathname === '/auth');
  }, [location]);

  // Auto-collapse sidebar on navigation
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

  // Facebook-style scroll behavior
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDiff = currentScrollY - lastScrollY.current;
    
    // Only trigger on significant scroll (>5px) to prevent jitter
    if (Math.abs(scrollDiff) < 5) return;
    
    if (currentScrollY < 50) {
      // Always show at top
      setHeaderVisible(true);
    } else if (scrollDiff > 0 && currentScrollY > 50) {
      // Scrolling down - hide header
      setHeaderVisible(false);
    } else if (scrollDiff < 0) {
      // Scrolling up - show header
      setHeaderVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

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
    localStorage.setItem('zenpeace_theme', theme);
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

  const handleBack = () => {
    navigate('/');
  };

  // Check if we're in chat view (full screen, no header)
  const isFullScreenPage = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';
  
  // Check if we're on Home page subsections (where we show 6 icons and banner)
  const isHomeSection = ['/', '/search', '/private', '/notifications'].includes(location.pathname) || 
                        location.pathname.startsWith('/profile/') ||
                        (location.pathname === '/' && localStorage.getItem('zenpeace_feed_filter') === 'videos');
  
  // Only show the main banner on exact Home page (/)
  const showBanner = location.pathname === '/';
  
  // Only show SubNavigation on home section pages
  const showSubNav = isHomeSection;
  
  // Check if we're in a subsection that needs back button
  const isSubSection = ['/create', '/private', '/notifications', '/search'].includes(location.pathname) || 
                       location.pathname.startsWith('/profile/');

  // Other sections (not home) - no create, no theme in top bar
  const isOtherSection = ['/chat', '/marketplace', '/settings', '/funpun', '/education'].includes(location.pathname) ||
                         location.pathname.startsWith('/music-adventure');

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isFullScreenPage) {
    return (
      <div className="min-h-screen w-full relative">
        <BackgroundOrnaments />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex">
      <BackgroundOrnaments />
      
      {/* Desktop Sidebar - Sticky, extended for ultra-wide */}
      {!isMobile && (
        <Sidebar className="border-r border-border transition-transform duration-300 sticky top-0 h-screen w-72 xl:w-80 shrink-0">
          <SidebarContent className="glass-card">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Crown className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-sm font-bold gradient-text">Zenpeace</span>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px]">Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item, index) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        isActive={isActive(item.url)}
                        onClick={() => handleMenuClick(item.url)}
                        className="cursor-pointer transition-all duration-300 hover:translate-x-1 hover:bg-primary/10 py-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-base">{item.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block text-xs">{item.title}</span>
                            <span className="text-[9px] text-muted-foreground block truncate">{item.desc}</span>
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
        {/* Header - Different for Home vs Other sections */}
        <header 
          className={`sticky z-40 glass-card border-b border-border transition-all duration-300 ${
            headerVisible ? 'top-0 opacity-100 translate-y-0' : '-top-16 opacity-0 -translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            {/* Left side */}
            <div className="flex items-center gap-1.5">
              {isMobile && isSubSection ? (
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : isMobile ? (
                <MobileSidebar isActive={isActive} onNavigate={handleMenuClick} />
              ) : null}
              
              {/* Create & Theme Toggle - ONLY on Home main page (/) */}
              {showBanner && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate('/create')}
                    className="h-8 w-8 bg-primary/10 hover:bg-primary/20"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTheme} 
                    className="h-8 w-8"
                  >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>

            {/* Right side - Zenpeace Branding */}
            <Link 
              to="/" 
              className="flex items-center gap-1.5" 
              onClick={handleLogoClick}
            >
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-bold text-base gradient-text whitespace-nowrap">Zenpeace</span>
            </Link>
          </div>
          
          {/* Sub Navigation - Only on Home section pages */}
          {showSubNav && <SubNavigation visible={headerVisible} />}
        </header>

        {/* Content Area with Messages Panel on desktop (Home only) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content - Constrained for balanced layout */}
          <div className="flex-1 overflow-y-auto p-2 md:p-3 min-w-0">
            <div className="max-w-lg xl:max-w-xl mx-auto">
              {children}
            </div>
          </div>

          {/* Desktop Messages Panel - Only on Home page */}
          {!isMobile && location.pathname === '/' && (
            <aside className="hidden lg:flex w-[400px] xl:w-[440px] border-l border-border flex-col overflow-hidden shrink-0">
              <DesktopMessagesPanel />
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
