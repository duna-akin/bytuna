// hero terminal — finished session, not a typewriter
function renderTerminalOutput(result) {
  switch (result.kind) {
    case "help":
      return (
        <span className="out dim">
          available: <span className="out">{TERMINAL_HELP_TEXT}</span>
        </span>
      );
    case "whoami":
      return <span className="out">tuna akin, junior tech enthusiast</span>;
    case "ls":
      return (
        <span className="out">
          <span className="k">drwxr-xr-x</span> projects/{" "}
          <span className="k">drwxr-xr-x</span> blog/{" "}
          <span className="k">drwxr-xr-x</span> contact/
        </span>
      );
    case "about":
      return (
        <span className="out dim">
          Pennsylvania. Senior in college. Currently interning for Merck and
          developing a venture. Open to collaboration
        </span>
      );
    case "contact":
      return (
        <span className="out">
          scroll down, or:{" "}
          <a href="mailto:tuna.takin@gmail.com" style={{ color: "var(--accent)" }}>
            tuna.takin@gmail.com
          </a>
        </span>
      );
    case "sudo":
      return (
        <span className="out dim">
          Permission denied. You're not in the sudoers file.
        </span>
      );
    default:
      return (
        <span className="out dim">
          command not found: {result.input} — try <span className="out">help</span>
        </span>
      );
  }
}

function Hero() {
  const [showInputCursor, setShowInputCursor] = React.useState(true);
  const [cmd, setCmd] = React.useState("");
  const [history, setHistory] = React.useState([]);
  const inputRef = React.useRef(null);

  function runCommand(raw) {
    const result = resolveTerminalCommand(raw);
    if (!result) return;
    if (result.kind === "clear") {
      setHistory([]);
      setCmd("");
      return;
    }
    setHistory((h) => [...h, { cmd: raw, out: renderTerminalOutput(result) }]);
    setCmd("");
  }

  function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(cmd);
    }
  }

  return (
    <section className="hero shell" id="top">
      <div className="terminal" role="region" aria-label="terminal hero">
        <div className="terminal-titlebar">
          <div className="dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <span className="path">tuna@akin — ~/portfolio — zsh — 88×24</span>
          <span className="meta">v1.1</span>
        </div>
        <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
          <PromptLine cmd="whoami" />
          <div className="line out">tuna akin, junior tech enthusiast</div>
          <div className="blank" />

          <PromptLine
            cmd={
              <>
                cat <span className="flag">about.md</span>
              </>
            }
          />
          <div className="line out">
            Based in Pennsylvania. Senior in college. Currently
          </div>
          <div className="line out">
            interning at Merck and building my own venture.
          </div>
          <div className="line out">
            hit me up if you want to collaborate or talk
          </div>
          <div className="blank" />
          <div className="line out dim">
            I like coding, well-named things, and ideas that
          </div>
          <div className="line out dim">
            surpasses the person who initially thought of them
          </div>
          <div className="blank" />

          <PromptLine
            cmd={
              <>
                ls <span className="flag">-la</span>
              </>
            }
          />
          <div className="line out">
            <span className="k">drwxr-xr-x</span>{" "}
            <span style={{ color: "var(--accent)" }}>projects/</span>
            things i built / building
          </div>
          <div className="line out">
            <span className="k">drwxr-xr-x</span>{" "}
            <span style={{ color: "var(--accent)" }}>blog/</span> notes-to-self,
            posted in public; currently none
          </div>
          <div className="line out">
            <span className="k">drwxr-xr-x</span>{" "}
            <span style={{ color: "var(--accent)" }}>contact/</span> email +
            socials
          </div>
          <div className="blank" />

          {history.map((h, i) => (
            <React.Fragment key={i}>
              <PromptLine cmd={h.cmd} />
              <div className="line">{h.out}</div>
              <div className="blank" />
            </React.Fragment>
          ))}

          <div className="prompt-input-row">
            <span className="prompt-line">
              <span className="user">tuna</span>
              <span className="at">@</span>
              <span className="host">akin</span>
              <span className="dollar">$</span>
            </span>
            <input
              ref={inputRef}
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setShowInputCursor(false)}
              onBlur={() => setShowInputCursor(true)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="terminal input"
            />
            {showInputCursor && cmd === "" && (
              <span className="cursor" aria-hidden="true" />
            )}
            <span className="hint">try: help</span>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { renderTerminalOutput, Hero });
