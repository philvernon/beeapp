import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Beehive Tracking",
	description: "Track your hives, apiaries, and inspections",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable)}
		>
			<body className="min-h-full flex flex-col bg-background font-sans text-primary">
				<nav className="bg-accent text-surface shadow-md border-b border-primary/10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-14">
							<Link
								href="/"
								className="text-lg font-bold tracking-tight flex items-center gap-2"
							>
								🐝 Beehive Tracker
							</Link>
							<div className="flex items-center gap-6 text-sm font-medium">
								<Link
									href="/apiaries"
									className="hover:text-surface/80 transition-colors"
								>
									Apiaries
								</Link>
								<Link
									href="/hives"
									className="hover:text-surface/80 transition-colors"
								>
									Hives
								</Link>
								<Link
									href="/analytics"
									className="hover:text-surface/80 transition-colors"
								>
									Analytics
								</Link>
							</div>
						</div>
					</div>
				</nav>
				<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{children}
				</main>
			</body>
		</html>
	);
}
