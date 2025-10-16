import Footer from "@/components/footer";
import Navigation from "@/components/navigation";

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            <main>{children}</main>
            <Footer />
        </div>
    );
}
