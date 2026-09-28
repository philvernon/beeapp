"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ListIcon, SignOut } from "@phosphor-icons/react";

function useSignOut() {
  const router = useRouter();

  return async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  };
}

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
  const handleSignOut = useSignOut();

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

        {/* Desktop sign-out */}
        <div className="hidden md:flex items-center gap-2">
          <Separator orientation="vertical" className="h-6" />
          <button
            onClick={handleSignOut}
            className={cn(
              buttonVariants({ variant: "ghost", size: "default" }),
              "text-destructive hover:text-destructive px-3",
            )}
          >
            <SignOut weight="bold" size={16} className="inline mr-1" />
            Sign Out
          </button>
        </div>

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
              <Separator className="my-2" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-destructive hover:bg-muted transition-colors w-full"
              >
                <SignOut weight="bold" size={16} />
                Sign Out
              </button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
