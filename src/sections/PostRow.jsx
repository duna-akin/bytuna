function PostRow({ post: p }) {
  return (
    <a href="#" className="post" onClick={(e) => e.preventDefault()}>
      <div className="post-date">{p.date}</div>
      <div>
        <div className="post-title">{p.title}</div>
        <div className="post-snippet">{p.snippet}</div>
      </div>
      <div className="post-readtime">{p.readtime}</div>
    </a>
  );
}

window.PostRow = PostRow;
