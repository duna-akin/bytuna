function Blog() {
  return (
    <section className="section shell">
      <SectionHead cmd="cat blog/index.md" id="blog" />
      <div className="posts">
        {POSTS.map((p) => (
          <PostRow key={p.title} post={p} />
        ))}
      </div>
    </section>
  );
}

window.Blog = Blog;
