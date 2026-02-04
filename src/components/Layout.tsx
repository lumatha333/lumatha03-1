import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundOrnaments } from '@/components/BackgroundOrnaments';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SubNavigation } from '@/components/SubNavigation';
import { DesktopMessagesPanel } from './DesktopMessagesPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import lumathaLogo from '@/assets/lumatha-logo.png';

interface LayoutProps {
  children: ReactNode;
}

// Colorful icons for sidebar
const menuItems = [
  { title: 'Home', url: '/', emoji: '🏠', color: 'text-blue-500', desc: 'Social + Explore' },
  { title: 'Learn', url: '/education', emoji: '📚', color: 'text-purple-500', desc: 'Docs, Images, Videos' },
  { title: 'Messages', url: '/chat', emoji: '💬', color: 'text-green-500', desc: 'Chat + VC + Groups' },
  { title: 'FunPun', url: '/funpun', emoji: '🎮', color: 'text-orange-500', desc: 'Games for Fresh Mind' },
  { title: 'Adventure', url: '/music-adventure', emoji: '🏔️', color: 'text-teal-500', desc: 'Challenges + Discover + Travel' },
  { title: 'Random Connect', url: '/random-connect', emoji: '💙', color: 'text-blue-400', desc: 'Share a moment, not a profile' },
  { title: 'Marketplace', url: '/marketplace', emoji: '🛒', color: 'text-pink-500', desc: 'Buy/Sell/Local Business' },
  { title: 'Settings', url: '/settings', emoji: '⚙️', color: 'text-gray-500', desc: 'Controls + Privacy' },
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
            boxShadow: '0 0 15px 3px hsl(var(--primary) / 0.4), 0 0 30px 5px hsl(var(--primary) / 0.2)'
          }}
        >
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 glass-card border-r border-primary/20">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img src={lumathaLogo} alt="Lumatha" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-2xl font-bold gradient-text tracking-tight">Lumatha</span>
        </div>
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleItemClick(item.url)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                isActive(item.url) 
                  ? 'bg-primary/20 text-primary' 
                  : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <span className={`text-2xl ${item.color}`}>{item.emoji}</span>
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
  const [isAuthPage, setIsAuthPage] = useState(false);
  
  // Scroll hide/show state
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    setIsAuthPage(location.pathname === '/auth');
  }, [location]);

  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDiff = currentScrollY - lastScrollY.current;
    
    if (Math.abs(scrollDiff) < 5) return;
    
    if (currentScrollY < 50) {
      setHeaderVisible(true);
    } else if (scrollDiff > 0 && currentScrollY > 50) {
      setHeaderVisible(false);
    } else if (scrollDiff < 0) {
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
    navigate(-1);
  };

  const isFullScreenPage = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';
  const isHomeSection = ['/', '/search', '/private', '/notifications'].includes(location.pathname) || 
                        location.pathname.startsWith('/profile/');
  const showSubNav = isHomeSection;
  const isSubSection = ['/create', '/private', '/notifications', '/search'].includes(location.pathname) || 
                       location.pathname.startsWith('/profile/');

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
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar className="border-r border-border/50 sticky top-0 h-screen w-72 xl:w-80 shrink-0">
          <SidebarContent className="relative overflow-hidden" style={{
            background: 'linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(220 50% 8%) 100%)'
          }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center gap-3 p-4 border-b border-border/30">
              <div className="relative">
                <img 
                  src={lumathaLogo} 
                  alt="Lumatha" 
                  className="w-12 h-12 rounded-xl object-contain"
                  style={{ boxShadow: '0 0 20px rgba(201, 162, 39, 0.3)' }}
                />
              </div>
              <span className="text-xl font-bold gradient-text tracking-tight">Lumatha</span>
            </div>

            <SidebarGroup className="relative">
              <SidebarGroupLabel className="text-[10px] text-muted-foreground/70 px-4">Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="px-2">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        isActive={isActive(item.url)}
                        onClick={() => handleMenuClick(item.url)}
                        className={`cursor-pointer py-2.5 rounded-xl ${
                          isActive(item.url) 
                            ? 'bg-gradient-to-r from-primary/20 to-secondary/10 shadow-lg shadow-primary/10' 
                            : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isActive(item.url) 
                              ? 'bg-gradient-to-br from-primary/30 to-secondary/20' 
                              : 'bg-muted/30'
                          }`}>
                            <span className={`text-lg ${item.color}`}>{item.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium block text-sm ${isActive(item.url) ? 'text-primary' : ''}`}>{item.title}</span>
                            <span className="text-[9px] text-muted-foreground block truncate">{item.desc}</span>
                          </div>
                          {isActive(item.url) && (
                            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-secondary" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          </SidebarContent>
        </Sidebar>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Header */}
        <header 
          className={`sticky z-40 glass-card border-b border-border ${
            headerVisible ? 'top-0 opacity-100' : '-top-16 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-1.5">
              {isMobile && isSubSection ? (
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : isMobile ? (
                <MobileSidebar isActive={isActive} onNavigate={handleMenuClick} />
              ) : null}
            </div>

            <Link 
              to="/" 
              className="flex items-center" 
              onClick={handleLogoClick}
            >
              <span className="font-bold text-xl gradient-text whitespace-nowrap tracking-tight">Lumatha</span>
            </Link>
          </div>
          
          {showSubNav && <SubNavigation visible={headerVisible} />}
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 md:p-3 min-w-0">
            <div className="max-w-lg xl:max-w-xl mx-auto">
              {children}
            </div>
          </div>

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
