// Convert any color (HEX, RGB, HSL, Named) to HEX
function toHex(color) {
  let tempElement = document.createElement("div");
  tempElement.style.color = color;
  document.body.appendChild(tempElement);

  let computedColor = getComputedStyle(tempElement).color;
  document.body.removeChild(tempElement);

  let rgbMatch = computedColor.match(/\d+/g);
  if (rgbMatch && rgbMatch.length === 3) {
    return `#${rgbMatch
      .map((x) => Number(x).toString(16).padStart(2, "0"))
      .join("")}`;
  }
  return null; // Return null if conversion fails
}

// Convert any color to RGB
function toRgb(color) {
  let tempElement = document.createElement("div");
  tempElement.style.color = color;
  document.body.appendChild(tempElement);

  let computedColor = getComputedStyle(tempElement).color;
  document.body.removeChild(tempElement);

  return computedColor; // Returns `rgb(r, g, b)`
}

// Function to update CSS variables & keep inputs in sync
function updateColor(variable, value) {
  let hexValue = toHex(value);
  let rgbValue = toRgb(value);

  if (hexValue) {
    document.documentElement.style.setProperty(`--color-${variable}`, hexValue);
    document.documentElement.style.setProperty(
      `--color-${variable}-rgb`,
      rgbValue.match(/\d+, \d+, \d+/)[0]
    );

    // Update only the related inputs
    document.querySelector(`.theme-input-color[data-var="${variable}"]`).value =
      hexValue;
    document.querySelector(`.theme-input-text[data-var="${variable}"]`).value =
      value;
  }
}

// Event listeners for color pickers
document.querySelectorAll(".theme-input-color").forEach((input) => {
  input.addEventListener("input", function () {
    updateColor(this.dataset.var, this.value);
  });
});

// Event listeners for text inputs (HEX, RGB, HSL, Named)
document.querySelectorAll(".theme-input-text").forEach((input) => {
  input.addEventListener("input", function () {
    let colorValue = this.value.trim();
    if (colorValue) {
      updateColor(this.dataset.var, colorValue);
    }
  });
});
