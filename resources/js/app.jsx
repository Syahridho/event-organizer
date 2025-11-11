import "./bootstrap";
import "../css/app.css";
import "leaflet/dist/leaflet.css";
import "quill/dist/quill.snow.css";

import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import { store } from "./Store";
import Initializer from "./hooks/useInitializeTheme";
import OnlineStatusProvider from "./components/OnlineStatusProvider";

function AppWrapper({ App, props }) {
    return (
        <Provider store={store}>
            <Initializer />
            <OnlineStatusProvider>
                <App {...props} />
            </OnlineStatusProvider>
            <Toaster position="bottom-right" richColors />
        </Provider>
    );
}

const appName = import.meta.env.VITE_APP_NAME || "Eventplanasdasdas";

let root = null;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        if (!root) {
            root = createRoot(el);
        }

        root.render(<AppWrapper App={App} props={props} />);
    },
    progress: true,
});
