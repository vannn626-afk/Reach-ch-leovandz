const { isVideoUrl, apiFind, apiSearch, mapFindResult, mapSearchItem } = require("../lib/amfinder");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Gunakan POST." });
  }
  const target = typeof (req.body || {}).query === "string" ? req.body.query.trim() : "";
  if (target.length < 3) return res.status(400).json({ error: "Masukkan minimal 3 karakter atau tautan video TikTok/YouTube." });
  try {
    if (isVideoUrl(target)) {
      let parsed;
      try { parsed = new URL(/^https?:\/\//i.test(target) ? target : "https://" + target); } catch (_) {
        return res.status(400).json({ success: false, error: "Tautan video tidak valid." });
      }
      const host = parsed.hostname.toLowerCase();
      if (!(host === "tiktok.com" || host.endsWith(".tiktok.com") || host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com"))) {
        return res.status(400).json({ success: false, error: "Gunakan tautan TikTok atau YouTube." });
      }
      const data = mapFindResult(await apiFind(target));
      return res.status(200).json(data);
    }
    const result = await apiSearch(target);
    const items = (result.items || []).map(mapSearchItem);
    return res.status(200).json({
      success: items.length > 0,
      mode: "pencarian_kata_kunci",
      input: target,
      total_hasil: items.length,
      hasil_pencarian: items,
      pesan: items.length ? null : "Tidak ada video yang ditemukan untuk kata kunci ini."
    });
  } catch (error) {
    console.error("AM Finder error:", error);
    const message = error && error.name === "ApiError" ? error.message : "AM Finder sedang tidak dapat dihubungi. Coba lagi beberapa saat.";
    return res.status(502).json({ success: false, error: message });
  }
};
