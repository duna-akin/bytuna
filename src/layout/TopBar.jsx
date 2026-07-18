function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#/">
          <span className="accent">bytuna</span>
          <span className="at">@</span>
          <span className="host">online</span>
        </a>
        <nav className="navlinks">
          <a href="#/">
            <span className="hash">/</span>home
          </a>
          <a href="#/projects">
            <span className="hash">/</span>projects
          </a>
          <a href="#/blog">
            <span className="hash">/</span>blog
          </a>
        </nav>
      </div>
    </div>
  );
}

window.TopBar = TopBar;
