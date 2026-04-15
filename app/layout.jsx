import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata = {
  title:       'Kaali — AI Chat for Any Website',
  description: 'Give your visitors intelligent answers from your own content. Powered by Absolute App Labs.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
