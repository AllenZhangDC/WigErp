"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        // Read from local storage or system preference on mount
        const theme = localStorage.getItem("theme");
        if (theme === "light") {
            setIsLight(true);
            document.documentElement.classList.add("light");
        }
    }, []);

    const toggleTheme = () => {
        if (isLight) {
            document.documentElement.classList.remove("light");
            localStorage.setItem("theme", "dark");
            setIsLight(false);
        } else {
            document.documentElement.classList.add("light");
            localStorage.setItem("theme", "light");
            setIsLight(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="nav-item group w-full text-left flex items-center gap-3"
            title="Toggle theme"
        >
            {isLight ? (
                <>
                    <Moon size={18} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
                    <span className="flex-1 font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">切换至暗色</span>
                </>
            ) : (
                <>
                    <Sun size={18} className="text-amber-500 opacity-70 group-hover:opacity-100 transition-colors" />
                    <span className="flex-1 font-medium text-slate-500 group-hover:text-amber-400 transition-colors">切换至亮色</span>
                </>
            )}
        </button>
    );
}
