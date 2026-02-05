import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SavingsProvider } from '../contexts/SavingsContext'
import { FamilyProvider } from '../contexts/FamilyContext'
import ErrorBoundary from '../components/ErrorBoundary'
import ToastProvider from '../components/providers/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "MedFin",
  description: "Autonomous Healthcare Financial Navigator",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <ErrorBoundary>
            <FamilyProvider>
              <SavingsProvider>
                {children}
              </SavingsProvider>
            </FamilyProvider>
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  )
}
