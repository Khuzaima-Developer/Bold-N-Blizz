async function clearQsrPage(page) {
  await page.evaluate(() => {
    if (window.gc) window.gc();

    document.body.style.zoom = "0.2";
    window.scrollBy(0, window.innerHeight);

    const allowedTags = [
      "body.sidebar-gone",
      "div#root",
      "div#app",
      "div.main-wrapper",
      "div.main-content",
      "section.section",
      "div.card",
      "div.row.pb-2",
      "div.col",
      "label",
      "input.form-control",
      "button.btn.btn-primary",
      "div.row.mt-3.pb-2",
      "div.col-12",
      "div.table-responsive",
      "table.table.table-bordered",
      "tbody",
      "tr",
      "td",
      "span",
      "select.form-select",
      "ul.pagination",
      "li.page-item",
      "a.page-link",
      "div.justify-content-center",
      "div.justify-content-center div",
      "div.justify-content-center ul.pagination",
      "div.justify-content-center li.page-item",
      "div.justify-content-center a.page-link",
      "div.justify-content-center div[style]",
    ];

    // Remove all elements that are NOT in the allowed list
    document.body.querySelectorAll("*").forEach((el) => {
      if (!allowedTags.some((selector) => el.matches(selector))) {
        el.remove();
      }
    });

    // Remove <thead> elements
    document.querySelectorAll("thead").forEach((el) => el.remove());

    // Remove first <tr> in each <tbody>
    document.querySelectorAll("tbody").forEach((tbody) => {
      const firstRow = tbody.querySelector("tr");
      if (firstRow) firstRow.remove();
    });

    console.clear();
  });
}

module.exports = { clearQsrPage };
