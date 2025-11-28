/* ----------- FIXED BACKEND URL ----------- */
const API_URL = "https://eden-m2qz.onrender.com/gold";

/* =================== NAVBAR ======================= */
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

navToggle?.addEventListener("click", () => {
    navMenu.classList.toggle("open");
});

/* =================== LIVE GOLD RATES ====================== */
let live24K = 0;
let live22K = 0;
let investmentChart = null;

let lumpsumEntries = [];
let periodicEntries = [];

/* Prevent negative values */
function preventNegative(input) {
    if (Number(input.value) < 0) {
        alert("Negative values are not allowed.");
        input.value = "";
    }
}

/* Fetch Rates */
async function fetchGoldRates() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        live24K = Number(data.price_gram_24k) || 0;
        live22K = Number(data.price_gram_22k) || (live24K * (22 / 24));

        document.querySelector("#goldTable24K tbody").innerHTML =
            `<tr><td>1 Gram (24K)</td><td>₹${live24K.toFixed(2)}</td></tr>`;

        document.querySelector("#goldTable22K tbody").innerHTML =
            `<tr><td>1 Gram (22K)</td><td>₹${live22K.toFixed(2)}</td></tr>`;

    } catch (err) {
        console.error("Gold API Error:", err);
    }
}
fetchGoldRates();

/* =================== CALCULATOR (Amount ↔ Grams) ====================== */
const amountField = document.getElementById("amountField");
const gramsField = document.getElementById("gramsField");

let selectedRate = "24k";

function getRate() {
    return selectedRate === "24k" ? live24K : live22K;
}

function calculateFromAmount() {
    preventNegative(amountField);
    const rate = getRate();
    if (!amountField.value || rate === 0) return (gramsField.value = "");
    gramsField.value = (Number(amountField.value) / rate).toFixed(2);
}

function calculateFromGrams() {
    preventNegative(gramsField);
    const rate = getRate();
    if (!gramsField.value || rate === 0) return (amountField.value = "");
    amountField.value = (Number(gramsField.value) * rate).toFixed(2);
}

amountField?.addEventListener("input", calculateFromAmount);
gramsField?.addEventListener("input", calculateFromGrams);

/* =================== MAIN INVESTMENT INPUTS ====================== */
const investmentAmountEl = document.getElementById("investmentAmount");
const tenureYearsEl = document.getElementById("tenureYears");
const investmentGoldTypeEl = document.getElementById("investmentGoldType");

tenureYearsEl.addEventListener("input", () => {
    const val = Number(tenureYearsEl.value);

    if (val > 10) {
        tenureYearsEl.value = 10;
        alert("Maximum tenure is 10 years.");
    }

    calculateInvestment();
});

const valNum = el => (el ? Number(el.value || 0) : 0);

/* =================== LUMPSUM MANAGEMENT ====================== */
function addLumpsumEntry() {
    const id = crypto.randomUUID();
    lumpsumEntries.push({ id, amount: 0, month: "" });
    renderLumpsumList();
    calculateInvestment();
}

function renderLumpsumList() {
    const list = document.getElementById("lumpsumList");
    list.innerHTML = "";

    lumpsumEntries.forEach(entry => {
        const row = document.createElement("div");
        row.className = "lumpsum-row";

        row.innerHTML = `
            <div class="lumpsum-col">
                <label>Amount (₹):</label>
                <input type="number" class="lumpsum-amt" value="${entry.amount}">
            </div>
            <div class="lumpsum-col">
                <label>Month/Year:</label>
                <input type="month" class="lumpsum-month" value="${entry.month}">
            </div>
            <button class="btn-delete-lumpsum">Delete</button>
        `;

        const amt = row.querySelector(".lumpsum-amt");
        const month = row.querySelector(".lumpsum-month");
        const del = row.querySelector(".btn-delete-lumpsum");

        amt.addEventListener("input", e => {
            preventNegative(amt);
            entry.amount = Number(e.target.value);
            calculateInvestment();
        });

        month.addEventListener("change", e => {
            entry.month = e.target.value;
            calculateInvestment();
        });

        del.addEventListener("click", () => {
            lumpsumEntries = lumpsumEntries.filter(x => x.id !== entry.id);
            renderLumpsumList();
            calculateInvestment();
        });

        list.appendChild(row);
    });
}

/* =================== PERIODIC MANAGEMENT ====================== */
function addPeriodicEntry() {
    const id = crypto.randomUUID();
    periodicEntries.push({ id, amount: 0, frequency: "monthly", start: "" });
    renderPeriodicList();
    calculateInvestment();
}

function renderPeriodicList() {
    const list = document.getElementById("periodicList");
    list.innerHTML = "";

    periodicEntries.forEach(entry => {
        const row = document.createElement("div");
        row.className = "periodic-row";

        row.innerHTML = `
            <div class="periodic-col">
                <label>Amount (₹):</label>
                <input type="number" class="periodic-amt" value="${entry.amount}">
            </div>
            <div class="periodic-col">
                <label>Freq:</label>
                <select class="periodic-freq">
                    <option value="monthly" ${entry.frequency === "monthly" ? "selected" : ""}>MON</option>
                    <option value="yearly" ${entry.frequency === "yearly" ? "selected" : ""}>YRL</option>
                </select>
            </div>
            <div class="periodic-col">
                <label>Start:</label>
                <input type="month" class="periodic-start" value="${entry.start}">
            </div>
            <button class="btn-delete-periodic">Delete</button>
        `;

        const amt = row.querySelector(".periodic-amt");
        const freq = row.querySelector(".periodic-freq");
        const start = row.querySelector(".periodic-start");
        const del = row.querySelector(".btn-delete-periodic");

        amt.addEventListener("input", e => {
            preventNegative(amt);
            entry.amount = Number(e.target.value);
            calculateInvestment();
        });

        freq.addEventListener("change", e => {
            entry.frequency = e.target.value;
            calculateInvestment();
        });

        start.addEventListener("change", e => {
            entry.start = e.target.value;
            calculateInvestment();
        });

        del.addEventListener("click", () => {
            periodicEntries = periodicEntries.filter(x => x.id !== entry.id);
            renderPeriodicList();
            calculateInvestment();
        });

        list.appendChild(row);
    });
}

/* =================== DATE HELPERS ====================== */
function fmtYYYYMM(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function yyyymm_gte(a, b) {
    return a >= b;
}

/* =================== MAIN INVESTMENT CALC ====================== */
function calculateInvestment() {
    preventNegative(investmentAmountEl);
    preventNegative(tenureYearsEl);

    const baseInvestment = valNum(investmentAmountEl);
    const years = valNum(tenureYearsEl);

    const rate = investmentGoldTypeEl.value === "24k" ? live24K : live22K;

    if (!baseInvestment || !years || rate === 0) {
        document.getElementById("totalInvested").textContent = "₹0";
        document.getElementById("totalGold").textContent = "0 g";
        renderEmptyReport();
        return;
    }

    let totalInvested = 0;
    let totalGold = 0;
    const totalPeriods = years * 12;

    let currentDate = new Date();
    currentDate.setDate(1);

    const rows = [];

    for (let i = 0; i < totalPeriods; i++) {
        const loopMonth = fmtYYYYMM(currentDate);
        let periodInvestment = baseInvestment;

        let periodicAmt = 0;
        periodicEntries.forEach(pe => {
            if (!pe.amount || !pe.start) return;

            if (pe.frequency === "monthly") {
                if (yyyymm_gte(loopMonth, pe.start)) periodicAmt += pe.amount;
            } else {
                if (
                    loopMonth.slice(5, 7) === pe.start.slice(5, 7) &&
                    yyyymm_gte(loopMonth, pe.start)
                ) {
                    periodicAmt += pe.amount;
                }
            }
        });

        let lumpAmt = 0;
        lumpsumEntries.forEach(le => {
            if (le.month === loopMonth) lumpAmt += le.amount;
        });

        periodInvestment += periodicAmt + lumpAmt;

        totalInvested += periodInvestment;
        totalGold += periodInvestment / rate;

        rows.push({
            label: `${currentDate.toLocaleString("en-US", { month: "short" })}-${currentDate.getFullYear()}`,
            cumulativeGrams: totalGold,
            cumulativeValue: totalGold * rate,
            periodicApplied: periodicAmt,
            lumpsumApplied: lumpAmt
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    document.getElementById("totalInvested").textContent = "₹" + totalInvested.toFixed(2);
    document.getElementById("totalGold").textContent = totalGold.toFixed(3) + " g";

    renderReportFromRows(rows);
}

/* =================== REPORT RENDERING ====================== */
function renderReportFromRows(rows) {
    const reportBody = document.getElementById("reportBody");
    reportBody.innerHTML = "";

    const labels = [];
    const gramsList = [];
    const valueList = [];

    rows.forEach(r => {
        reportBody.innerHTML += `
            <tr>
                <td>${r.label}</td>
                <td>${r.cumulativeGrams.toFixed(4)}</td>
                <td>${r.cumulativeValue.toFixed(2)}</td>
                <td>${r.periodicApplied > 0 ? "₹" + r.periodicApplied : "-"}</td>
                <td>${r.lumpsumApplied > 0 ? "₹" + r.lumpsumApplied : "-"}</td>
            </tr>
        `;
        labels.push(r.label);
        gramsList.push(r.cumulativeGrams);
        valueList.push(r.cumulativeValue);
    });

    window.cumulativeValueList = valueList;
    generateLineChart(labels, gramsList);
}

function renderEmptyReport() {
    document.getElementById("reportBody").innerHTML = "";
    if (investmentChart) {
        investmentChart.destroy();
        investmentChart = null;
    }
}

/* =================== EXPORT TO EXCEL ====================== */
document.getElementById("downloadReportBtn")?.addEventListener("click", function () {
    const table = document.getElementById("investmentReportTable");

    if (!table) return alert("Report table not found.");
    if (typeof XLSX === "undefined") return alert("XLSX library missing.");

    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, "Investment Report");
        XLSX.writeFile(wb, "Investment_Report.xlsx");
    } catch (err) {
        console.error(err);
        alert("Failed to download.");
    }
});

/* =================== CHART WITH DUAL TOOLTIP ====================== */
function generateLineChart(labels, gramsArray) {
    const ctx = document.getElementById("investmentChart").getContext("2d");

    if (investmentChart) investmentChart.destroy();

    investmentChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Cumulative Gold (g)",
                    data: gramsArray,
                    borderWidth: 2,
                    borderColor: "#B8860B",
                    tension: 0.25
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            const grams = ctx.raw;
                            const idx = ctx.dataIndex;
                            const value = window.cumulativeValueList[idx];

                            return [
                                "Gold: " + grams.toFixed(3) + " g",
                                "Value: ₹" + value.toFixed(2)
                            ];
                        }
                    }
                },
                legend: { display: true }
            }
        }
    });
}

/* =================== EVENT HOOKS ====================== */
document.getElementById("addLumpsumBtn")?.addEventListener("click", addLumpsumEntry);
document.getElementById("addPeriodicBtn")?.addEventListener("click", addPeriodicEntry);

investmentAmountEl?.addEventListener("input", calculateInvestment);
tenureYearsEl?.addEventListener("input", calculateInvestment);
investmentGoldTypeEl?.addEventListener("change", calculateInvestment);

/* Initialize */
calculateInvestment();


// Theme Toggle
document.getElementById("themeToggle").addEventListener("click", () => {

    document.body.classList.toggle("dark-theme");

    const btn = document.getElementById("themeToggle");
    btn.textContent = document.body.classList.contains("dark-theme") ? "🌙" : "☀️";
});

// Set DEFAULT icon (because default theme = LIGHT)
document.getElementById("themeToggle").textContent = "☀️";



