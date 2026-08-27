import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrc = path.resolve(__dirname, "../../frontend/src");

test("Frontend useToast Import & Export Integrity Verification", async (t) => {
  await t.test("1. ToastContext.jsx exports useToast and ToastProvider as named exports", () => {
    const toastContextContent = fs.readFileSync(path.join(frontendSrc, "context/ToastContext.jsx"), "utf-8");
    assert.match(toastContextContent, /export\s+const\s+ToastProvider\s*=/, "ToastProvider should be exported");
    assert.match(toastContextContent, /export\s+const\s+useToast\s*=/, "useToast should be exported");
    assert.match(toastContextContent, /export\s+default\s+ToastContext/, "ToastContext should be default exported");
  });

  await t.test("2. App.jsx correctly imports and wraps the tree in <ToastProvider>", () => {
    const appContent = fs.readFileSync(path.join(frontendSrc, "App.jsx"), "utf-8");
    assert.match(appContent, /import\s+{\s*ToastProvider\s*}\s+from\s+["']\.\/context\/ToastContext["']/, "App.jsx must import ToastProvider");
    assert.match(appContent, /<ToastProvider>[\s\S]*<Routes>[\s\S]*<\/Routes>[\s\S]*<\/ToastProvider>/, "App.jsx must wrap routes in ToastProvider");
  });

  await t.test("3. Every file invoking useToast() contains the correct import statement", () => {
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".jsx") || entry.name.endsWith(".js"))) {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.includes("useToast(") && !entry.name.includes("ToastContext")) {
            const hasNamedImport = /import\s+{[^}]*useToast[^}]*}\s+from\s+["'][^"']*ToastContext["']/.test(content);
            assert.ok(
              hasNamedImport,
              `File ${entry.name} invokes useToast() but is missing 'import { useToast } from ".../ToastContext"'`
            );
          }
        }
      }
    }
    scanDir(frontendSrc);
  });

  await t.test("4. WalletAnalyzer and WalletScan files exist and have valid syntax", () => {
    const walletAnalyzerContent = fs.readFileSync(path.join(frontendSrc, "components/WalletAnalyzer.jsx"), "utf-8");
    const walletScanContent = fs.readFileSync(path.join(frontendSrc, "pages/WalletScan.jsx"), "utf-8");
    assert.ok(walletAnalyzerContent.includes('import { useToast } from "../context/ToastContext";'), "WalletAnalyzer must import useToast");
    assert.ok(walletScanContent.includes("<WalletAnalyzer"), "WalletScan must render WalletAnalyzer");
  });
});
