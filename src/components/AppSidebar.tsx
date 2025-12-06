import { Crown, Home, Globe, Lock, Bookmark, PlusCircle, Music, GraduationCap, CheckSquare, Mountain, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Public', url: '/public', icon: Globe },
  { title: 'Private', url: '/private', icon: Lock },
  { title: 'Saved', url: '/saved', icon: Bookmark },
  { title: 'Create', url: '/create', icon: PlusCircle },
  { title: 'Music', url: '/music', icon: Music },
  { title: 'Education', url: '/education', icon: GraduationCap },
  { title: 'To-Do', url: '/todo', icon: CheckSquare },
  { title: 'Adventure', url: '/adventure', icon: Mountain },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          {!collapsed && <span className="font-bold text-lg">CoC</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? 'bg-primary/10 text-primary font-medium' : ''
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
