document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector(".table");

  const tbody = table.querySelector("tbody");
  const headers = [...document.querySelectorAll("th.th-datatable")].slice(1); // Skip Sr. No column
  let arrowIcon;

  headers.forEach((header) => {
    header.classList.add("click-th");
  });

  // Add event listeners to sortable headers
  headers.forEach((header, index) => {
    header.addEventListener("click", () => {
      sortTableByColumn(table, index + 1, header); // Skip Sr. No (column 0)
      header.classList.add("bg-color");
    });
  });

  function sortTableByColumn(table, columnIndex, header) {
    const tbody = table.querySelector("tbody");
    if (!tbody) {
      console.error("tbody not found!");
      return;
    }

    const rows = Array.from(tbody.querySelectorAll("tr"));
    const isAscending =
      !header.dataset.sortOrder || header.dataset.sortOrder === "desc";

    // Sort rows based on the clicked column (skip Sr. No column)
    rows.sort((rowA, rowB) => {
      const cellA = rowA.children[columnIndex].textContent.trim();
      const cellB = rowB.children[columnIndex].textContent.trim();
      const isNumeric = !isNaN(cellA) && !isNaN(cellB);

      return isNumeric
        ? isAscending
          ? parseFloat(cellA) - parseFloat(cellB)
          : parseFloat(cellB) - parseFloat(cellA)
        : isAscending
        ? cellA.localeCompare(cellB)
        : cellB.localeCompare(cellA);
    });

    // Create the arrow icon dynamically
    arrowIcon = document.createElement("i");

    // Update sort order (ascending or descending)
    headers.forEach((h) => {
      h.removeAttribute("data-sort-order");
      const icon = h.querySelector("i");
      if (icon) icon.remove(); // Remove old arrow icon
      h.classList.remove("bg-color");
    });

    if (isAscending) {
      arrowIcon.classList.add("fa", "fa-arrow-up", "click-arrow");
    } else {
      arrowIcon.classList.add("fa", "fa-arrow-down", "click-arrow");
    }

    header.appendChild(arrowIcon);
    header.dataset.sortOrder = isAscending ? "asc" : "desc";

    // Rebuild the table rows
    tbody.innerHTML = "";
    rows.forEach((row, index) => {
      // Set the "Sr. No" dynamically to reflect row position (1, 2, 3, etc.)
      row.children[0].textContent = index + 1; // This ensures Sr. No matches the row index

      // Append the sorted row
      tbody.appendChild(row);
    });
  }
});
