#!/usr/bin/env node
// Patches the unsafe btoa() call in Next.js compiled react-dom runtimes.
// React 19's applyViewTransitionName does btoa(key) when a React key contains
// a char > U+00FF (e.g. U+2022 bullet from AI data), causing Firefox to throw:
// "Cannot convert argument to a ByteString because the character at index 0
//  has a value of 8226 which is greater than 255."
// This patch makes the btoa call safe at its exact call site.

const fs = require("fs");
const path = require("path");

const UNSAFE =
  'CSS.escape(a)!==a?"r-"+btoa(a).replace(/=/g,"")';
const SAFE =
  'CSS.escape(a)!==a?"r-"+(function(s){var o="";for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=c>255?"?":s[i];}return btoa(o);})(a).replace(/=/g,"")';

const targets = [
  "node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js",
  "node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",
  "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.dev.js",
  "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js",
  "node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js",
  "node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js",
];

const root = path.resolve(__dirname, "..");
let patched = 0;

for (const rel of targets) {
  const fpath = path.join(root, rel);
  if (!fs.existsSync(fpath)) continue;
  const src = fs.readFileSync(fpath, "utf8");
  if (!src.includes(UNSAFE)) continue;
  fs.writeFileSync(fpath, src.replaceAll(UNSAFE, SAFE), "utf8");
  console.log(`patched: ${rel}`);
  patched++;
}

if (patched === 0) console.log("btoa patch: already applied or no targets found");
else console.log(`btoa patch: applied to ${patched} file(s)`);
