"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      active: pathname === "/",
    },
    {
      href: "/stock/putaway",
      label: "Putaway",
      active: pathname === "/stock/putaway",
    },
    {
      href: "/stock/remove",
      label: "Remove Stock",
      active: pathname === "/stock/remove",
    },
    {
      href: "/stock/move",
      label: "Move Stock",
      active: pathname === "/stock/move",
    },
    {
      href: "/stock/lookup",
      label: "Stock Lookup",
      active: pathname === "/stock/lookup",
    },
    {
      href: "/locations",
      label: "Locations",
      active: pathname === "/locations",
    },
  ]

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
} 