"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 opacity-0" />;
  }

  const themes = [
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
    { name: "midnight", icon: Moon, label: "Midnight (Deep Blue)" },
    { name: "forest", icon: Palette, label: "Forest (Green)" },
    { name: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="h-9 w-40 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:focus:ring-gray-300"
      >
        {themes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
