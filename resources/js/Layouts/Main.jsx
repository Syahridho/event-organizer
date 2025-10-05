import Footer from "@/components/footer";
import Navigation from "@/components/navigation";

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            <main className="flex-1 container mx-auto px-4 py-6">
                {children}
            </main>
            <Footer />
        </div>
    );
}
