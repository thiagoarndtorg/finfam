import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/settings-context";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "react-hot-toast";
import type React from "react";
import { FamilyProvider } from "@/contexts/family-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinFam Dashboard",
  description: "A modern, responsive financial dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
