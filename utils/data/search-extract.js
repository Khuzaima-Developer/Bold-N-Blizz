document.addEventListener("DOMContentLoaded", () => {
  // Get the search input elements by class
  const searchInputs = document.querySelectorAll(".table-search");

  // Get the table body (rows to be filtered)
  const tbody = document.querySelector(".table tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  // Get all <th> elements to determine column index
  const headerColumns = Array.from(
    document.querySelectorAll(".table thead td")
  );

  // Listen for input changes on each search field
  searchInputs.forEach((input) => {
    input.addEventListener("input", () => {
      filterTable();
    });
  });

  // Function to filter the table based on search input
  function filterTable() {
    const filteredRows = rows.filter((row, rowIndex) => {
      return Array.from(searchInputs).every((input, inputIndex) => {
        const filterValue = input.value.toLowerCase().trim();

        if (!filterValue) {
          return true; // Skip empty filters
        }

        // Find the corresponding column index of the input
        const columnIndex = headerColumns.findIndex((th) => th.contains(input));

        if (columnIndex === -1) {
          console.log("  Column index not found! Skipping...");
          return true;
        }

        const cell = row.children[columnIndex]; // Get the cell in the correct column
        if (!cell) {
          return false;
        }

        const cellValue = cell.textContent.toLowerCase().trim();

        const match = cellValue.includes(filterValue);

        return match; // Check if cell contains the input value
      });
    });

    // Update the table with filtered rows
    updateTable(filteredRows);
  }

  // Function to update the table with filtered rows
  function updateTable(filteredRows) {
    // Clear the table body
    tbody.innerHTML = "";

    // Rebuild the table with the filtered rows
    filteredRows.forEach((row, index) => {
      // Set the "Sr. No" dynamically to reflect row position (1, 2, 3, etc.)
      row.children[0].textContent = index + 1; // This ensures Sr. No matches the row index

      // Append the row to the table body
      tbody.appendChild(row);
    });
  }
});
