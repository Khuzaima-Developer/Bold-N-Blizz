document.addEventListener("DOMContentLoaded", function () {
  let columnTwo = document.querySelectorAll("tbody tr td:nth-child(2)");
  columnTwo.forEach((item) => {
    item.addEventListener("click", function () {
      const consignmentNumber = item.textContent.trim(); // Extract consignment number from the element's text
      window.open(`${trackingUrl}/${consignmentNumber}`, "_blank"); // Open the URL in a new tab
    });
  });
});
