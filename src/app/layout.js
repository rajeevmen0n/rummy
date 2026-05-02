import "./globals.css";

export const metadata = {
  title: "Rummy Tracker",
  description: "Keep score for your Rummy games",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
