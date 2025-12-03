"use client"

import { useI18n } from "@/contexts/i18n-context"

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  const toggleLanguage = () => {
    setLocale(locale === "pt-BR" ? "en-US" : "pt-BR")
  }

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium text-sm"
      title={locale === "pt-BR" ? "Switch to English" : "Mudar para Português"}
    >
      {locale === "pt-BR" ? "PT" : "EN"}
    </button>
  )
}

