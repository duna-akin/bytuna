function SectionHead({ cmd, id }) {
  return (
    <div className="section-head" id={id}>
      <span className="prompt">$</span>
      <span className="cmd">{cmd}</span>
      <span className="rule" />
    </div>
  );
}

window.SectionHead = SectionHead;
