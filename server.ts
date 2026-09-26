import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware with expanded body limits for high-resolution citizen waterlogging photos
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Ensure public/uploads directory exists for shareable report photos
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Dedicated route to serve citizen waterlogging photos directly with correct MIME and headers
  app.get(["/uploads/:filename", "/api/photos/:filename"], (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).send("Photo not found");
        return;
      }

      if (filename.toLowerCase().endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else {
        res.setHeader("Content-Type", "image/jpeg");
      }

      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      console.error("Error serving photo:", err);
      res.status(500).send("Error reading photo file");
    }
  });

  // Real shareable photo upload endpoint
  app.post("/api/upload-photo", (req, res) => {
    try {
      const { imageBase64, clientOrigin } = req.body;
      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "Missing or invalid imageBase64 data" });
        return;
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let ext = "jpeg";
      let base64Data = imageBase64;

      if (matches && matches.length === 3) {
        if (matches[1].toLowerCase().includes("png")) {
          ext = "png";
        } else {
          ext = "jpeg";
        }
        base64Data = matches[2];
      }

      const buffer = Buffer.from(base64Data, "base64");
      const safeFilename = `waterlogging_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, safeFilename);

      fs.writeFileSync(filePath, buffer);

      // Determine public accessible URL outside JolSafety
      let origin = typeof clientOrigin === "string" && clientOrigin.startsWith("http") ? clientOrigin : "";
      if (!origin) {
        const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
        let proto = req.get("x-forwarded-proto") || req.protocol || "http";
        if (proto.includes(",")) {
          proto = proto.split(",")[0].trim();
        }
        origin = `${proto}://${host}`;
      }
      origin = origin.replace(/\/+$/, "");
      const publicUrl = `${origin}/uploads/${safeFilename}`;

      res.json({
        success: true,
        url: publicUrl,
        filename: safeFilename
      });
    } catch (err: any) {
      console.error("Photo upload error:", err);
      res.status(500).json({ error: err.message || "Failed to save photo" });
    }
  });

  // High-fidelity native regional TTS Endpoint
  app.get("/api/tts", async (req, res) => {
    try {
      const text = (req.query.text as string || "").trim();
      const lang = (req.query.lang as string || "en").toLowerCase();

      if (!text) {
        res.status(400).json({ error: "Missing text parameter" });
        return;
      }

      // Authentic regional language models:
      // Bengali: 'bn-IN' (Real native Bengali speaker from Kolkata)
      // Hindi: 'hi-IN' (Authentic Indian Hindi)
      // English: 'en-IN' (Authentic Indian English)
      const targetLang = lang === "bn" ? "bn-IN" : lang === "hi" ? "hi-IN" : "en-IN";

      // 1. Primary: Stream authentic native speech from Google Translate TTS with authorized referer
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(targetLang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
      const googleRes = await fetch(ttsUrl, {
        headers: {
          "Referer": "https://translate.google.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (googleRes.ok) {
        const arrayBuffer = await googleRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Content-Length", buffer.length);
        res.status(200).send(buffer);
        return;
      }

      // 2. Secondary fallback: Gemini TTS via @google/genai
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI, Modality } = await import("@google/genai");
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } },
          });

          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" },
                },
              },
            },
          });

          const base64Audio = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const audioBuffer = Buffer.from(base64Audio, "base64");
            res.setHeader("Content-Type", "audio/wav");
            res.status(200).send(audioBuffer);
            return;
          }
        } catch (geminiErr) {
          console.warn("Gemini TTS fallback error:", geminiErr);
        }
      }

      res.status(502).json({ error: "TTS service unavailable" });
    } catch (err: any) {
      console.error("TTS endpoint error:", err);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  });

  // Serve public static assets
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
