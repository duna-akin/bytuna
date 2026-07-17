// lets callers do setTweak('key', val) or setTweak({ key: val }) - normalize
// to the object form so we don't save a "[object Object]" key by mistake
function normalizeTweakEdits(keyOrEdits, val) {
  return typeof keyOrEdits === 'object' && keyOrEdits !== null
    ? keyOrEdits : { [keyOrEdits]: val };
}

// postMessage only reaches the host, not other code in this window,
// so fire a normal event too for anything listening locally
function broadcastTweakEdits(edits) {
  window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
}

function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = normalizeTweakEdits(keyOrEdits, val);
    setValues((prev) => ({ ...prev, ...edits }));
    broadcastTweakEdits(edits);
  }, []);
  return [values, setTweak];
}

Object.assign(window, { normalizeTweakEdits, broadcastTweakEdits, useTweaks });
