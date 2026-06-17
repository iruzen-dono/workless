#!/usr/bin/env node

/**
 * Workless Code Sandbox
 * Exécute du JavaScript utilisateur dans un VM isolé avec timeout.
 *
 * Lit le payload JSON depuis stdin:
 *   { code: string, input: object, timeout?: number }
 *
 * stdout: { success: boolean, data?: any, error?: string }
 */

const vm = require("vm");

// Read JSON payload from stdin
let inputJson = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (inputJson += chunk));
process.stdin.on("end", () => {
  const input = JSON.parse(inputJson || "{}");
  const { code, timeout = 5000 } = input;
  const contextInput = input.input || {};

  if (!code || typeof code !== "string") {
    console.log(JSON.stringify({ success: false, error: "No code provided" }));
    process.exit(0);
  }

  // Build sandbox context with safe globals + input data
  const sandbox = {
    input: contextInput,
    console: {
      log: (...args) => {},
      warn: (...args) => {},
      error: (...args) => {},
    },
    JSON: JSON,
    Math: Math,
    Date: Date,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Map: Map,
    Set: Set,
    Promise: Promise,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    encodeURI: encodeURI,
    decodeURI: decodeURI,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    __result__: null,
    __error__: null,
  };

  const context = vm.createContext(sandbox);

  const wrappedCode = `
try {
  __result__ = (function() {
    ${code}
  })();
} catch (e) {
  __error__ = e.message || String(e);
}
`;

  try {
    const script = new vm.Script(wrappedCode, { timeout });
    script.runInContext(context, { timeout });

    if (context.__error__) {
      console.log(JSON.stringify({ success: false, error: context.__error__ }));
    } else {
      console.log(JSON.stringify({ success: true, data: context.__result__ }));
    }
  } catch (e) {
    console.log(JSON.stringify({ success: false, error: e.message || "Execution timed out or failed" }));
  }
});
