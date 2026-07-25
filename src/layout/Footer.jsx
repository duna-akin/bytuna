function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="shell">
      <div className="left">// last updated on july 24, 2026</div>
      <div className="right">
        <span>© {year}</span>
      </div>
    </footer>
  );
}

window.Footer = Footer;
