const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!redisUrl || !redisToken) {
    throw new Error("Redis belum dikonfigurasi");
  }

  const response = await fetch(
    `${redisUrl.replace(/\/$/, "")}/${command
      .map((value) => encodeURIComponent(String(value)))
      .join("/")}`,
    {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "Redis gagal");
  }

  return data.result;
}

async function logUsage(record) {
  await redis([
    "LPUSH",
    "react:history",
    JSON.stringify(record),
  ]);

  await redis(["LTRIM", "react:history", "0", "99"]);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Gunakan POST",
    });
  }

  const now = new Date();
  const today = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  const record = {
    time: now.toISOString(),
    status: "failed",
  };

  try {
    const paused = await redis(["GET", "react:paused"]);

    if (paused === "1") {
      return res.status(503).json({
        error: "TOOLS REACT TUTUP DULU AKHH",
      });
    }

    const limit = Number(
      process.env.REACT_DAILY_LIMIT || 5
    );

    // Satu counter bersama untuk semua pengunjung.
    const used = Number(
      await redis(["GET", `react:count:${today}`]) || 0
    );

    if (used >= limit) {
      return res.status(429).json({
        error: "Kuota React Tools hari ini sudah habis.",
        used,
        limit,
      });
    }

    // Reservasi pemakaian sebelum memanggil provider.
    // Ini menghindari pemakaian bersamaan yang melewati limit.
    const reserved = await redis([
      "INCR",
      `react:count:${today}`,
    ]);

    if (Number(reserved) === 1) {
      await redis([
        "EXPIRE",
        `react:count:${today}`,
        "172800",
      ]);
    }

    if (Number(reserved) > limit) {
      return res.status(429).json({
        error: "Kuota React Tools hari ini sudah habis.",
        used: Number(reserved),
        limit,
      });
    }

    const apiKey = process.env.REACT_API_KEY;

    if (!apiKey) {
      throw new Error("REACT_API_KEY belum diatur");
    }

    const upstream = await fetch(
      "https://react.botwa.net/api/react",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(req.body || {}),
      }
    );

    const contentType =
      upstream.headers.get("content-type") || "";

    const body = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    record.status = upstream.ok ? "success" : "failed";
    record.httpStatus = upstream.status;

    await logUsage(record);

    return res.status(upstream.status).json(
      typeof body === "string" ? { result: body } : body
    );
  } catch (error) {
    console.error("React API error:", error);

    record.status = "error";

    try {
      await logUsage(record);
    } catch (logError) {
      console.error("History error:", logError);
    }

    return res.status(500).json({
      error: "React Tools gagal diproses.",
    });
  }
};
