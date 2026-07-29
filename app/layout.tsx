import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wat eten we vanavond?",
  description: "Jouw opgeslagen recepten, gepland en gebundeld.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
