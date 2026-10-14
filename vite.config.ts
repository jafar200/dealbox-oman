import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

/**
 * إضافة تُصدّر ملفات ثابتة يحتاجها Web Push على جذر الموقع:
 * - sw.js: Service Worker لاستقبال الإشعارات وعرضها.
 * - push-icon.svg: أيقونة الإشعار.
 * لا يمكن استخدام مجلد public لأن publicDir مُعطّل في هذا المشروع.
 */
function vitePluginDealboxStaticFiles(): Plugin {
  const files: Array<{ url: string; file: string; type: string }> = [
    { url: "/sw.js", file: path.resolve(PROJECT_ROOT, "sw.js"), type: "application/javascript; charset=utf-8" },
    { url: "/push-icon.svg", file: path.resolve(PROJECT_ROOT, "push-icon.svg"), type: "image/svg+xml" },
  ];

  return {
    name: "dealbox-static-files",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        const match = files.find((f) => f.url === url);
        if (!match) return next();
        try {
          const code = fs.readFileSync(match.file, "utf-8");
          res.setHeader("Content-Type", match.type);
          res.setHeader("Cache-Control", "no-cache");
          if (match.url === "/sw.js") res.setHeader("Service-Worker-Allowed", "/");
          res.end(code);
        } catch {
          next();
        }
      });
    },
    generateBundle() {
      for (const f of files) {
        try {
          const source = fs.readFileSync(f.file, "utf-8");
          this.emitFile({ type: "asset", fileName: f.url.replace(/^\//, ""), source });
        } catch {
          this.warn(`[dealbox] missing static file: ${f.file}`);
        }
      }
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), vitePluginDealboxStaticFiles()];
export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(PROJECT_ROOT, "src"),
    },
  },
  envDir: PROJECT_ROOT,
  root: PROJECT_ROOT,
  publicDir: false,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    // المجلدات والملفات غير المصدّية: مراقبة أي ملف مقفل برامج أخرى تُنهي
    // خادم Vite بخطأ EBUSY، ونماذج التصميم لا تدخل حزمة البناء أصلاً.
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/backend/**",
        "**/docs/**",
        "**/booking/**",
        "**/.manus-logs/**",
        "**/*stitch*/**",
        "**/صفحات الشاشة الاولى/**",
        "**/*.md",
        "**/*.png",
        "**/*.jpg",
        "**/*.jpeg",
        "**/*.gif",
      ],
    },
    proxy: {
      "/api": "http://localhost:5001",
      "/uploads": "http://localhost:5001",
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
