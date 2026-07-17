function TweaksPanel({ title = 'Tweaks', noDeckControls = false, children }) {
  const { open, dismiss } = useEditModeProtocol();
  const { panelRef, position, onDragStart } = useDraggablePosition(open);
  const { hasDeckStage, railEnabled, railVisible, toggleRail } = useDeckStageRail();

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={panelRef} className="twk-panel" data-noncommentable=""
           style={{ right: position.x, bottom: position.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
          {hasDeckStage && railEnabled && !noDeckControls && (
            <TweakSection label="Deck">
              <TweakToggle label="Thumbnail rail" value={railVisible} onChange={toggleRail} />
            </TweakSection>
          )}
        </div>
      </div>
    </>
  );
}

window.TweaksPanel = TweaksPanel;
