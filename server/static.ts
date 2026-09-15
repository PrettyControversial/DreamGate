import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        // Vite fingerprints files under assets/, so they can be cached for a
        // year without risking stale JavaScript, CSS, images, or audio.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }

        // Tarot card filenames are stable but not fingerprinted because they
        // live in public/. Keep them warm for a day without making updates
        // impossible to receive.
        if (filePath.includes(`${path.sep}tarot${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
