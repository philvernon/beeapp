import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />

      <main className="flex flex-1 min-h-0 flex-col mx-auto w-full max-w-7xl px-4 py-2 sm:py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
