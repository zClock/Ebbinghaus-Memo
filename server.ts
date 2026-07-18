/**
 * 本地开发入口（Vite + Express，监听端口 3003）
 *
 * 业务逻辑已抽到 api/server.ts（供 Vercel Serverless Function 复用），
 * 这里只负责 dev/prod 的端口监听 + 静态资源服务。
 */
import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import app from "./api/index";

const PORT = parseInt(process.env.PORT || "3003", 10);

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production build from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ebbinghaus Memo server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;
