module.exports = {
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  rules: {
    "react/jsx-key": "error",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    eqeqeq: "error",
    "react-hooks/exhaustive-deps": 0,
    "react/no-unescaped-entities": 0,
    "@next/next/no-img-element": 0,
  },
};
