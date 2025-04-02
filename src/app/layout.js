import { Prompt } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import { Suspense } from "react";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "LumiLearn",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${prompt.className} antialiased select-none`}>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="mx-auto max-w-4xl p-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
