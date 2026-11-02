import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-background">
			<Sidebar />

			<div className="flex flex-1 flex-col min-w-0">
				<Header />

				<main className="flex-1 p-6 bg-muted/30">{children}</main>
			</div>
		</div>
	);
}
