// src/data/projects.js

const PROJECTS = [
  {
    id: "ghostnotes",
    year: "2026",
    name: "ghostnotes v1.0.2",
    logo: "assets/ghostnotes-logo.png",
    blurb: "A CLI that lets you leave personal comments in code without the risk of pushing them to the remote. Built it because I was embarrassed of some of the notes I was leaving for myself on collaborative projects.",
    stack: ["python", "git"],
    star: "★ 6",
    downloads: "↓ 1,739",
    detail: [
      "Installs a pre-commit hook that strips lines tagged with GN: from staged files. It only touches the git index, so your notes stay on disk but never make it into a commit.",
      "Got there by going through git's plumbing: git show :file to read the staged blob, hash-object to write a new one, update-index --cacheinfo to point the index at it.",
      "Also wrote a pull flow that pulls your notes out before a git pull and puts them back after, so upstream changes don't conflict with your annotations.",
    ],
    lessons:
      "what i learned: git's porcelain commands are a thin layer over a much more interesting set of plumbing commands. once you see the index as just a tree of blobs you can rewrite, a lot of git stops feeling like magic.",
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
