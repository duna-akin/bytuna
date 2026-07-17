function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="shell">
      <div className="left">// last updated on july 17, 2026</div>
      <div className="right">
        <a href="#top">back to top ↑</a>
        <span>© {year}</span>
      </div>
    </footer>
  );
}

window.Footer = Footer;
