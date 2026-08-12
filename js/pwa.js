if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" })
      .catch(error => console.warn("Service Worker registration failed:", error));
  });
}
