// only matters if a <deck-stage> element is on the page
function readRailVisiblePreference() {
  try {
    return localStorage.getItem('deck-stage.railVisible') !== '0';
  } catch (e) {
    return true;
  }
}

// deck-stage might not have upgraded yet when we mount, so also listen
// for the old __omelette_rail_enabled message as a fallback
function useDeckStageRail() {
  const hasDeckStage = React.useMemo(
    () => typeof document !== 'undefined' && !!document.querySelector('deck-stage'),
    [],
  );
  const [railEnabled, setRailEnabled] = React.useState(
    () => hasDeckStage && !!document.querySelector('deck-stage')?._railEnabled,
  );
  React.useEffect(() => {
    if (!hasDeckStage || railEnabled) return undefined;
    const onMsg = (e) => {
      if (e.data && e.data.type === '__omelette_rail_enabled') setRailEnabled(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasDeckStage, railEnabled]);

  const [railVisible, setRailVisible] = React.useState(readRailVisiblePreference);
  const toggleRail = (on) => {
    setRailVisible(on);
    window.postMessage({ type: '__deck_rail_visible', on }, '*');
  };

  return { hasDeckStage, railEnabled, railVisible, toggleRail };
}

Object.assign(window, { readRailVisiblePreference, useDeckStageRail });
