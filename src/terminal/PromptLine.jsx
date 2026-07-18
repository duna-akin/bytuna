function PromptLine({ cmd }) {
  return (
    <div className="line prompt-line">
      <span className="user">bytuna</span>
      <span className="at">@</span>
      <span className="host">online</span>
      <span className="dollar">$</span>
      <span className="cmd">{cmd}</span>
    </div>
  );
}

window.PromptLine = PromptLine;
