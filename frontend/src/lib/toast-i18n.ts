import toast from "react-hot-toast";

function getTranslations() {
  try {
    const locale = typeof window !== "undefined" 
      ? (localStorage.getItem("locale") as "pt-BR" | "en-US") || "pt-BR"
      : "pt-BR";
    
    if (locale === "en-US") {
      return require("../../messages/en-US.json");
    }
    return require("../../messages/pt-BR.json");
  } catch {
    return require("../../messages/pt-BR.json");
  }
}

function t(key: string, params?: Record<string, string | number>): string {
  const translations = getTranslations();
  const keys = key.split(".");
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }
  
  if (typeof value !== "string") return key;
  
  if (params) {
    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
      value
    );
  }
  
  return value;
}

// Helper to generate a consistent ID from a key
function getToastId(key: string): string {
  return `toast-${key}`;
}

export const toastI18n = {
  success: (key: string, params?: Record<string, string | number>) => {
    const id = getToastId(key);
    toast.success(t(key, params), { id });
  },
  error: (key: string, params?: Record<string, string | number>) => {
    const id = getToastId(key);
    toast.error(t(key, params), { id });
  },
  info: (key: string, params?: Record<string, string | number>) => {
    const id = getToastId(key);
    toast(t(key, params), { id, icon: "ℹ️" });
  },
};

