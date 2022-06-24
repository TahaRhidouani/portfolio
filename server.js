const express = require("express");
const app = express();
const userAgent = require("express-useragent");
const path = require("path");
const fs = require("fs");
const md = require("markdown-it")({
  html: true,
  xhtmlOut: true,
});

const PORT = process.env.PORT || 8080;

let projects = {};
let moreProjects = {};

const blacklistedProjects = [];

let headers = new Headers();
headers.set("Authorization", "Basic " + Buffer.from("tahainc:" + fs.readFileSync("github-api", "utf8")).toString("base64"));

app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  let ua = userAgent.parse(req.headers["user-agent"]);

  if (ua.isMobile) {
    res.sendFile(path.join(__dirname, "/views/mobile.html"));
  } else {
    res.sendFile(path.join(__dirname, "/views/regular.html"));
  }
});

app.get("/jobs", (req, res) => {
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "jobs.json"));
});

app.get("/projects", (req, res) => {
  res.send(projects);
});

app.get("/moreprojects", (req, res) => {
  res.send(moreProjects);
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

refreshProjects();
setInterval(refreshProjects, 3600000); // Refresh projects every hour

function refreshProjects() {
  fetch("https://api.github.com/users/tahainc/starred?sort=created", { headers: headers })
    .then((response) => response.json())
    .then((data) => {
      projects = {};
      let starredIds = [];

      for (let p of data) {
        starredIds.push(p.id);
        let url = p.html_url.split("/")[4];
        let name = p.name
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        if (blacklistedProjects.includes(name)) continue;

        fetch("https://raw.githubusercontent.com/TahaInc/" + url + "/master/README.md", { headers: headers })
          .then((response) => response.text())
          .then((project) => {
            projects[p.id] = { name: name, description: p.description ?? "", trailer: "https://raw.githubusercontent.com/TahaInc/" + url + "/master/images/trailer.mp4", url: p.html_url, demo: p.homepage, html: md.render(project) };
          });
      }

      fetch("https://api.github.com/users/tahainc/repos?sort=created", { headers: headers })
        .then((response) => response.json())
        .then((data) => {
          moreProjects = {};
          let jobs = JSON.parse(fs.readFileSync("jobs.json", "utf8"));
          let jobProjects = jobs.map((job) => job.name.toLowerCase());

          for (let p of data) {
            let name = p.name
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            if (!starredIds.includes(p.id) && !jobProjects.includes(name.toLowerCase()) && !blacklistedProjects.includes(name)) {
              moreProjects[p.id] = { name: name, description: p.description ?? "", url: p.html_url };
            }
          }
        });
    });
}
