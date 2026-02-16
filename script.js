let dataStore = [];
let phaseFilter = "All";
let viewMode = "table";
let pieChart = null;
let lineChart = null;
let currentReleaseDate = null;

const releaseDates = {
    "Lipstick_Cleaned.csv": "2017-07-21",
    "Padmaavat_Cleaned.csv": "2018-01-25",
    "VeereDiWedding_Cleaned.csv": "2018-06-01",
    "TheKeralaStory_Cleaned.csv": "2023-05-05",
    "Animal_Cleaned.csv": "2023-12-01"
};

function loadArchive() {

    const file = document.getElementById("filmSelect").value;
    currentReleaseDate = new Date(releaseDates[file]);

    Papa.parse("data/" + file, {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(results) {

            dataStore = results.data
                .filter(row => row["Title"])
                .map(row => {

                    const parts = row["Published Date"].split("-");
                    const parsed = new Date(parts[2], parts[1] - 1, parts[0]);

                    // FIX: classify same-day as PRE
                    let phase;
                    if (parsed <= currentReleaseDate) {
                        phase = "Pre";
                    } else {
                        phase = "Post";
                    }

                    return {
                        ...row,
                        parsedDate: parsed,
                        Phase: phase
                    };
                });

            document.getElementById("filmTitle").innerText =
                file.replace("_Cleaned.csv", "");

            document.getElementById("filmMeta").innerText =
                dataStore.length + " archival records";

            updateView();
        }
    });
}

function setPhase(p) {
    phaseFilter = p;
    updateView();
}

function setView(v) {
    viewMode = v;
    updateView();
}

function updateView() {

    let data = [...dataStore];

    if (phaseFilter !== "All") {
        data = data.filter(d => d.Phase === phaseFilter);
    }

    const q = document.getElementById("searchInput").value.toLowerCase();
    if (q) {
        data = data.filter(d =>
            d.Title.toLowerCase().includes(q) ||
            d.Source.toLowerCase().includes(q)
        );
    }

    renderTable(data);
    renderTimeline(data);
    renderPie(data);
    renderLine(data);
}

function renderTable(data) {

    const tbody = document.querySelector("#archiveTable tbody");
    tbody.innerHTML = "";

    data.sort((a, b) => a.parsedDate - b.parsedDate);

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row["Published Date"]}</td>
            <td>${row.Phase}</td>
            <td>${row.Title}</td>
            <td>${row.Source}</td>
            <td><a href="${row.URL}" target="_blank">View</a></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("archiveTable").style.display =
        viewMode === "table" ? "table" : "none";
}

function renderTimeline(data) {

    const div = document.getElementById("timelineView");
    div.innerHTML = "";

    data.sort((a, b) => a.parsedDate - b.parsedDate);

    let dividerInserted = false;

    data.forEach(row => {

        // Divider appears at first POST article
        if (!dividerInserted && row.Phase === "Post") {
            const divider = document.createElement("div");
            divider.className = "release-divider";
            divider.innerText = "— THEATRICAL RELEASE —";
            div.appendChild(divider);
            dividerInserted = true;
        }

        const card = document.createElement("div");
        card.className = "timeline-card";
        card.innerHTML = `
            <div class="timeline-date">
                ${row["Published Date"]} (${row.Phase})
            </div>
            <div class="timeline-title">
                ${row.Title}
            </div>
            <div class="timeline-source">
                ${row.Source}
            </div>
        `;
        div.appendChild(card);
    });

    div.style.display = viewMode === "timeline" ? "block" : "none";
}

function renderPie(data) {

    let protest = 0;
    let inst = 0;

    data.forEach(r => {
        protest += parseInt(r["Protest_Score"] || 0);
        inst += parseInt(r["Institution_Score"] || 0);
    });

    const ctx = document.getElementById("pieChart");

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Protest", "Institution"],
            datasets: [{
                data: [protest, inst],
                backgroundColor: ["#111", "#bbb"]
            }]
        },
        options: {
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

function renderLine(data) {

    data.sort((a, b) => a.parsedDate - b.parsedDate);

    const labels = data.map(r => r["Published Date"]);
    const protest = data.map(r => parseInt(r["Protest_Score"] || 0));
    const inst = data.map(r => parseInt(r["Institution_Score"] || 0));

    const ctx = document.getElementById("lineChart");

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Protest",
                    data: protest,
                    borderColor: "#111",
                    tension: 0.3
                },
                {
                    label: "Institution",
                    data: inst,
                    borderColor: "#888",
                    tension: 0.3
                }
            ]
        },
        options: {
            plugins: {
                legend: { position: "bottom" }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}
