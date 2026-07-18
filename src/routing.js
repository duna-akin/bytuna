// hash-based routing: the part of the URL after "#" (the fragment) never
// gets sent to the server, so a static host can serve the same index.html
// for every route with zero server config - we just read the fragment
// ourselves and decide what to render.

const HOME_ROUTE = "home";
const PROJECTS_ROUTE = "projects";
const BLOG_ROUTE = "blog";

// pure: turns a raw location.hash string into { page }
function parseHashRoute(hash) {
  const path = hash.replace(/^#\/?/, "");
  if (path === "projects") return { page: PROJECTS_ROUTE };
  if (path === "blog") return { page: BLOG_ROUTE };
  return { page: HOME_ROUTE };
}

// keeps route state in sync with the browser's hash, including
// back/forward navigation (the browser fires "hashchange" for both)
function usePageRoute() {
  const [route, setRoute] = React.useState(() => parseHashRoute(window.location.hash));
  React.useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return route;
}

Object.assign(window, { HOME_ROUTE, PROJECTS_ROUTE, BLOG_ROUTE, parseHashRoute, usePageRoute });
