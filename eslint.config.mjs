import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: globals.node } },
  { files: ["**/*.test.js"], env: { jest: true } },
  pluginJs.configs.recommended,
];
