function clampNumber(n, min, max) {
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

function snapToStep(raw, step) {
  const decimals = (String(step).split('.')[1] || '').length;
  const snapped = Math.round(raw / step) * step;
  return Number(snapped.toFixed(decimals));
}

function useNumberScrub({ value, step, min, max, onChange }) {
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      onChange(clampNumber(snapToStep(raw, step), min, max));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return onScrubStart;
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const onScrubStart = useNumberScrub({ value, step, min, max, onChange });
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clampNumber(Number(e.target.value), min, max))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

Object.assign(window, { clampNumber, snapToStep, useNumberScrub, TweakNumber });
