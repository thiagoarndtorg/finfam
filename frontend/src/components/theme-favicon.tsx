"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeFavicon() {
    const { theme, systemTheme } = useTheme();

    const current = theme === "dark" ? systemTheme : theme;

    useEffect(() => {
        const favicon = document.getElementById("dynamic-favicon") as HTMLLinkElement;

        if (!favicon) return;

        favicon.href =
            current === "dark"
                ? "/finfam.ico?v=dark"
                : "/logo_finfam_white.ico?v=light";
    }, [current]);

    return null;
}
