document.addEventListener("DOMContentLoaded", function () {
  let columnTwo = document.querySelectorAll("tbody tr td:nth-child(2)");
  columnTwo.forEach((item) => {
    item.addEventListener("click", function () {
      const consignmentNumber = item.textContent.trim(); // Extract consignment number from the element's text
      const trackingUrl = `https://www.mulphilog.com/tracking/${consignmentNumber}`;
      window.open(trackingUrl, "_blank"); // Open the URL in a new tab
    });
  });
});

console.log("hello world!");
