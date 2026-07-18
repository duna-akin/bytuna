function Projects() {
  const [openId, setOpenId] = React.useState(null);
  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <section className="section shell">
      <SectionHead cmd="ls projects/" />
      <div className="projects">
        {PROJECTS.map((p) => (
          <ProjectRow
            key={p.id}
            project={p}
            isOpen={openId === p.id}
            onToggle={() => toggle(p.id)}
          />
        ))}
      </div>
    </section>
  );
}

window.Projects = Projects;
