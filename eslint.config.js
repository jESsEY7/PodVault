import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
    {
        files: ["**/*.{js,mjs,cjs,jsx}"],
        ignores: ["node_modules/**", "dist/**"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: pluginReact,
            "react-hooks": pluginReactHooks,
            "unused-imports": pluginUnusedImports,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...pluginJs.configs.recommended.rules,
            ...pluginReact.configs.recommended.rules,
            "no-unused-vars": "off",
            "react/jsx-uses-vars": "error",
            "react/jsx-uses-react": "error",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "react/no-unknown-property": [
                "error",
                { ignore: ["cmdk-input-wrapper", "toast-close"] },
            ],
            "react-hooks/rules-of-hooks": "error",
        },
    },
];
