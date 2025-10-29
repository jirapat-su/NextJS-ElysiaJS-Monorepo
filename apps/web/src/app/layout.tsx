import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import type { Metadata } from 'next'
import theme from '@/theme'

export const metadata: Metadata = {
  title: 'Next.js + MUI App',
  description: 'Built with Next.js 16 and Material-UI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
