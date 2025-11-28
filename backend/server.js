const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// Path to CSV (backend folder)
const CSV_FILE = path.join(__dirname, "gold_rates.csv");

// REQUIRED HEADERS (your CSV uses ? instead of ₹)
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

        // Header row is line 3 (index 2)
        const headerRow = lines[2].split(",");

        const idxGram = headerRow.indexOf(HEADERS.gram);
        const idxToday = headerRow.indexOf(HEADERS.today);
        const idxYesterday = headerRow.indexOf(HEADERS.yesterday);
        const idxChange = headerRow.indexOf(HEADERS.change);

        if (idxGram === -1 || idxToday === -1) {
            console.log("CSV header mismatch.");
            return null;
        }

        // Parse rows starting from line 4 (index 3)
        const rows = lines.slice(3).map(line => {
            const cols = line.split(",");

            return {
                gram: cols[idxGram],
                today: Number(cols[idxToday]),
                yesterday: Number(cols[idxYesterday]),
                change: Number(cols[idxChange])
            };
        });

        // Get 1 Gram price (24K)
        const oneGram = rows.find(r =>
            r.gram.toLowerCase().includes("1 gram")
        );

        return {
            price_gram_24k: oneGram.today,
            price_gram_22k: oneGram.today * (22 / 24),
            updated: new Date().toISOString(),
            full_data: rows
        };

    } catch (err) {
        console.error("CSV read error:", err);
        return null;
    }
}

/* =========================================
   API — Gold Rate Endpoint
========================================= */
app.get("/gold", (req, res) => {
    const data = readCSV();
    if (!data) {
        return res.status(500).json({ error: "Failed to process CSV" });
    }
    res.json(data);
});

/* =========================================
   SERVE FRONTEND FILES
   (index.html, assets/, GOLD/, etc.)
========================================= */

// Serve all static frontend files from root folder
app.use(express.static(path.join(__dirname, "..")));

// Default route → index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
