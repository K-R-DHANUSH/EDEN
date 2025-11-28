const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

const CSV_FILE = "./gold_rates.csv";

// REQUIRED HEADERS (your CSV uses ? because Excel replaced ₹)
const HEADERS = {
    gram: "Gram",
    today: "Gold Rate Today (?)",
    yesterday: "Gold Rate Yesterday (?)",
    change: "Daily Price Change (?)"
};

function readCSV() {
    try {
        const file = fs.readFileSync(CSV_FILE, "utf8");
        const lines = file.trim().split("\n");

        // Header row is line 3 in your CSV → index 2
        const headerRow = lines[2].split(",");

        // Validate header order
        const idxGram = headerRow.indexOf(HEADERS.gram);
        const idxToday = headerRow.indexOf(HEADERS.today);
        const idxYesterday = headerRow.indexOf(HEADERS.yesterday);
        const idxChange = headerRow.indexOf(HEADERS.change);

        if (idxGram === -1 || idxToday === -1) {
            console.log("CSV header mismatch.");
            return null;
        }

        // Parse data rows (starting at line 4 → index 3)
        const rows = lines.slice(3).map(line => {
            const cols = line.split(",");

            return {
                gram: cols[idxGram],
                today: Number(cols[idxToday]),
                yesterday: Number(cols[idxYesterday]),
                change: Number(cols[idxChange])
            };
        });

        // Get 1 gram price (this is your 24k rate)
        const oneGram = rows.find(r => r.gram.toLowerCase().includes("1 gram"));

        return {
            price_gram_24k: oneGram.today,
            price_gram_22k: oneGram.today * (22 / 24),
            full_data: rows,
            updated: new Date().toISOString()
        };

    } catch (err) {
        console.error("CSV read error:", err);
        return null;
    }
}

// API Endpoint
app.get("/gold", (req, res) => {
    const data = readCSV();
    if (!data) {
        return res.status(500).json({ error: "Failed to process CSV" });
    }
    res.json(data);
});

// Start Server
app.listen(3000, () => {
    console.log("Backend running at http://localhost:3000/gold");
});
