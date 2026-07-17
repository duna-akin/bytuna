// open/close state lives in Projects, this just renders one row
function ProjectRow({ project: p, isOpen, onToggle }) {
  return (
    <div
      className={`project${isOpen ? " open" : ""}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="project-meta">
        {p.year}
        {p.logo && <img className="proj-logo" src={p.logo} alt="" />}
      </div>
      <div className="project-main">
        <div className="proj-name">
          {p.name}
          {p.star && <span className="star">{p.star}</span>}
          {p.downloads && <span className="star">{p.downloads}</span>}
        </div>
        <div className="proj-blurb">{p.blurb}</div>
        <div className="proj-stack">
          {p.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        {isOpen && (
          <div className="proj-detail">
            {p.detail.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
            <div className="lessons">// {p.lessons}</div>
            <div className="links">
              {p.links.map((l) => (
                <a key={l.label} href={l.href} onClick={(e) => e.stopPropagation()}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="proj-expand">
        <span className="chev">›</span> {isOpen ? "close" : "expand"}
      </div>
    </div>
  );
}

window.ProjectRow = ProjectRow;
