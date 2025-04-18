document.addEventListener("DOMContentLoaded", function () {
  const timerElement = document.getElementById("func-timer");

  if (!timerElement || !timerElement.dataset.updated) return;

  const updateTime = new Date(timerElement.dataset.updated);

  function updateRemainingTime() {
    const currentTime = new Date();
    let remainingMilliseconds = currentTime - updateTime;

    // Prevent negative time
    if (remainingMilliseconds < 0) {
      remainingMilliseconds = 0;
    }

    // Format time
    function formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      if (hours >= 24)
        return `${days}d ${remainingHours}h ${remainingMinutes}m`;
      if (minutes >= 60) return `${hours}h ${remainingMinutes}m ${seconds}s`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    }

    // Update the UI
    timerElement.innerText = formatTime(remainingMilliseconds);
  }

  // Run immediately and update every second
  updateRemainingTime();
  setInterval(updateRemainingTime, 1000);
});
