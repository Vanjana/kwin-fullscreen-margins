// KWin 6 script: Maximierte Fenster lassen konfigurierbare Ränder frei.
const MARGIN_TOP = readConfig("marginTop", 16);
const MARGIN_BOTTOM = readConfig("marginBottom", 24);
const MARGIN_LEFT = readConfig("marginLeft", 16);
const MARGIN_RIGHT = readConfig("marginRight", 16);

function debug(message) {
  print("fullscreen-margin: " + message);
}

function isExcludedWindow(window) {
  return (
    !window ||
    !window.managed ||
    window.specialWindow ||
    window.desktopWindow ||
    window.dock ||
    window.popupWindow ||
    window.menu ||
    window.dropdownMenu ||
    window.tooltip ||
    window.notification ||
    window.onScreenDisplay ||
    window.splash ||
    window.caption === "plasmashell"
  );
}

function marginGeometry(area) {
  return {
    x: area.x + MARGIN_LEFT,
    y: area.y + MARGIN_TOP,
    width: Math.max(1, area.width - MARGIN_LEFT - MARGIN_RIGHT),
    height: Math.max(1, area.height - MARGIN_TOP - MARGIN_BOTTOM),
  };
}

function applyMaximizedMargin(window) {
  if (
    isExcludedWindow(window) ||
    window.fullScreen ||
    window._fullscreenMarginChanging
  ) {
    return;
  }

  const maximizeArea = workspace.clientArea(KWin.MaximizeArea, window);

  window._fullscreenMarginChanging = true;
  try {
    debug("Maximiert erkannt: " + window.caption);

    // A maximized window owns its geometry. Release that state before
    // assigning the smaller geometry, otherwise KWin can overwrite it.
    window.setMaximize(false, false);
    window.frameGeometry = marginGeometry(maximizeArea);
  } finally {
    window._fullscreenMarginChanging = false;
  }
}

function watchWindow(window) {
  if (isExcludedWindow(window)) {
    return;
  }

  window.maximizedAboutToChange.connect(function (mode) {
    // MaximizeFull is 3. Do not treat horizontal/vertical maximization as
    // a full-screen-sized window.
    window._fullscreenMarginPendingMaximize = mode === 3;
  });

  window.maximizedChanged.connect(function () {
    if (window._fullscreenMarginPendingMaximize) {
      window._fullscreenMarginPendingMaximize = false;
      applyMaximizedMargin(window);
    }
  });

  window.fullScreenChanged.connect(function () {
    debug("Vollbild geändert: " + window.fullScreen + " / " + window.caption);
  });

}

function toggleFullscreen() {
  const window = workspace.activeWindow;
  if (!isExcludedWindow(window) && window.fullScreenable) {
    window.fullScreen = !window.fullScreen;
    debug("F11: Vollbild=" + window.fullScreen + " / " + window.caption);
  }
}

workspace.stackingOrder.forEach(watchWindow);
workspace.windowAdded.connect(watchWindow);
const shortcutRegistered = registerShortcut(
  "fullscreen-margin-toggle",
  "Vollbild umschalten",
  "F11",
  toggleFullscreen,
);
debug("F11 registriert: " + shortcutRegistered);

debug(
  "Skript gestartet: oben=" +
    MARGIN_TOP +
    ", unten=" +
    MARGIN_BOTTOM +
    ", links=" +
    MARGIN_LEFT +
    ", rechts=" +
    MARGIN_RIGHT,
);
