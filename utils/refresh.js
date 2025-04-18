document.addEventListener("DOMContentLoaded", () => {
  function refreshAfterClassAppears(className) {
    const initialWaited = localStorage.getItem("waitedForRefresh");
    const target = document.querySelector(`.${className}`);

    if (target) {
      if (!initialWaited) {
        console.log("Class found. Waiting for 3 minutes before refreshing...");
        localStorage.setItem("waitedForRefresh", "true");
        localStorage.setItem("lastRefreshTime", Date.now().toString());

        // Wait 3 minutes before first refresh
        setTimeout(() => {
          startRefreshLoop();
        }, 3 * 60 * 1000); // 3 minutes
      } else {
        startRefreshLoop(); // Skip initial wait if already waited
      }
    }

    function startRefreshLoop() {
      console.log("Class still exists. Refreshing...");
      const refreshLoop = setInterval(() => {
        const stillExists = document.querySelector(`.${className}`);
        if (stillExists) {
          // Update refresh time
          localStorage.setItem("lastRefreshTime", Date.now().toString());

          location.reload();
        } else {
          clearInterval(refreshLoop);

          // Clean up storage
          localStorage.removeItem("waitedForRefresh");
          localStorage.removeItem("lastRefreshTime");
        }
      }, 2 * 60 * 1000); // Every 1.5 minutes
    }
  }

  // Usage
  refreshAfterClassAppears("updating-data");
});
