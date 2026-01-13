import "./bootstrap";
import "../css/app.css";
import "./Utils/timezone";

import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
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

const appName = import.meta.env.VITE_APP_NAME || "Eventplan";

let root = null;

router.on("before", (event) => {
    const method = event.detail.visit.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        const token = document.head.querySelector('meta[name="csrf-token"]');

        if (token && event.detail.visit.data) {
            if (event.detail.visit.data instanceof FormData) {
                event.detail.visit.data.set("_token", token.content);
            } else if (typeof event.detail.visit.data === "object") {
                event.detail.visit.data._token = token.content;
            }
        }
    }
});

router.on("error", (event) => {
    const errors = event.detail.errors;
    if (errors && (errors.csrf || errors._token)) {
        fetch("/csrf-token", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.token) {
                    const metaTag = document.head.querySelector(
                        'meta[name="csrf-token"]'
                    );
                    if (metaTag) {
                        metaTag.setAttribute("content", data.token);
                    }
                }
            })
            .catch((error) => {
                console.error("Failed to refresh CSRF token:", error);
            });
    }
});

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
