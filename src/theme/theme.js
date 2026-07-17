function computeThemeVars(tweaks) {
  const gridOn = tweaks.textureMode === "grid" || tweaks.textureMode === "both";
  const scanOn = tweaks.textureMode === "scan" || tweaks.textureMode === "both";
  return {
    "--accent-h": tweaks.accentHue,
    "--grid-alpha": gridOn ? 0.04 : 0,
    "--scan-alpha": scanOn ? tweaks.scanIntensity / 1000 : 0,
  };
}

function useApplyThemeVars(tweaks) {
  React.useEffect(() => {
    const root = document.documentElement;
    const vars = computeThemeVars(tweaks);
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
  }, [tweaks.accentHue, tweaks.textureMode, tweaks.scanIntensity]);
}

Object.assign(window, { computeThemeVars, useApplyThemeVars });
