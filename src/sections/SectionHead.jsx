function SectionHead({ cmd }) {
  return (
    <div className="section-head">
      <span className="prompt">$</span>
      <span className="cmd">{cmd}</span>
      <span className="rule" />
    </div>
  );
}

window.SectionHead = SectionHead;
