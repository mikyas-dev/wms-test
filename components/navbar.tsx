"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-switcher"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  const routes = [
    {
      href: "/",
      label: "Dashboard",
    },
    {
      href: "/stock/putaway",
      label: "Putaway",
    },
    {
      href: "/stock/remove",
      label: "Remove Stock",
    },
    {
      href: "/stock/move",
      label: "Move Stock",
    },
    {
      href: "/stock/history",
      label: "History",
    },
    {
      href: "/stock/lookup",
      label: "Stock Lookup",
    },
    {
      href: "/locations",
      label: "Locations",
    },
    {
      href: "/stock/sku",
      label: "SKUs",
    },
    {
      href: "/settings",
      label: "Settings",
    },
  ]

  return (
    <div className="border-b bg-background">
      <div className="container flex h-16 items-center px-2 md:px-4">
        <div className="flex w-full items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Boxes className="h-6 w-6 text-primary" />
            <span className="font-bold">
              <span className="text-primary">Nashos</span>
              <span className="text-muted-foreground">WMS</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-4">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary p-2 rounded-md",
                        pathname === route.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {route.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary relative py-2",
                    pathname === route.href
                      ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
} 