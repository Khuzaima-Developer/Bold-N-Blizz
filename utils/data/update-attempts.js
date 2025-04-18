document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector("#func-attempts");
  const btn = document.querySelector(".update-data-btn");

  if (!el) {
    console.log("Element with class 'func-attempts' not found.");
    return;
  }

  const timerAttr = el.getAttribute("data-timer");

  if (!timerAttr) {
    console.log("data-timer attribute not found on the element.");
    return;
  }

  const timerTime = new Date(timerAttr).getTime();
  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;

  const diff = now - timerTime;
  let attemptValue = 0;

  if (diff >= twelveHours) {
    attemptValue = Math.floor(diff / twelveHours);
  } else {
    if (btn) btn.disabled = true;
  }

  el.textContent = attemptValue.toString();
});
