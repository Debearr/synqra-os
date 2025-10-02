function showWarningBanner(message, project) {
  const banner = document.getElementById("warning-banner");
  const text = document.getElementById("warning-text");
  const barcode = document.getElementById("warning-barcode");

  text.textContent = message;
  banner.classList.remove("hidden");

  // Get heartbeat speed from global state
  const speed = window.heartbeatSpeed || "medium";
  let duration;
  switch (speed) {
    case "fast": duration = "4s"; break;
    case "slow": duration = "10s"; break;
    default: duration = "6s"; break;
  }

  // Set project-specific barcode motif with heartbeat-synced animation
  const lower = String(project || "").toLowerCase();
  if (lower.includes("synqra")) {
    barcode.style.backgroundImage = "url('assets/barcode-horizontal.svg')";
    barcode.style.animationDuration = duration;
  } else if (lower.includes("noid")) {
    barcode.style.backgroundImage = "url('assets/barcode-circular.svg')";
    barcode.style.animationDuration = duration;
  } else if (lower.includes("aurafx")) {
    barcode.style.backgroundImage = "url('assets/barcode-vertical.svg')";
    barcode.style.animationDuration = duration;
  } else {
    barcode.style.backgroundImage = "url('assets/barcode-generic.svg')";
    barcode.style.animationDuration = duration;
  }
}

