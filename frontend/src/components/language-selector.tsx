"use client";

import { useI18n } from "@/contexts/i18n-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4" />
      <Select value={locale} onValueChange={(value) => setLocale(value as "pt-BR" | "en-US")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pt-BR">Português (BR)</SelectItem>
          <SelectItem value="en-US">English (US)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

