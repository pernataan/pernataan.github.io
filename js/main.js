const columnOrder = [
  "SKU",
  "Nama",
  "Total",
  "A12 - 1",
  "A12 - 2",
  "A12 - 3",
  "A12 - 4",
  "A19 - 1",
  "A19 - 2",
  "A19 - 3",
  "A20 - 1",
  "A20 - 2",
  "A20 - 3",
  "A20 - 4",
  "B16 - 1",
  "B16 - 2",
  "B16 - 3",
  "B16 - 4",
  "OASIS - 1",
  "OASIS - 2",
  "OASIS - 3",
  "OASIS - 4 ",
  "LTC",
];

const lantaiColumns = columnOrder.slice(3);
let data = [];
let tab = "all";
let batchSize = 100;
let renderedRows = 0;
let currentSort = { column: null, asc: true };

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then((reg) => console.log("✅ Service Worker registered:", reg.scope))
    .catch((err) => console.error("⚠️ Service Worker failed:", err));
}

function changeTheme(theme) {
  document.body.className = theme;
  localStorage.setItem("selectedTheme", theme);
}

function loadSavedTheme() {
  const saved = localStorage.getItem("selectedTheme");
  if (saved) {
    document.body.className = saved;
    const selector = document.getElementById("themeSelector");
    if (selector) selector.value = saved;
  }
}

function formatCurrency(num) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function setTab(value) {
  tab = value;
  document.getElementById("tabAll").classList.remove("active");
  document.getElementById("tabMinus").classList.remove("active");
  document.getElementById("tab" + capitalize(value)).classList.add("active");
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = "";
  renderTable();
}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSelectedFloors() {
  let saved = JSON.parse(
    localStorage.getItem("selectedFloors") || JSON.stringify(lantaiColumns)
  );
  return saved;
}

function saveSelectedFloors(selected) {
  localStorage.setItem("selectedFloors", JSON.stringify(selected));
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = "";
  renderTable();
}

function groupFloorsByName(columns) {
  const groups = {};
  columns.forEach((col) => {
    const prefix = col.split(" - ")[0].trim();
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(col);
  });
  return groups;
}

/**
 * Fungsi baru untuk membuat checkbox filter yang sudah dikelompokkan.
 */
function setupLantaiCheckboxes() {
  const container = document.getElementById("lantaiFilter");
  container.innerHTML = ""; // Kosongkan container

  const groupedFloors = groupFloorsByName(lantaiColumns);
  const selectedFloors = getSelectedFloors();

  // Loop setiap grup untuk membuat fieldset-nya
  for (const groupName in groupedFloors) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = groupName;
    fieldset.appendChild(legend);

    // Buat tombol kontrol untuk "Pilih Semua" dan "Hapus Semua" per grup
    const controlsDiv = document.createElement("div");
    controlsDiv.className = "group-controls";

    const selectAllBtn = document.createElement("button");
    selectAllBtn.textContent = "Pilih Semua";
    selectAllBtn.type = "button";
    selectAllBtn.onclick = () => toggleGroupCheckboxes(groupName, true);
    controlsDiv.appendChild(selectAllBtn);

    const clearAllBtn = document.createElement("button");
    clearAllBtn.textContent = "Hapus Semua";
    clearAllBtn.type = "button";
    clearAllBtn.onclick = () => toggleGroupCheckboxes(groupName, false);
    controlsDiv.appendChild(clearAllBtn);

    fieldset.appendChild(controlsDiv);

    // Buat checkbox untuk setiap item di dalam grup
    const floorsInGroup = groupedFloors[groupName];
    floorsInGroup.forEach((col) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = col;
      checkbox.dataset.group = groupName; // Atribut data untuk membantu fungsi toggle
      checkbox.checked = selectedFloors.includes(col);

      checkbox.onchange = () => {
        const selected = Array.from(
          document.querySelectorAll("#lantaiFilter input:checked")
        ).map((cb) => cb.value);
        saveSelectedFloors(selected);
      };

      label.appendChild(checkbox);
      label.append(` ${col}`);
      fieldset.appendChild(label);
    });

    container.appendChild(fieldset);
  }
}

/**
 * Fungsi bantuan untuk tombol "Pilih Semua" / "Hapus Semua" per grup.
 */
function toggleGroupCheckboxes(groupName, shouldBeChecked) {
  const checkboxesInGroup = document.querySelectorAll(
    `#lantaiFilter input[data-group="${groupName}"]`
  );
  checkboxesInGroup.forEach((cb) => {
    cb.checked = shouldBeChecked;
  });

  // Panggil fungsi save untuk update localStorage dan render ulang tabel
  const allCheckedInputs = document.querySelectorAll(
    "#lantaiFilter input:checked"
  );
  const allSelectedValues = Array.from(allCheckedInputs).map((cb) => cb.value);
  saveSelectedFloors(allSelectedValues);
}

function setupLantaiCheckboxes() {
  const container = document.getElementById("lantaiFilter");
  container.innerHTML = "";
  lantaiColumns.forEach((col) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = col;
    const selectedFloors = getSelectedFloors();

    checkbox.checked = selectedFloors.includes(col);
    checkbox.onchange = () => {
      const selected = Array.from(
        document.querySelectorAll("#lantaiFilter input:checked")
      ).map((cb) => cb.value);
      saveSelectedFloors(selected);
    };
    label.appendChild(checkbox);
    label.append(" ", col);
    container.appendChild(label);
  });
}

function selectAllFloors() {
  const checkboxes = document.querySelectorAll(
    "#lantaiFilter input[type='checkbox']"
  );
  checkboxes.forEach((cb) => (cb.checked = true));
  const selected = Array.from(checkboxes).map((cb) => cb.value);
  saveSelectedFloors(selected);
}

function clearAllFloors() {
  const checkboxes = document.querySelectorAll(
    "#lantaiFilter input[type='checkbox']"
  );
  checkboxes.forEach((cb) => (cb.checked = false));
  saveSelectedFloors([]);
}

function initResize(index) {
  return function (e) {
    const th = document.querySelectorAll("th")[index];
    const startX = e.pageX;
    const startWidth = th.offsetWidth;

    function onMouseMove(e) {
      const newWidth = startWidth + (e.pageX - startX);
      th.style.width = newWidth + "px";
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
}

function renderTable() {
  const search = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const selectedFloors = getSelectedFloors();
  const dynamicColumns = ["SKU", "Nama", "Total", ...selectedFloors];
  const thead = document.querySelector("#data-table thead");
  const tbody = document.querySelector("#data-table tbody");

  // Clear and re-render header
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  dynamicColumns.forEach((col, index) => {
    const th = document.createElement("th");
    th.textContent = col;
    th.onclick = () => sortTable(col);

    if (currentSort.column === col) {
      th.classList.add(currentSort.asc ? "sort-asc" : "sort-desc");
    }

    // Add resizer
    const resizer = document.createElement("div");
    resizer.classList.add("resizer");
    resizer.addEventListener("mousedown", initResize(index));
    th.appendChild(resizer);

    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Filter data by tab and search
  let filtered = data.filter((row) => {
    const keyword = `${row["SKU"] ?? ""} ${row["Nama"] ?? ""}`.toLowerCase();
    const tokens = search.trim().split(/\s+/); // Split input by spaces into keywords

    const searchMatch = tokens.every((token) => keyword.includes(token));
    const minusMatch =
      tab !== "minus" ||
      selectedFloors.some((c) => Number(row[c]) < 0) ||
      Number(row["Total"]) < 0;

    return searchMatch && minusMatch;
  });

  // Render rows
  const fragment = document.createDocumentFragment();
  const slice = filtered.slice(renderedRows, renderedRows + batchSize);
  slice.forEach((row) => {
    const tr = document.createElement("tr");
    dynamicColumns.forEach((col) => {
      const td = document.createElement("td");
      let value = row[col];
      if (value === undefined || value === "") value = "-";
      td.textContent = value;

      if (!isNaN(value) && Number(value) < 0)
        td.classList.add("highlight-minus");

      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
  renderedRows += batchSize;
}

function sortTable(column) {
  currentSort.asc = currentSort.column === column ? !currentSort.asc : true;
  currentSort.column = column;

  data.sort((a, b) => {
    let valA = a[column] ?? "";
    let valB = b[column] ?? "";
    return currentSort.asc
      ? valA
          .toString()
          .localeCompare(valB.toString(), undefined, { numeric: true })
      : valB
          .toString()
          .localeCompare(valA.toString(), undefined, { numeric: true });
  });
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = "";
  renderTable();
}

function refreshTable() {
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = "";
  renderTable();
}

const debouncedRefreshTable = debounce(refreshTable, 250);

function onSearchInput() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.querySelector(".clear-button");
  if (input.value.trim() !== "") {
    clearBtn.classList.add("show");
  } else {
    clearBtn.classList.remove("show");
  }
  debouncedRefreshTable();
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  input.value = "";
  onSearchInput(); // hide button
}

async function fetchData() {
  document.getElementById("spinner").style.display = "inline-block";

  const res = await fetch(
    "https://pusatpneumatic.com/pernataan/scripts/stok.json"
  );
  const rawData = await res.json();

  data = (rawData || []).map((item) => {
    const row = {
      SKU: item.s,
      Nama: item.n,
      Harga: item.p,
      Total: item.t,
    };
    item.k.forEach((loc) => {
      row[loc.l] = loc.q;
    });
    return row;
  });

  setupLantaiCheckboxes();
  document.querySelector("#data-table thead").innerHTML = "";
  document.querySelector("#data-table tbody").innerHTML = "";
  renderedRows = 0;
  renderTable();
  document.getElementById("lastUpdated").textContent =
    new Date().toLocaleTimeString("id-ID");
  document.getElementById("spinner").style.display = "none";
}

document.getElementById("tableWrapper").addEventListener("scroll", () => {
  const wrapper = document.getElementById("tableWrapper");
  if (wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 10) {
    renderTable();
  }
});

document
  .getElementById("toggleFilterBtn")
  .addEventListener("click", function () {
    const wrapper = document.querySelector(".filter-wrapper");
    const button = document.getElementById("toggleFilterBtn");
    const isOpen = wrapper.classList.toggle("show");

    button.textContent = (isOpen ? "🔼" : "🔽") + " Filter";
  });

document.getElementById("lastUpdated").addEventListener("click", function () {
  const audio = document.getElementById("easterAudio");
  audio.currentTime = 0;
  audio.play();
});

document.addEventListener("DOMContentLoaded", () => {
  const tableWrapper = document.getElementById("tableWrapper");
  const rocket = document.getElementById("rocketmeluncur");
  let isLaunched = false;

  // Scroll listener
  tableWrapper.addEventListener("scroll", () => {
    if (isLaunched) return; // Jangan munculkan ulang jika sedang launch

    if (tableWrapper.scrollTop > 200) {
      rocket.classList.add("showrocket");
    } else {
      rocket.classList.remove("showrocket");
    }
  });

  // Click to scroll to top
  rocket.addEventListener("click", () => {
    rocket.classList.add("launchrocket");
    const audio = document.getElementById("robloxAudio");
    audio.currentTime = 0;
    audio.play();
    isLaunched = true;

    // Scroll to top
    tableWrapper.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Reset class after animation
    setTimeout(() => {
      rocket.classList.remove("launchrocket");
      rocket.classList.remove("showrocket");
      isLaunched = false;
    }, 800); // harus sesuai dengan durasi transform CSS
  });

  const lantaiHeader = document.getElementById("lantaiHeader");
  const lantaiFilter = document.getElementById("lantaiFilter");
  const toggleIcon = document.getElementById("toggleLantaiIcon");

  if (lantaiHeader) {
    lantaiHeader.addEventListener("click", () => {
      lantaiFilter.classList.toggle("is-collapsed");
      toggleIcon.classList.toggle("is-collapsed");

      const isCollapsed = lantaiFilter.classList.contains("is-collapsed");
      toggleIcon.textContent = isCollapsed ? "🔽" : "🔼";
    });
  }
});

loadSavedTheme();
fetchData();
setInterval(fetchData, 60000);
