function showWarningBanner(message, project) {
  const banner = document.getElementById("warning-banner");
  const text = document.getElementById("warning-text");
  const barcode = document.getElementById("warning-barcode");

  text.textContent = message;
  banner.classList.remove("hidden");

  // Set project-specific barcode motif
  const lower = String(project || "").toLowerCase();
  if (lower.includes("synqra")) {
    barcode.style.backgroundImage = "url('assets/barcode-horizontal.svg')";
    barcode.style.animationDuration = "6s";
  } else if (lower.includes("noid")) {
    barcode.style.backgroundImage = "url('assets/barcode-circular.svg')";
    barcode.style.animationDuration = "8s";
  } else if (lower.includes("aurafx")) {
    barcode.style.backgroundImage = "url('assets/barcode-vertical.svg')";
    barcode.style.animationDuration = "10s";
  } else {
    barcode.style.backgroundImage = "url('assets/barcode-generic.svg')";
    barcode.style.animationDuration = "6s";
  }
}

