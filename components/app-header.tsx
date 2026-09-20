"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Mobile menu items
const navItems = [
  { label: "Home", href: "/" },
  { label: "Apiaries", href: "/apiaries" },
  { label: "Hives", href: "/hives" },
  { label: "Analytics", href: "/analytics" },
]

function DesktopNav() {
  return (
        <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <Button key={item.href} variant="ghost" className="px-3">
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  )
}

function MobileNav({ className }: { className?: string }) {
  return (
    <nav className={cn("flex flex-col gap-1 p-2", className)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="px-2 py-1.5 text-sm font-medium rounded-none hover:bg-muted transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function AppHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span>🐝</span>
          <span>Beehive Tracker</span>
        </Link>

        {/* Desktop nav */}
        <DesktopNav />

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-2">
          <Separator orientation="vertical" className="h-6" />
          <Sheet>
            <SheetTrigger>
              <span className="inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 size-7 rounded-none hover:bg-muted hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                <span className="sr-only">Open menu</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </span>
            </SheetTrigger>
            <SheetContent side="right" className="w-48 p-0">
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
