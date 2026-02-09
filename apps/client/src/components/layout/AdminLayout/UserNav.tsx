'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/shadcn/components/ui/avatar';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@repo/shadcn/components/ui/dropdown-menu';
import { authClient } from '@src/libs/auth/client';
import { Check, LogOut, Plus, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

type SessionWithUser = {
  session: {
    token: string;
  };
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export const UserNav = memo(() => {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const [sessions, setSessions] = useState<SessionWithUser[]>([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    const { data } = await authClient.multiSession.listDeviceSessions();
    if (data) {
      setSessions(data as unknown as SessionWithUser[]);
    } else {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSignOut = useCallback(async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const sessionToken = session?.session?.token;
      if (!sessionToken) {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/sign-in');
            },
          },
        });
        return;
      }

      const { error } = await authClient.multiSession.revoke({
        sessionToken,
      });

      if (error) {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/sign-in');
            },
          },
        });
        return;
      }

      await loadSessions();
      await refetchSession();
      router.push('/sign-in');
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    loadSessions,
    refetchSession,
    router,
    session?.session?.token,
  ]);

  const handleSwitchAccount = useCallback(
    async (sessionToken: string) => {
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      try {
        const { error } = await authClient.multiSession.setActive({
          sessionToken,
        });
        if (error) {
          await loadSessions();
          return;
        }
        await loadSessions();
        router.refresh();
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, loadSessions, router]
  );

  const handleAddAccount = useCallback(() => {
    router.push('/sign-in');
  }, [router]);

  const initials = useMemo(() => {
    if (!session?.user?.name) {
      return 'U';
    }
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [session?.user?.name]);

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={session.user.image || ''}
              alt={session.user.name || ''}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount={true}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">
              {session.user.name}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Multi-session switching */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            Switch Account
          </DropdownMenuLabel>
          {sessions.map(s => (
            <DropdownMenuItem
              key={s.session.token}
              onClick={() => handleSwitchAccount(s.session.token)}
              disabled={isLoading}
            >
              <Avatar className="mr-2 h-6 w-6">
                <AvatarImage src={s.user.image || ''} />
                <AvatarFallback className="text-[10px]">
                  {s.user.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-xs">{s.user.name}</span>
              {s.session.token === session.session.token && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={handleAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add another account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserNav.displayName = 'UserNav';
