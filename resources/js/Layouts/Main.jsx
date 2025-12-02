import Footer from "@/Components/footer.jsx";
import Navigation from "@/Components/navigation.jsx";

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />

            <main>{children}</main>
            <Footer />
        </div>
    );
}
