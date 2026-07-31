import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PatentPilot — AI-Powered Pharmaceutical Patent Intelligence",
  description:
    "PatentPilot uses AI to analyze molecular SMILES strings, retrieve relevant pharmaceutical patents from global databases, and generate comprehensive patentability reports for drug discovery researchers.",
  keywords: ["patent analysis", "drug discovery", "SMILES", "pharmaceutical", "AI", "patentability"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050d1a]">{children}</body>
    </html>
  );
}
