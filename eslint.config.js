import js from "@eslint/js";
import react from "eslint-plugin-react";
import globals from "globals";
// 1. Tambahkan import ini
import importPlugin from "eslint-plugin-import";

export default [
    js.configs.recommended,
    {
        files: ["resources/js/**/*.{js,jsx}"],
        plugins: {
            react,
            // 2. Tambahkan plugin import di sini
            import: importPlugin,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                route: "readonly",
                axios: "readonly",
            },
        },
        settings: {
            react: {
                version: "detect",
            },
            // 3. Tambahkan resolver agar ESLint paham alias '@' pada Laravel
            "import/resolver": {
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
                alias: {
                    map: [["@", "./resources/js"]],
                    extensions: [".js", ".jsx", ".json"],
                },
            },
        },
        rules: {
            // React rules
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
            "react/prop-types": "off",

            // 4. TARO ATURANNYA DI SINI
            "import/no-unresolved": [2, { caseSensitive: true }],

            // General rules
            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "no-console": "off",
            "no-debugger": "warn",
        },
    },
    {
        ignores: [
            "node_modules/**",
            "vendor/**",
            "public/**",
            "storage/**",
            "bootstrap/**",
            "dist/**",
            "build/**",
        ],
    },
];
