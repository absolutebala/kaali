import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata = {
  title:       'Absolute AIChat — AI Chat Platform',
  description: 'Give your visitors intelligent answers from your own content. Powered by Absolute App Labs.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
