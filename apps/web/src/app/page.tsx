'use client'

import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { z } from 'zod'

// Schema validation with Zod
const UserFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
})

export default function Home() {
  const [status, setStatus] = useState<string>('')

  const handleSubmit = async () => {
    try {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
      }

      // Validate with Zod
      const validated = UserFormSchema.parse(formData)
      setStatus(`Validated: ${JSON.stringify(validated)}`)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setStatus(`Validation error: ${error.issues[0]?.message}`)
      }
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Next.js 16 + MUI
        </Typography>

        <Stack spacing={3} sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Features
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • Next.js 16 with App Router
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • Material-UI (MUI) v6
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • Zod for schema validation
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • TypeScript
              </Typography>
              <Typography variant="body1" color="text.secondary">
                • Bun runtime
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Zod Validation Demo
              </Typography>
              <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
                Test Validation
              </Button>
              {status && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {status}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  )
}
