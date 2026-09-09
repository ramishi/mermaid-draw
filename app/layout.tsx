import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MermaidDraw',
  description: 'Visual drag-and-drop editor for Mermaid.js diagrams — draw on canvas, export clean .mmd syntax',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
