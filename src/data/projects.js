// src/data/projects.js

const PROJECTS = [
  {
    id: "ghostnotes",
    year: "2026",
    name: "ghostnotes v1.0.2",
    logo: "assets/ghostnotes-logo.png",
    blurb: "A CLI that lets you leave personal comments in code without the risk of pushing them to the remote.",
    stack: ["python", "git"],
    star: "★ 5",
    downloads: "↓ 1,739",
    detail: [
      "A pre-commit hook strips any line tagged 'GN:' before it's staged, so your notes stay on disk and never sneak into a commit.",
      "Did it with git's plumbing instead of fighting the index: read the staged blob, write a new one, point the index at it.",
      "Also handles git pull: pulls your notes out first and puts them back after, so they never collide with upstream changes.",
    ],
    lessons:
      "what i learned: the index is just a tree of blobs you can rewrite. once you see that, git stops feeling like magic.",
    links: [
      {
        label: "github →",
        href: "https://github.com/duna-akin/ghostnotes",
      },
      {
        label: "pypi →",
        href: "https://pypi.org/project/ghostnotes/",
      },
    ],
  },
];

window.PROJECTS = PROJECTS;
