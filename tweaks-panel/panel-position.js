// drag-to-move for the panel, keeps it from going off screen
const TWK_PANEL_PAD = 16;

function clampOffsetToViewport(offset, panel) {
  const w = panel.offsetWidth, h = panel.offsetHeight;
  const maxRight = Math.max(TWK_PANEL_PAD, window.innerWidth - w - TWK_PANEL_PAD);
  const maxBottom = Math.max(TWK_PANEL_PAD, window.innerHeight - h - TWK_PANEL_PAD);
  return {
    x: Math.min(maxRight, Math.max(TWK_PANEL_PAD, offset.x)),
    y: Math.min(maxBottom, Math.max(TWK_PANEL_PAD, offset.y)),
  };
}

// active = only bother with resize/observe listeners while panel is open
function useDraggablePosition(active) {
  const panelRef = React.useRef(null);
  const offsetRef = React.useRef({ x: TWK_PANEL_PAD, y: TWK_PANEL_PAD });
  const [position, setPosition] = React.useState(offsetRef.current);

  const clampToViewport = React.useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    offsetRef.current = clampOffsetToViewport(offsetRef.current, panel);
    setPosition(offsetRef.current);
  }, []);

  React.useEffect(() => {
    if (!active) return undefined;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [active, clampToViewport]);

  const onDragStart = (e) => {
    const panel = panelRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return { panelRef, position, onDragStart };
}

Object.assign(window, { clampOffsetToViewport, useDraggablePosition });
