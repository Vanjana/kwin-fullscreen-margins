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

function applyMaximizedMargin(window) {
  if (isExcludedWindow(window) || window._fullscreenMarginChanging) {
    return;
  }

  const maximizeArea = workspace.clientArea(KWin.MaximizeArea, window);
  const isMaximizedGeometry =
    window.width >= maximizeArea.width - 2 &&
    window.height >= maximizeArea.height - 2;

  if (!isMaximizedGeometry) {
    return;
  }

  window._fullscreenMarginChanging = true;
  debug("Maximiert erkannt: " + window.caption);
  window.setMaximize(false, false);
  window.frameGeometry = {
    x: maximizeArea.x + MARGIN_LEFT,
    y: maximizeArea.y + MARGIN_TOP,
    width: Math.max(1, maximizeArea.width - MARGIN_LEFT - MARGIN_RIGHT),
    height: Math.max(1, maximizeArea.height - MARGIN_TOP - MARGIN_BOTTOM),
  };

  window._fullscreenMarginChanging = false;
  debug("64 px Rand gesetzt: " + window.caption);
}

function watchWindow(window) {
  if (isExcludedWindow(window)) {
    return;
  }

  window.maximizedChanged.connect(function () {
    applyMaximizedMargin(window);
  });

  window.fullScreenChanged.connect(function () {
    debug("Vollbild geändert: " + window.fullScreen + " / " + window.caption);
    if (window.fullScreen) {
      window.setMaximize(false, false);
      window.frameGeometry = workspace.clientArea(KWin.FullScreenArea, window);
    }
  });

  applyMaximizedMargin(window);
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
