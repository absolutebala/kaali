import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata = {
  title:       'NivoChat — Your Website\'s AI Conversation Layer',
  description: 'NivoChat gives your website an AI assistant trained on your business that answers questions, captures leads, and hands conversations to your team.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
<AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
