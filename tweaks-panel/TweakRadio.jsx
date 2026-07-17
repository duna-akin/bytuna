function normalizeRadioOptions(options) {
  return options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
}

function radioOptionLabelLength(option) {
  return String(typeof option === 'object' ? option.label : option).length;
}

// panel's only ~280px wide, so past 2-3 short options the segments get
// too cramped and it looks bad - just use a dropdown instead
function radioFitsAsSegments(options) {
  const maxLen = options.reduce((m, o) => Math.max(m, radioOptionLabelLength(o)), 0);
  return maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
}

// <select> always gives back a string, so map it back to the real value
// (could be a number or bool) to match what the segment version returns
function resolveRadioSelectValue(options, raw) {
  const match = options.find((o) => String(typeof o === 'object' ? o.value : o) === raw);
  if (match === undefined) return raw;
  return typeof match === 'object' ? match.value : match;
}

function radioSegmentValueAt(trackEl, clientX, opts) {
  const r = trackEl.getBoundingClientRect();
  const inner = r.width - 4;
  const i = Math.floor(((clientX - r.left - 2) / inner) * opts.length);
  return opts[Math.max(0, Math.min(opts.length - 1, i))].value;
}

// value is stashed in a ref so the move handler always checks against
// the latest value instead of whatever it was when the drag started
function useRadioSegmentDrag({ trackRef, opts, value, onChange }) {
  const [dragging, setDragging] = React.useState(false);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = radioSegmentValueAt(trackRef.current, e.clientX, opts);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = radioSegmentValueAt(trackRef.current, ev.clientX, opts);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return { dragging, onPointerDown };
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);

  if (!radioFitsAsSegments(options)) {
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolveRadioSelectValue(options, s))} />;
  }

  const opts = normalizeRadioOptions(options);
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const { dragging, onPointerDown } = useRadioSegmentDrag({ trackRef, opts, value, onChange });

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${opts.length})`,
                      width: `calc((100% - 4px) / ${opts.length})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

Object.assign(window, {
  normalizeRadioOptions, radioOptionLabelLength, radioFitsAsSegments,
  resolveRadioSelectValue, radioSegmentValueAt, useRadioSegmentDrag, TweakRadio,
});
