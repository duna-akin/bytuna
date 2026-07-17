function Contact() {
  return (
    <section className="section shell">
      <SectionHead cmd="cat contact.txt" id="contact" />
      <div className="contact-card">
        <div className="contact-field">
          <div className="k">email</div>
          <div className="v">
            <a href="mailto:tuna.takin@gmail.com">tuna.takin@gmail.com</a>
          </div>
        </div>
        <div className="contact-field">
          <div className="k">github</div>
          <div className="v">
            <a href="https://github.com/duna-akin">github.com/duna-akin</a>
          </div>
        </div>
        <div className="contact-field">
          <div className="k">based in</div>
          <div className="v dim">PA</div>
        </div>
        <div className="contact-field">
          <div className="k">elsewhere</div>
          <div className="v dim">not on twitter.</div>
        </div>
        <div className="availability">
          <span className="pulse" />
          <span>
            currently <span className="accent">open to new roles</span> and{" "}
            <span className="accent">collaboration</span>
          </span>
        </div>
      </div>
    </section>
  );
}

window.Contact = Contact;
