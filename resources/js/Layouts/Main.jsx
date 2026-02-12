import Footer from "@/components/footer.jsx";
import Navigation from "@/components/navigation.jsx";

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            <main>{children}</main>
            <Footer />
        </div>
    );
}
