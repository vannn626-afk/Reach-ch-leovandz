const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!redisUrl || !redisToken) throw new Error("Redis belum dikonfigurasi");
  const response = await fetch(
    `${redisUrl.replace(/\/$/, "")}/${command.map((value) => encodeURIComponent(String(value))).join("/")}`,
    { headers: { Authorization: `Bearer ${redisToken}` } }
  );
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Redis gagal");
  return data.result;
}

async function logUsage(record) {
  await redis(["LPUSH", "react:history", JSON.stringify(record)]);
  await redis(["LTRIM", "react:history", "0", "99"]);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Gunakan POST" });
  }

  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 40) : "";
  if (!name) return res.status(400).json({ error: "Nama wajib diisi sebelum memakai React Tools." });

  const apiKey = process.env.REACT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "REACT_API_KEY belum diatur." });

  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const record = { time: now.toISOString(), name, status: "failed" };

  try {
    const paused = await redis(["GET", "react:paused"]);
    if (paused === "1") {
      return res.status(503).json({ error: "TOOLS REACT TUTUP DULU AKHH" });
    }

    // Counter ini hanya statistik pemakaian melalui website, bukan limit provider.
    // Kuota provider dijadikan sumber kebenaran; biarkan upstream menentukan 429.
    await redis(["INCR", `react:count:${today}`]);
    await redis(["EXPIRE", `react:count:${today}`, "172800"]);

    const upstream = await fetch("https://react.botwa.net/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ url: body.url, emojis: body.emojis }),
    });

    const contentType = upstream.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await upstream.json() : await upstream.text();
    const payloadFailed = payload && typeof payload === "object" &&
      (payload.status === false || payload.success === false);
    record.status = upstream.ok && !payloadFailed ? "success" : "failed";
    record.httpStatus = upstream.status;
    if (body.url && typeof body.url === "string") record.url = body.url.slice(0, 500);
    await logUsage(record);

    return res.status(upstream.status).json(typeof payload === "string" ? { result: payload } : payload);
  } catch (error) {
    console.error("React API error:", error);
    record.status = "error";
    record.message = "Request ke provider atau pencatatan gagal";
    try { await logUsage(record); } catch (logError) { console.error("History error:", logError); }
    return res.status(502).json({ error: "React Tools gagal dihubungi. Periksa koneksi atau status provider." });
  }
};
