'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/shadcn/components/ui/sidebar';
import { authClient } from '@src/libs/auth/client';
import { Home, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useCallback, useState } from 'react';

const menuItems = [{ title: 'Home', icon: Home, url: '/' }] as const;

export const AppSidebar = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    const { error } = await authClient.signOut({});

    if (error) {
      setIsSigningOut(false);
      return;
    }

    router.push('/sign-in');
  }, [isSigningOut, router]);

  return (
    <Sidebar className="border-border/40 border-r bg-background/80 backdrop-blur-md">
      <SidebarHeader className="p-4 md:p-6">
        <div className="flex items-center gap-3 px-1 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/25">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="truncate font-bold text-base tracking-tight">
              Admin Console
            </span>
            <span className="truncate font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              Enterprise
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-2 font-semibold text-muted-foreground/70 text-xs uppercase tracking-widest">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {menuItems.map(item => {
                const isActive =
                  item.url === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={true}
                      isActive={isActive}
                      className="h-10 gap-3 rounded-lg px-3 transition-all hover:bg-primary/5 hover:text-primary active:bg-primary/10 data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100 data-[active=true]:opacity-100" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-border/40 border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={isSigningOut}
              aria-busy={isSigningOut}
              className="h-10 gap-3 rounded-lg px-3 text-red-500/80 transition-all hover:bg-red-500/10 hover:text-red-600 active:bg-red-500/15"
            >
              <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = 'AppSidebar';
