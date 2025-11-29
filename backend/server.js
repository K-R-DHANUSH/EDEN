const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const cheerio = require("cheerio");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());

const CSV_FILE = path.join(__dirname, "gold_rates.csv");
const SCRAPE_URL = "https://www.livechennai.com/gold_silverrate.asp";

/* ============================================================
   GLOBAL: Track last update timestamp (YYYY-MM-DD)
============================================================ */
let lastUpdatedDate = null;

/* ============================================================
   SCRAPER — Fetch latest gold rate from LiveChennai
============================================================ */
async function scrapeGoldPrice() {
  try {
    const res = await fetch(SCRAPE_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    const table = $("table.table.table-bordered.table-striped.gold-rates").first();
    if (!table || table.length === 0) {
      console.log("❌ LiveChennai Table not found");
      return null;
    }

    const firstRow = table.find("tbody tr").first();
    const cols = firstRow.find("td");

    const price24_raw = $(cols[1]).text().trim();
    const price22_raw = $(cols[3]).text().trim();

    const price24 = Number(price24_raw.replace(/[^0-9.]/g, ""));
    const price22 = Number(price22_raw.replace(/[^0-9.]/g, ""));

    if (!price24 || !price22) {
      console.log("❌ Missing extracted values", price24_raw, price22_raw);
      return null;
    }

    console.log("✔ SCRAPED:", price24, price22);
    return { price24, price22 };
  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    return null;
  }
}

/* ============================================================
   CSV UPDATE
============================================================ */
function updateCSV(new24, new22) {
  try {
    let lines = fs.readFileSync(CSV_FILE, "utf8").split("\n");

    const headerIndex = lines.findIndex((l) =>
      l.toLowerCase().startsWith("gram")
    );
    const rowIndex = lines.findIndex(
      (l, i) => i > headerIndex && l.includes("1 gram")
    );

    const header = lines[headerIndex].split(",");
    const idxToday = header.findIndex((h) => h.toLowerCase().includes("today"));
    const idxYesterday = header.findIndex((h) =>
      h.toLowerCase().includes("yesterday")
    );
    const idxChange = header.findIndex((h) =>
      h.toLowerCase().includes("change")
    );

    let row = lines[rowIndex].split(",");

    const oldToday = Number(row[idxToday]);
    row[idxYesterday] = oldToday;
    row[idxToday] = new24;
    row[idxChange] = new24 - oldToday;

    lines[rowIndex] = row.join(",");

    fs.writeFileSync(CSV_FILE, lines.join("\n"));

    console.log("✅ CSV updated successfully");
  } catch (err) {
    console.error("CSV ERROR:", err);
  }
}

/* ============================================================
   CSV READ
============================================================ */
function readCSV() {
  try {
    const lines = fs.readFileSync(CSV_FILE, "utf8").split("\n");
    const headerIndex = lines.findIndex((l) =>
      l.toLowerCase().startsWith("gram")
    );

    const header = lines[headerIndex].split(",");
    const idxToday = header.findIndex((h) => h.toLowerCase().includes("today"));

    const row = lines.find(
      (l, i) => i > headerIndex && l.includes("1 gram")
    );
    const cols = row.split(",");

    const rate24 = Number(cols[idxToday]);
    const rate22 = Number((rate24 * (22 / 24)).toFixed(2));

    return {
      price_gram_24k: rate24,
      price_gram_22k: rate22,
      source: "CSV",
      updated: new Date().toISOString(),
    };
  } catch (err) {
    return { error: "CSV read error" };
  }
}

/* ============================================================
   AUTO-UPDATE ON FIRST REQUEST OF THE DAY
============================================================ */
async function ensureTodayRates() {
  const today = new Date().toISOString().split("T")[0];

  if (lastUpdatedDate === today) {
    console.log("✔ Already updated today — using cached CSV");
    return;
  }

  console.log("🔄 Updating CSV now (first request of the day)…");
  const gold = await scrapeGoldPrice();
  if (!gold) return;

  updateCSV(gold.price24, gold.price22);
  lastUpdatedDate = today;
}

/* ============================================================
   API: GET /gold  (auto-updates CSV if needed)
============================================================ */
app.get("/gold", async (req, res) => {
  await ensureTodayRates();
  res.json(readCSV());
});

/* ============================================================
   MANUAL TRIGGER (optional)
============================================================ */
app.get("/update-gold", async (req, res) => {
  const gold = await scrapeGoldPrice();
  if (!gold) return res.json({ success: false });

  updateCSV(gold.price24, gold.price22);
  lastUpdatedDate = new Date().toISOString().split("T")[0];

  res.json({ success: true, updated: gold });
});

/* ============================================================
   STATIC FILES (Render)
============================================================ */
app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* ============================================================
   START SERVER (Render requires process.env.PORT)
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ============================================================
   Cron Backup — runs daily at 11:30 AM IST
============================================================ */
cron.schedule("30 11 * * *", async () => {
  console.log("⏳ Cron Auto-update running...");
  const gold = await scrapeGoldPrice();
  if (gold) {
    updateCSV(gold.price24, gold.price22);
    lastUpdatedDate = new Date().toISOString().split("T")[0];
  }
});
