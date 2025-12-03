import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/settings-context";
import { AuthProvider } from "@/contexts/auth-context";
import { I18nProvider } from "@/contexts/i18n-context";
import { Toaster } from "react-hot-toast";
import type React from "react";
import { FamilyProvider } from "@/contexts/family-context";
import { ThemeFavicon } from "@/components/theme-favicon";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinFam Dashboard",
  description: "A modern, responsive financial dashboard",
  icons: {
    icon: "/finfam.ico",
    shortcut: "/finfam.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* ícone inicial que será TROCAD0 pelo componente ThemeFavicon */}
        <link id="dynamic-favicon" rel="icon" href="/finfam.ico" />
      </head>

      <body className={inter.className}>
        <ThemeFavicon /> {/* 🔥 favicon dinâmico aqui */}

        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <SettingsProvider>
                <FamilyProvider>
                  <TooltipProvider delayDuration={0}>
                    <Toaster position="bottom-center" />
                    {children}
                  </TooltipProvider>
                </FamilyProvider>
              </SettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
