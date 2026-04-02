import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import { compression } from "vite-plugin-compression2";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js"),
        },
    },
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react({
            // Enable React optimization web
            babel: {
                plugins: [
                    // Remove PropTypes in production
                    ["babel-plugin-transform-react-remove-prop-types", { removeImport: true }]
                ]
            }
        }),
        // Gzip compression
        compression({
            algorithm: "gzip",
            exclude: [/\.(br)$/, /\.(gz)$/],
        }),
        // Brotli compression
        compression({
            algorithm: "brotliCompress",
            exclude: [/\.(br)$/, /\.(gz)$/],
        }),
    ],
    server: {
        cors: true,
        hmr: {
            host: "localhost",
        },
    },
    build: {
        // Optimize build
        target: "es2015",
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.log in production
                drop_debugger: true,
                pure_funcs: ["console.log", "console.info", "console.debug"],
            },
        },
        // Code splitting
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks
                    "vendor-react": ["react", "react-dom"],
                    "vendor-inertia": ["@inertiajs/react"],
                    "vendor-ui": [
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-dropdown-menu",
                        "@radix-ui/react-select",
                        "@radix-ui/react-tabs",
                        "@radix-ui/react-toast",
                        "@radix-ui/react-popover",
                        "@radix-ui/react-accordion",
                    ],
                    "vendor-forms": [
                        "react-hook-form",
                        "@hookform/resolvers",
                        "zod",
                    ],
                    "vendor-charts": ["recharts"],
                    "vendor-icons": ["lucide-react", "@heroicons/react"],
                    "vendor-utils": ["lodash", "date-fns", "moment", "clsx", "tailwind-merge"],
                    // Split react-icons by library to enable lazy loading (only used libraries)
                    "icons-io5": ["react-icons/io5"],
                    "icons-io": ["react-icons/io"],
                    "icons-fa": ["react-icons/fa"],
                    "icons-fa6": ["react-icons/fa6"],
                    "icons-md": ["react-icons/md"],
                    "icons-hi": ["react-icons/hi"],
                    "icons-tb": ["react-icons/tb"],
                    "icons-pi": ["react-icons/pi"],
                    "icons-ti": ["react-icons/ti"],
                },
                // Optimize chunk file names
                chunkFileNames: "assets/js/[name]-[hash].js",
                entryFileNames: "assets/js/[name]-[hash].js",
                assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Source maps for production debugging (disable for smaller builds)
        sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: [
            "react",
            "react-dom",
            "@inertiajs/react",
            "axios",
        ],
        exclude: ["@soketi/soketi"],
    },
});
