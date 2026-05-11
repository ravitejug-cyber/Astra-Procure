#!/usr/bin/env node
// Patches the unsafe btoa() call in Next.js compiled react-dom runtimes.
// React 19's applyViewTransitionName does btoa(key) when a React key contains
// a char > U+00FF (e.g. U+2022 bullet from AI data), causing browsers to throw:
// "Cannot convert argument to a ByteString because the character at index 0
//  has a value of 8226 which is greater than 255."
// This patch makes the btoa call safe at its exact call site in both the
// server-side next-server runtimes AND the react-dom CJS files that Turbopack
// uses when bundling client-side chunks.

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let patched = 0;

// Pattern 1: minified form in next-server runtime bundles (variable name "a")
const UNSAFE_A =
  'CSS.escape(a)!==a?"r-"+btoa(a).replace(/=/g,"")';
const SAFE_A =
  'CSS.escape(a)!==a?"r-"+(function(s){var o="";for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=c>255?"?":s[i];}return btoa(o);})(a).replace(/=/g,"")';

// Pattern 2: readable form in react-dom CJS source files (variable name "name")
const UNSAFE_NAME = 'btoa(name).replace(/=/g, "")';
const SAFE_NAME =
  '(function(s){var o="";for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=c>255?"?":s[i];}return btoa(o);})(name).replace(/=/g, "")';

function patchFile(rel, unsafe, safe) {
  const fpath = path.join(root, rel);
  if (!fs.existsSync(fpath)) return;
  const src = fs.readFileSync(fpath, "utf8");
  if (!src.includes(unsafe)) return;
  fs.writeFileSync(fpath, src.replaceAll(unsafe, safe), "utf8");
  console.log(`patched: ${rel}`);
  patched++;
}

// Server-side next-server runtime bundles
const serverTargets = [
  "node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js",
  "node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",
  "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.dev.js",
  "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js",
  "node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js",
  "node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js",
];

for (const rel of serverTargets) patchFile(rel, UNSAFE_A, SAFE_A);

// Client-side react-dom CJS source files (used by Turbopack when building chunks)
const cjsTargets = [
  "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js",
  "node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js",
  "node_modules/next/dist/compiled/react-dom/cjs/react-dom-profiling.development.js",
  "node_modules/next/dist/compiled/react-dom/cjs/react-dom-profiling.profiling.js",
];

for (const rel of cjsTargets) patchFile(rel, UNSAFE_NAME, SAFE_NAME);

if (patched === 0) console.log("btoa patch: already applied or no targets found");
else console.log(`btoa patch: applied to ${patched} file(s)`);
