import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Todo List App',
  description: 'A modern and beautiful todo list application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
} 
