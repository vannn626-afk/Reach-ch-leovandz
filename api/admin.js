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
    throw new Error(data.error || "Redis request gagal");
  }

  return data.result;
}

function authorized(req) {
  const password = process.env.ADMIN_PASSWORD;

  return Boolean(
    password &&
    req.headers["x-admin-password"] === password
  );
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const action = req.query.action || "status";

      if (action === "status") {
        const paused = await redis([
          "GET",
          "react:paused",
        ]);

        return res.status(200).json({
          paused: paused === "1",
          message:
            paused === "1"
              ? "TOOLS REACT TUTUP DULU AKHH"
              : "React Tools aktif",
        });
      }

      if (!authorized(req)) {
        return res.status(401).json({
          error: "Password admin tidak valid",
        });
      }

      if (action === "history") {
        const history = await redis([
          "LRANGE",
          "react:history",
          "0",
          "99",
        ]);

        const today = new Date().toLocaleDateString(
          "en-CA",
          { timeZone: "Asia/Jakarta" }
        );

        const count = await redis([
          "GET",
          `react:count:${today}`,
        ]);

        return res.status(200).json({
          history: (history || []).map((item) => {
            try {
              return JSON.parse(item);
            } catch {
              return { detail: item };
            }
          }),
          usedToday: Number(count || 0),
          limit: Number(process.env.REACT_DAILY_LIMIT || 5),
        });
      }

      return res.status(400).json({
        error: "Action tidak dikenal",
      });
    }

    if (req.method === "POST") {
      if (!authorized(req)) {
        return res.status(401).json({
          error: "Password admin tidak valid",
        });
      }

      const { paused, clearHistory } = req.body || {};

      if (clearHistory === true) {
        await redis(["DEL", "react:history"]);

        return res.status(200).json({
          success: true,
          message: "Riwayat berhasil dihapus",
        });
      }

      if (typeof paused !== "boolean") {
        return res.status(400).json({
          error: "paused harus bernilai true atau false",
        });
      }

      await redis([
        "SET",
        "react:paused",
        paused ? "1" : "0",
      ]);

      return res.status(200).json({
        success: true,
        paused,
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({
      error: "Method tidak didukung",
    });
  } catch (error) {
    console.error("Admin API error:", error);

    return res.status(500).json({
      error: "Server admin bermasalah",
    });
  }
};
