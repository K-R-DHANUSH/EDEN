/* ============================================
   AUTO-UPDATE AFTER 11:30 AM ONLY
============================================ */
async function autoUpdateIfNeeded() {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Check if time is >= 11:30 AM
    const updateTime = new Date();
    updateTime.setHours(11, 30, 0, 0);

    const isAfter1130 = now.getTime() >= updateTime.getTime();

    // If NOT after 11:30 AM → do NOT update
    if (!isAfter1130) {
        console.log("⏳ Before 11:30 AM → No update");
        return;
    }

    // Already updated today?
    if (lastUpdatedDate === today) {
        console.log("✔ Already updated today");
        return;
    }

    console.log("🌅 Time is >= 11:30 AM and not updated yet → Updating...");

    const live = await scrapeGoldPrice();

    if (live && live.price24) {
        updateCSV(live.price24, live.price22);
        lastUpdatedDate = today;
        console.log("📀 Auto-update completed:", live);
    } else {
        console.log("⚠ Auto-update failed (scraper issue)");
    }
}

/* ============================================
   FRONTEND GOLD API (Triggers auto update)
============================================ */
app.get("/gold", async (req, res) => {
    await autoUpdateIfNeeded();  // only updates after 11:30 AM

    const csv = fs.readFileSync(CSV_FILE, "utf8").split("\n");
    const headerIndex = csv.findIndex(l => l.toLowerCase().startsWith("gram"));
    const todayCol = csv[headerIndex].split(",").findIndex(h => h.toLowerCase().includes("today"));
    const row = csv.find((l, i) => i > headerIndex && l.includes("1 gram"));
    const rate24 = Number(row.split(",")[todayCol]);
    const rate22 = Number((rate24 * (22 / 24)).toFixed(2));

    res.json({
        price_gram_24k: rate24,
        price_gram_22k: rate22,
        updated: lastUpdatedDate || "Not yet updated today",
        source: "CSV (Auto-updates after 11:30 AM)"
    });
});
