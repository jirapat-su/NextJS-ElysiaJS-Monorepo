'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/shadcn/components/ui/avatar';
import { Button } from '@repo/shadcn/components/ui/button';
import { authClient } from '@src/libs/authClient';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';

type SessionWithUser = {
  session: {
    token: string;
  };
  user: {
    name: string;
    email: string;
    image?: string | null;
    displayUsername?: string | null;
  };
};

type ExistingSessionPickerProps = {
  currentSessionToken?: string | null;
  currentSessionEmail?: string | null;
  isLoading: boolean;
  returnTo: string;
  onSetLoading: (value: boolean) => void;
  onSetError: (message: string | null) => void;
};

export const ExistingSessionPicker = memo<ExistingSessionPickerProps>(
  ({
    currentSessionToken,
    currentSessionEmail,
    isLoading,
    returnTo,
    onSetLoading,
    onSetError,
  }) => {
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionWithUser[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const hasActiveSession =
      Boolean(currentSessionToken) || Boolean(currentSessionEmail);

    const loadSessions = useCallback(async () => {
      setIsFetching(true);
      const { data, error } =
        await authClient.multiSession.listDeviceSessions();
      if (error) {
        onSetError(error.message || 'Failed to load sessions');
        setSessions([]);
        setIsFetching(false);
        return;
      }
      setSessions((data ?? []) as SessionWithUser[]);
      setIsFetching(false);
    }, [onSetError]);

    useEffect(() => {
      const fetchSessions = async () => {
        await loadSessions();
      };

      fetchSessions();
    }, [loadSessions]);

    const handleUseSession = useCallback(
      async (sessionToken: string, isCurrent: boolean) => {
        if (isLoading || isFetching) {
          return;
        }
        if (!hasActiveSession) {
          onSetError('Please sign in to activate a saved session');
          return;
        }
        if (isCurrent) {
          router.push(returnTo);
          return;
        }
        onSetLoading(true);
        onSetError(null);
        const { error } = await authClient.multiSession.setActive({
          sessionToken,
        });
        if (error) {
          onSetError(error.message || 'Failed to switch session');
          onSetLoading(false);
          await loadSessions();
          return;
        }
        await loadSessions();
        router.push(returnTo);
      },
      [
        hasActiveSession,
        isFetching,
        isLoading,
        loadSessions,
        onSetError,
        onSetLoading,
        returnTo,
        router,
      ]
    );

    if (sessions.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase">
          Existing sessions on this device
        </p>
        <div className="space-y-2">
          {sessions.map(session => {
            const isTokenMatch =
              !!currentSessionToken &&
              session.session.token === currentSessionToken;
            const isEmailMatch =
              !currentSessionToken &&
              !!currentSessionEmail &&
              session.user.email === currentSessionEmail;
            const isCurrent = isTokenMatch || isEmailMatch;

            return (
              <Button
                key={session.session.token}
                type="button"
                variant="outline"
                className="w-full justify-start gap-3"
                disabled={isLoading || isFetching}
                onClick={() =>
                  handleUseSession(session.session.token, isCurrent)
                }
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={session.user.image || ''} />
                  <AvatarFallback className="text-[10px]">
                    {session.user.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start">
                  <span className="text-xs">{session.user.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {session.user.email}
                  </span>
                </div>
                {isCurrent ? (
                  <span className="text-[10px] text-muted-foreground">
                    Current
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }
);

ExistingSessionPicker.displayName = 'ExistingSessionPicker';
