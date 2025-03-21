document.addEventListener("DOMContentLoaded", () => {
  const cardTable = document.querySelector(".card-table");
  const table = document.querySelector(".table");
  const noDataMessage = document.querySelector(".no-data");
  const noDataText = document.querySelector(".no-data_text");
  const currentPath = window.location.pathname;

  if (noDataText) {
    if (currentPath === "/orders/bookings") {
      noDataText.textContent = "No Bookings orders";
    } else if (currentPath === "/orders/returns") {
      noDataText.textContent = "No Returns";
    } else if (currentPath === "/orders/delivers") {
      noDataText.textContent = "No Delivered orders";
    } else if (currentPath === "/orders/undelivers") {
      noDataText.textContent = "No Undelivered orders";
    } else if (currentPath === "/orders/daily-updates") {
      noDataText.textContent = "No Daily Updates";
    }else {
      noDataMessage.style.display = "none";
    }
  }

  if (!cardTable || !table) {
    console.error("Required elements (table or card table) are missing.");
    displayNoDataMessage();
    return;
  }

  const tbody = table.querySelector("tbody");

  if (!tbody) {
    console.error("Table body element not found.");
    displayNoDataMessage();
    return;
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const allRowsEmpty =
    rows.length === 0 ||
    rows.every((row) =>
      Array.from(row.children).every((td) => td.textContent.trim() === "")
    );

  if (allRowsEmpty) {
    displayNoDataMessage();
    return;
  }

  function displayNoDataMessage() {
    if (cardTable) cardTable.remove();
    if (noDataMessage) noDataMessage.classList.remove("d-none");
  }
});

console.log("Script executed successfully.");
