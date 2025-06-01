// File: .eslintrc.js
module.exports = {
  env: {
    commonjs: true, // Enables CommonJS global variables and CommonJS scoping.
    es2021: true, // Enables ES2021 globals and syntax.
    node: true, // Enables Node.js global variables and Node.js scoping.
  },
  extends: [
    "eslint:recommended", // Uses the recommended set of rules from ESLint.
    "plugin:node/recommended", // Uses recommended rules for Node.js.
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    ecmaVersion: "latest", // Allows for the parsing of modern ECMAScript features.
  },
  rules: {
    // You can override or add specific ESLint rules here.
    // For example:
    // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Warn about console.log in production
    // 'node/no-unpublished-require': 'off', // If you have scripts not part of the main publishable package
    // 'prettier/prettier': ['error', {
    //   // You can also put prettier options here, but it's better to use .prettierrc.js
    // }],
  },
}
