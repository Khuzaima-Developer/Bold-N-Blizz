document.addEventListener("DOMContentLoaded", () => {
  // Get the search input elements by class
  const searchInputs = document.querySelectorAll(".table-search");

  // Get the table body (rows to be filtered)
  const tbody = document.querySelector(".table tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  // Listen for input changes on each search field
  searchInputs.forEach((input) => {
    input.addEventListener("input", filterTable);
  });

  // Function to filter the table based on search input
  function filterTable() {
    const consignmentFilter = searchInputs[0].value.toLowerCase();
    const customerFilter = searchInputs[1].value.toLowerCase();
    const codFilter = searchInputs[2].value.toLowerCase();

    const filteredRows = rows.filter((row) => {
      const consignmentNumber = row.children[1].textContent.toLowerCase();
      const customerName = row.children[2].textContent.toLowerCase();
      const codAmount = row.children[3].textContent.toLowerCase();

      // Check if the row matches the search criteria
      const matchesConsignment = consignmentNumber.includes(consignmentFilter);
      const matchesCustomer = customerName.includes(customerFilter);
      const matchesCOD = codAmount.includes(codFilter);

      return matchesConsignment && matchesCustomer && matchesCOD;
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
