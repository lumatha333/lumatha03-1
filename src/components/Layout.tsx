import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Menu, ArrowLeft, Home, BookOpen, MessageSquare, Gamepad2, 
  Mountain, Heart, ShoppingCart, Settings
} from 'lucide-react';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { BackgroundOrnaments } from '@/components/BackgroundOrnaments';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SubNavigation } from '@/components/SubNavigation';
import { DesktopMessagesPanel } from './DesktopMessagesPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import lumathaLogo from '@/assets/lumatha-logo.png';
import { type LucideIcon } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const menuItems: { title: string; url: string; icon: LucideIcon; desc: string }[] = [
  { title: 'Home', url: '/', icon: Home, desc: 'Social + Explore' },
  { title: 'Learn', url: '/education', icon: BookOpen, desc: 'Docs, Images, Videos' },
  { title: 'Messages', url: '/chat', icon: MessageSquare, desc: 'Chat + VC + Groups' },
  { title: 'FunPun', url: '/funpun', icon: Gamepad2, desc: 'Games for Fresh Mind' },
  { title: 'Adventure', url: '/music-adventure', icon: Mountain, desc: 'Challenges + Discover' },
  { title: 'Random Connect', url: '/random-connect', icon: Heart, desc: 'Share a moment' },
  { title: 'Marketplace', url: '/marketplace', icon: ShoppingCart, desc: 'Buy/Sell/Local' },
  { title: 'Settings', url: '/settings', icon: Settings, desc: 'Controls + Privacy' },
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
          className="h-8 w-8"
        >
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 glass-card border-r border-primary/20">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <img src={lumathaLogo} alt="Lumatha" className="w-10 h-10 rounded-full object-contain" style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }} />
          <span className="text-2xl font-bold gradient-text tracking-tight">Lumatha</span>
        </div>
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => handleItemClick(item.url)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  isActive(item.url) 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive(item.url) ? 'bg-primary/20' : 'bg-muted/30'
                }`}>
                  <Icon className={`w-[18px] h-[18px] ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium block text-sm">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function DesktopSidebar({ isActive, onNavigate }: { isActive: (path: string) => boolean; onNavigate: (url: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`sticky top-0 h-screen shrink-0 border-r border-border/30 transition-all duration-300 ease-in-out ${expanded ? 'w-[280px]' : 'w-[72px]'}`}
      style={{ background: 'linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(220 50% 8%) 100%)' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="relative h-full overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        
        <div className="relative flex items-center gap-3 p-3 border-b border-border/30 h-[52px]">
          <img src={lumathaLogo} alt="Lumatha" className="w-9 h-9 rounded-full object-contain shrink-0" style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }} />
          {expanded && <span className="text-lg font-bold gradient-text tracking-tight whitespace-nowrap">Lumatha</span>}
        </div>

        <nav className="relative flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            return (
              <button
                key={item.title}
                onClick={() => onNavigate(item.url)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'} ${
                  active 
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/10 shadow-lg shadow-primary/10' 
                    : 'hover:bg-primary/10'
                }`}
                title={!expanded ? item.title : undefined}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-gradient-to-br from-primary/30 to-secondary/20' : 'bg-muted/30'}`}>
                  <Icon className={`w-[18px] h-[18px] ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                {expanded && (
                  <div className="flex-1 min-w-0 text-left">
                    <span className={`font-medium block text-sm ${active ? 'text-primary' : ''}`}>{item.title}</span>
                    <span className="text-[9px] text-muted-foreground block truncate">{item.desc}</span>
                  </div>
                )}
                {expanded && active && (
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-secondary shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function LayoutContent({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isAuthPage, setIsAuthPage] = useState(false);
  
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
    if (currentScrollY < 50) setHeaderVisible(true);
    else if (scrollDiff > 0 && currentScrollY > 50) setHeaderVisible(false);
    else if (scrollDiff < 0) setHeaderVisible(true);
    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => { handleScroll(); ticking.current = false; });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !isAuthPage) navigate('/auth');
      else if (session && isAuthPage) navigate('/');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !isAuthPage) navigate('/auth');
    });
    return () => subscription.unsubscribe();
  }, [navigate, isAuthPage]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleMenuClick = (url: string) => { navigate(url); setOpen(false); };
  const handleBack = () => { navigate(-1); };

  const isFullScreenPage = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';
  const isHomeSection = ['/', '/search', '/private', '/notifications'].includes(location.pathname) || location.pathname.startsWith('/profile/');
  const showSubNav = isHomeSection;
  const isSubSection = ['/create', '/private', '/notifications', '/search'].includes(location.pathname) || location.pathname.startsWith('/profile/');

  if (isAuthPage) return <>{children}</>;

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
        <DesktopSidebar isActive={isActive} onNavigate={handleMenuClick} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <OfflineIndicator />
        {/* Single slim TopBar: 52px */}
        <header className={`sticky z-40 glass-card border-b border-border/40 transition-all duration-300 ${headerVisible ? 'top-0 opacity-100' : '-top-14 opacity-0'}`}>
          <div className="flex items-center h-[52px] px-3 gap-2">
            {/* Left: Hamburger or Back */}
            <div className="shrink-0">
              {isMobile && isSubSection ? (
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : isMobile ? (
                <MobileSidebar isActive={isActive} onNavigate={handleMenuClick} />
              ) : null}
            </div>
            {/* Right: Navigation icons in same row */}
            {showSubNav && (
              <div className="flex-1 min-w-0">
                <SubNavigation visible={headerVisible} />
              </div>
            )}
          </div>
        </header>

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
