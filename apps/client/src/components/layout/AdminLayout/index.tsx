'use client';

import { Separator } from '@repo/shadcn/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/shadcn/components/ui/sidebar';
import { ThemeToggle } from '@src/components/ui/ThemeToggle';
import { memo } from 'react';
import { AppSidebar } from './AppSidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
};

export const AdminLayout = memo(({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative flex flex-col overflow-hidden bg-background">
        {/* Subtle Background Elements */}
        <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
          <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-border/40 border-b bg-background/60 px-6 backdrop-blur-lg transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-8 w-8 text-muted-foreground hover:text-foreground" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 bg-border/60"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">Overview</span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <div className="fade-in slide-in-from-bottom-2 mx-auto w-full max-w-7xl animate-in duration-500">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
});

AdminLayout.displayName = 'AdminLayout';
