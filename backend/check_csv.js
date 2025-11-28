const fs = require("fs");

const FILE = "./goldreate.csv";

// Expected headers
const REQUIRED_HEADERS = [
    "Gram",
    "Gold Rate Today (?)",
    "Gold Rate Yesterday (?)",
    "Daily Price Change (?)"
];

function checkCSV() {
    try {
        const content = fs.readFileSync(FILE, "utf8");
        const lines = content.trim().split("\n");

        console.log("\n--- CSV VERIFICATION ---\n");

        // Show first 10 lines for inspection
        console.log("Preview of CSV:");
        lines.slice(0, 10).forEach((l, i) => console.log(`${i + 1}: ${l}`));
        console.log("\n");

        // Find header line
        let headerLineIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("Gram") && lines[i].includes("Gold Rate Today")) {
                headerLineIndex = i;
                break;
            }
        }

        if (headerLineIndex === -1) {
            console.log("❌ ERROR: Could NOT find header row! CSV structure is wrong.\n");
            return;
        }

        console.log(`✔ Header found at line number: ${headerLineIndex + 1}`);

        // Parse header
        const headers = lines[headerLineIndex].split(",").map(h => h.trim());

        console.log("Detected Headers:", headers);

        // Validate headers
        let allGood = true;

        REQUIRED_HEADERS.forEach(req => {
            if (!headers.includes(req)) {
                console.log(`❌ Missing header: ${req}`);
                allGood = false;
            } else {
                console.log(`✔ Found header: ${req}`);
            }
        });

        if (allGood) {
            console.log("\n🎉 CSV HEADER IS PERFECT!");
        } else {
            console.log("\n⚠️ CSV HEADER HAS PROBLEMS. FIX BEFORE USING IN BACKEND.");
        }

    } catch (err) {
        console.error("Failed to read CSV:", err);
    }
}

checkCSV();
