# LEOVANDYZ — Reach CH

Website statis dengan endpoint serverless Vercel untuk mengirim request ke React API. Fitur lain ditandai masih tahap pengembangan.

## Deploy ke Vercel
1. Ekstrak ZIP dan impor folder project ke GitHub atau unggah melalui alur deploy Vercel yang mendukung folder project.
2. Di Vercel → Project → Settings → Environment Variables, tambahkan `REACT_API_KEY` berisi API key React API yang aktif.
3. Deploy atau redeploy project.
4. Buka URL deployment dan uji Reach CH dengan link postingan channel yang valid.

API key tidak disimpan di frontend. Jangan menaruh API key asli ke dalam `index.html` atau repository publik.

## Endpoint upstream
- `POST https://react.botwa.net/api/react`
- Header `x-api-key`
- JSON body `{ "url": "...", "emojis": "🔥, ❤️" }`

## Catatan
- Status “LINK TERVERIFIKASI” menandakan format link lolos pemeriksaan lokal, bukan konfirmasi bahwa postingan bisa dijangkau upstream.
- API upstream menyebut layanan gratis memiliki satu percobaan per pemanggilan. Hindari klik berulang jika respons belum jelas.
- API key yang pernah dibagikan di chat sebaiknya dirotasi sebelum dipakai di deployment publik.


## AM Preset Finder scraper update

- Pencarian kata kunci tetap menggunakan endpoint pencarian AM Finder yang sudah terintegrasi.
- Pemindaian tautan video sekarang menggunakan endpoint `/api/find` dari `https://xzeerhpreset-amfinder.vercel.app`, mengikuti alur scraper `scrape-amfinder.js` yang diberikan.
- Hasil preset difilter agar URL video TikTok/YouTube tidak ditampilkan sebagai tautan preset.
- Dependensi `cheerio` digunakan untuk membaca cookie sesi scraper.
- UI memiliki animasi masuk dan ikon antarmuka berbasis SVG. Emoji reaction tetap dipertahankan sebagai data karena fitur React memang mengirim emoji reaksi.

Catatan: endpoint eksternal dan perilaku live perlu diuji setelah deploy; pemeriksaan lokal hanya memvalidasi sintaks dan struktur.
