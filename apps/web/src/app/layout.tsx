import type { Metadata } from "next";
import "@panelva/ui/src/styles.css";
import "../styles/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeSync from "../components/ThemeSync";
import { TRPCProvider } from "../components/TRPCProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Panelva - Read & Upload Comics and Novels",
  description: "A dual-format publishing platform for comics, manga, manhwa, and prose novels.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--bg-color)" }}>
        <TRPCProvider>
          <ThemeSync />
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </TRPCProvider>
        <Analytics />
      </body>
    </html>
  );
}


