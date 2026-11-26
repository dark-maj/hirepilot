import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import analyzeRouter from "./routes/analyze.js";

dotenv.config();

const env = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    ALLOWED_ORIGIN: z.string().url(),
  })
  .parse(process.env);

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

app.use(cors({ origin: env.ALLOWED_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/analyze", analyzeRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/api/extract",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }),
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) return next(error);
      if (!req.file) {
        return res.status(400).json({ message: "Please upload one PDF file." });
      }
      if (req.file.mimetype !== "application/pdf") {
        return res.status(415).json({ message: "Only PDF files are accepted." });
      }
      return next();
    });
  },
  async (req, res) => {
    const parser = new PDFParse({ data: req.file.buffer });

    try {
      const result = await parser.getText();
      const text = result.text.trim();
      if (text.length < 200) {
        return res.status(422).json({
          message: "Could not extract enough text. This PDF may be scanned; try a text-based PDF.",
        });
      }
      return res.json({ text });
    } catch {
      return res.status(422).json({ message: "Could not read this PDF." });
    } finally {
      await parser.destroy();
    }
  },
);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: "Invalid PDF upload." });
  }
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

app.listen(env.PORT, () => {
  // Keep startup logs free of request or resume content.
  console.log(`HirePilot API listening on port ${env.PORT}`);
});
