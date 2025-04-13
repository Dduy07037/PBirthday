import './globals.css'

export const metadata = {
  title: '3D Birthday Celebration',
  description: 'A beautiful 3D birthday celebration scene',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
} 