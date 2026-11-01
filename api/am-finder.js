const { isVideoUrl, apiFind, mapFindResult } = require("../lib/amfinder");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Gunakan POST." });
  }

  const target = typeof (req.body || {}).query === "string" ? req.body.query.trim() : "";
  if (!target) return res.status(400).json({ success: false, error: "Tempel tautan video TikTok." });

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(target) ? target : "https://" + target);
  } catch (_) {
    return res.status(400).json({ success: false, error: "Format tautan tidak valid. Tempel tautan video TikTok." });
  }

  const host = parsed.hostname.toLowerCase();
  const isTikTok = host === "tiktok.com" || host.endsWith(".tiktok.com");
  if (!isTikTok || !isVideoUrl(target) || !/\/(@[^/]+\/video\/\d+|t\/|[A-Za-z0-9]+)/i.test(parsed.pathname)) {
    return res.status(400).json({ success: false, error: "Saat ini AM Finder hanya menerima tautan video TikTok." });
  }

  try {
    const data = mapFindResult(await apiFind(target));
    return res.status(200).json(data);
  } catch (error) {
    console.error("AM Finder error:", error);
    const message = error && error.name === "ApiError"
      ? error.message
      : "AM Finder sedang tidak dapat dihubungi. Coba lagi beberapa saat.";
    return res.status(502).json({ success: false, error: message });
  }
};
