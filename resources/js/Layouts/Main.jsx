import Footer from "@/Components/footer";
import Navigation from "@/Components/navigation";

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            <main>{children}</main>
            <Footer />
        </div>
    );
}
