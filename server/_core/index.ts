import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Audio upload endpoint for voice transcription
  app.post("/api/upload-audio", async (req: any, res: any) => {
    try {
      const multer = await import("multer");
      const multerFn = (multer as any).default || multer;
      const upload = multerFn({ storage: multerFn.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });
      upload.single("file")(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        try {
          const { storagePut } = await import("../storage");
          const { nanoid } = await import("nanoid");
          const key = `audio/${nanoid()}.webm`;
          const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
          res.json({ url });
        } catch (uploadErr) {
          console.error("Storage upload error:", uploadErr);
          res.status(500).json({ error: "Upload failed" });
        }
      });
    } catch (error) {
      console.error("Audio upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
