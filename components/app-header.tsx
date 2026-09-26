"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ListIcon } from "@phosphor-icons/react";

// Mobile menu items
const navItems = [
  { label: "Home", href: "/" },
  { label: "Apiaries", href: "/apiaries" },
  { label: "Hives", href: "/hives" },
  { label: "Scan", href: "/hive-scan" },
];

function DesktopNav() {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost", size: "default" }),
            " px-3",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function MobileNav({ className }: { className?: string }) {
  return (
    <nav className={cn("flex flex-col gap-1 p-2", className)}>
      {navItems.map((item) => (
        <SheetClose
          key={item.href}
          nativeButton={false}
          render={
            <Link
              href={item.href}
              className="px-2 py-1.5 text-sm font-medium rounded-none hover:bg-muted transition-colors"
            />
          }
        >
          {item.label}
        </SheetClose>
      ))}
    </nav>
  );
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
            <SheetTrigger
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <ListIcon weight="bold" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-48 p-0">
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
