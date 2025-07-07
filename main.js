const columnOrder = [
  "SKU", "NAMA", "Grand Total",
  "A12 - 1", "A12 - 2", "A12 - 3", "A12 - 4",
  "A19 - 1", "A19 - 2", "A19 - 3",
  "A20 - 1", "A20 - 3",
  "LTC"
];

const lantaiColumns = columnOrder.slice(3);
let data = [];
let tab = 'all';
let batchSize = 100;
let renderedRows = 0;
let currentSort = { column: null, asc: true };

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

function setTab(value) {
  tab = value;
  document.getElementById("tabAll").classList.remove("active");
  document.getElementById("tabMinus").classList.remove("active");
  document.getElementById("tab" + capitalize(value)).classList.add("active");
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = '';
  renderTable();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSelectedFloors() {
  return JSON.parse(localStorage.getItem("selectedFloors") || JSON.stringify(lantaiColumns));
}

function saveSelectedFloors(selected) {
  localStorage.setItem("selectedFloors", JSON.stringify(selected));
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = '';
  renderTable();
}

function setupLantaiCheckboxes() {
  const container = document.getElementById("lantaiFilter");
  container.innerHTML = '';
  lantaiColumns.forEach(col => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = col;
    checkbox.checked = getSelectedFloors().includes(col);
    checkbox.onchange = () => {
      const selected = Array.from(document.querySelectorAll("#lantaiFilter input:checked"))
                            .map(cb => cb.value);
      saveSelectedFloors(selected);
    };
    label.appendChild(checkbox);
    label.append(" ", col);
    container.appendChild(label);
  });
}

function selectAllFloors() {
  const checkboxes = document.querySelectorAll("#lantaiFilter input[type='checkbox']");
  checkboxes.forEach(cb => cb.checked = true);
  const selected = Array.from(checkboxes).map(cb => cb.value);
  saveSelectedFloors(selected);
}

function clearAllFloors() {
  const checkboxes = document.querySelectorAll("#lantaiFilter input[type='checkbox']");
  checkboxes.forEach(cb => cb.checked = false);
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

function sortTable(column) {
  currentSort.asc = currentSort.column === column ? !currentSort.asc : true;
  currentSort.column = column;
  
  data.sort((a, b) => {
    let valA = a[column] ?? '';
    let valB = b[column] ?? '';
    return currentSort.asc
      ? valA.toString().localeCompare(valB.toString(), undefined, { numeric: true })
      : valB.toString().localeCompare(valA.toString(), undefined, { numeric: true });
  });
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = '';
  renderTable();
}

function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const selectedFloors = getSelectedFloors();
  const dynamicColumns = ["SKU", "NAMA", "Grand Total", ...selectedFloors];
  const thead = document.querySelector("#data-table thead");
  const tbody = document.querySelector("#data-table tbody");

  // Clear and re-render header
  thead.innerHTML = '';
  const headerRow = document.createElement('tr');
  dynamicColumns.forEach((col, index) => {
    const th = document.createElement('th');
    th.textContent = col;
    th.onclick = () => sortTable(col);
    if (currentSort.column === col) {
      th.classList.add(currentSort.asc ? "sort-asc" : "sort-desc");
    }

    // Add resizer
    const resizer = document.createElement('div');
    resizer.classList.add('resizer');
    resizer.addEventListener('mousedown', initResize(index));
    th.appendChild(resizer);

    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Filter data by tab and search
  let filtered = data.filter(row => {
    const keyword = `${row["SKU"] ?? ''} ${row["NAMA"] ?? ''}`.toLowerCase();
    const searchMatch = keyword.includes(search);
    const minusMatch = tab !== 'minus' || selectedFloors.some(c => Number(row[c]) < 0) || Number(row["Grand Total"]) < 0;
    return searchMatch && minusMatch;
  });

  // Render rows
  const fragment = document.createDocumentFragment();
  const slice = filtered.slice(renderedRows, renderedRows + batchSize);
  slice.forEach(row => {
    const tr = document.createElement('tr');
    dynamicColumns.forEach(col => {
      const td = document.createElement('td');
      let value = row[col];
      if (value === undefined || value === "") value = "-";
      td.textContent = value;
      if (!isNaN(value) && Number(value) < 0) td.classList.add("highlight-minus");
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
  renderedRows += batchSize;
}

function refreshTable() {
  renderedRows = 0;
  document.querySelector("#data-table tbody").innerHTML = '';
  renderTable();
}

function onSearchInput() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.querySelector(".clear-button");
  if (input.value.trim() !== "") {
    clearBtn.classList.add("show");
  } else {
    clearBtn.classList.remove("show");
  }
  refreshTable();
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  input.value = "";
  onSearchInput(); // hide button
}

async function fetchData() {
  document.getElementById("spinner").style.display = "inline-block";

  const [stockRes, skuRes] = await Promise.all([
    fetch("https://pernataan-db-default-rtdb.asia-southeast1.firebasedatabase.app/rekap.json"),
    fetch("https://pernataan-db-default-rtdb.asia-southeast1.firebasedatabase.app/sku_master.json")
  ]);
  
  const stockJson = await stockRes.json();
  const skuJson = await skuRes.json();

  const stockData = stockJson || {};
  const skuData = skuJson || {};

  // Merge SKU master with stock
  data = Object.values(skuData).map(item => ({
    ...item,
    ...(stockData[item.SKU] || {}) // fill with stock if any
  }));

  setupLantaiCheckboxes();
  document.querySelector("#data-table thead").innerHTML = '';
  document.querySelector("#data-table tbody").innerHTML = '';
  renderedRows = 0;
  renderTable();
  document.getElementById("lastUpdated").textContent = new Date().toLocaleTimeString('id-ID');
  document.getElementById("spinner").style.display = "none";
}

document.getElementById("tableWrapper").addEventListener("scroll", () => {
  const wrapper = document.getElementById("tableWrapper");
  if (wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 10) {
    renderTable();
  }
});

document.getElementById("toggleFilterBtn").addEventListener("click", function () {
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

loadSavedTheme();
fetchData();
setInterval(fetchData, 60000);