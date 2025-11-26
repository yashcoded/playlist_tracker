"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get initial theme from script in layout or localStorage
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    
    // Determine initial theme
    let initialTheme: "light" | "dark";
    if (savedTheme) {
      initialTheme = savedTheme;
    } else if (isDark) {
      initialTheme = "dark";
    } else {
      initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    setTheme(initialTheme);
    setMounted(true);
    
    // Ensure DOM matches state
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = theme === "light" ? "dark" : "light";
    
    // Update state and storage
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Immediately update DOM classes
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    
    // Update color scheme for browser UI
    root.style.colorScheme = newTheme;
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-11 h-11 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 transition-all duration-300 flex items-center justify-center group border border-gray-600/50 hover:border-gray-500/50 shadow-lg hover:shadow-xl"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg 
          className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-transform group-hover:rotate-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg 
          className="w-5 h-5 text-yellow-500 transition-transform group-hover:rotate-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}



