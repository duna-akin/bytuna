function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="accent">bytuna</span>
          <span className="at">@</span>
          <span className="host">online</span>
        </div>
        <nav className="navlinks">
          <a href="#projects">
            <span className="hash">/</span>projects
          </a>
          <a href="#blog">
            <span className="hash">/</span>blog
          </a>
          <a href="#contact">
            <span className="hash">/</span>contact
          </a>
        </nav>
      </div>
    </div>
  );
}

window.TopBar = TopBar;
