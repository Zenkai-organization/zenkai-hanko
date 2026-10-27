import "./globals.css"

export const metadata = {
  title: "Hanko Dashboard",
  description: "MVP admin dashboard for Hanko users",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
