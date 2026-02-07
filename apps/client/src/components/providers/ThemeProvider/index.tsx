'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';
import { memo } from 'react';

export const ThemeProvider = memo<ComponentProps<typeof NextThemesProvider>>(
  ({ children, ...props }) => {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
  }
);

ThemeProvider.displayName = 'ThemeProvider';
