"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  {
    name: "Light",
    value: "light",
    icon: Sun,
  },
  {
    name: "Dark",
    value: "dark",
    icon: Moon,
  },
  {
    name: "Rose",
    value: "rose",
    icon: Palette,
  },
  {
    name: "Blue",
    value: "blue",
    icon: Palette,
  },
  {
    name: "Green",
    value: "green",
    icon: Palette,
  },
  {
    name: "Orange",
    value: "orange",
    icon: Palette,
  },
  {
    name: "Purple",
    value: "purple",
    icon: Palette,
  },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const getCurrentIcon = () => {
    const currentTheme = themes.find((t) => t.value === theme)
    const Icon = currentTheme?.icon || Sun
    return <Icon className="h-[1.2rem] w-[1.2rem]" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {getCurrentIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ name, value, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 