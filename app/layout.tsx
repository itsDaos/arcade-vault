import type { Metadata } from 'next'
import { Press_Start_2P, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/app/context/UserContext'
import Background from '@/app/components/Background'
import Nav from '@/app/components/Nav'

const pressStart2P = Press_Start_2P({
  weight: '400',
  variable: '--font-pixel',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arcade Vault',
  description: 'Compete for the highest score across the greatest arcade classics.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${pressStart2P.variable} ${jetbrainsMono.variable} h-full`}>
      <body>
        <UserProvider>
          <Background />
          <Nav />
          <main className="av-main">{children}</main>
          <footer style={{
            borderTop: '1px solid var(--line)',
            padding: '20px 32px',
            textAlign: 'center',
            color: 'var(--ink-faint)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
          }}>
            © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
          </footer>
        </UserProvider>
      </body>
    </html>
  )
}
