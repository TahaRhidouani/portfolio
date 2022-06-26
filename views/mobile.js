// Variables
let jobs, projects, moreprojects, hasScrolled;

init();

document
  .getElementById("face_model")
  .play()
  .catch(() => {
    document.getElementById("face_model_wrapper").innerHTML = `
        <picture id="face_model">
            <source srcset="/assets/3d/memoji.mov" type="video/mp4" codecs="hvc1">
            <img src="/assets/3d/memoji.png">
        </picture>
      `;
  });

document.querySelector("main > div").addEventListener("scroll", () => {
  hasScrolled = true;
  document.getElementById("scroll_tutorial").classList.add("hidden");
});

function init() {
  document.getElementById("age").innerText = getAge("2002/05/22");

  Promise.all([fetch("/jobs"), fetch("/projects"), fetch("/moreprojects")])
    .then(function (responses) {
      return Promise.all(
        responses.map(function (response) {
          return response.json();
        })
      );
    })
    .then(function (data) {
      jobs = data[0];
      let jobsList = document.getElementById("work_list");
      let jobListClasses = ["current", "back", "backback"];
      for (let i = 0; i < jobs.length; i++) {
        jobsList.innerHTML += `
                <div id="${i + 1}" class="work ${i < jobListClasses.length ? jobListClasses[i] : "hidden"}">
                  <h2 class="title">${jobs[i].name}</h2>
                  <h4 class="role">${jobs[i].role}</h4>
                  <h4 class="time">${jobs[i].date}</h4>
                  <img src="assets/data${jobs[i].logo}" />
                </div>`;
      }

      projects = data[1];
      let projectList = document.getElementById("horizontal_list");
      let projectListContent = "";
      for (let id in projects) {
        projectListContent =
          `
            <a href="${projects[id].url}" target="_blank" class="card">
              <video id="project_preview_${id}" playsinline loop muted autoplay>
                <source src="${projects[id].trailer}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
              <div class="text_wrapper">
                  <h2 class="highlight">${projects[id].name}</h2>
                  <h4>${projects[id].description}</h4>
              </div>
              <div class="floor_fade"></div>
            </a>` + projectListContent;
      }

      projectList.innerHTML = projectListContent;

      moreprojects = data[2];
      let moreProjectList = document.getElementById("more_projects");
      let moreProjectListContent = "";
      for (let id in moreprojects) {
        moreProjectListContent =
          `<a href="${moreprojects[id].url}" target="_blank" class="small_card button">
                <h2 class="highlight">${moreprojects[id].name}</h2>
                <h4>${moreprojects[id].description}</h4>
              </a>` + moreProjectListContent;
      }
      moreProjectList.innerHTML = moreProjectListContent;

      // Fade out intro
      setTimeout(() => {
        document.getElementById("intro").classList.add("hidden");
        document.getElementById("face_model_wrapper").classList.remove("hidden");
        document.querySelector("main").classList.remove("hidden");

        setTimeout(() => {
          if (!hasScrolled) document.getElementById("scroll_tutorial").classList.remove("hidden");
        }, 4000);
      }, 800);
    });
}

function getAge(b) {
  var birthday = new Date(b);
  let difference = Date.now() - birthday.getTime();
  let ageDate = new Date(difference);

  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

let workIndex = 1;
let totalWork = 5;
let upDisabled = false;
let downDisabled = false;

function jobUp() {
  if (upDisabled) return;
  if (workIndex == 2) document.getElementById("up_arrow").classList.add("hidden");

  workIndex--;

  document.getElementById("down_arrow").classList.remove("hidden");

  upDisabled = true;
  setTimeout(() => (upDisabled = false), 300);

  document.getElementById(workIndex)?.classList.add("current");
  document.getElementById(workIndex)?.classList.remove("forward");

  document.getElementById(workIndex + 1)?.classList.add("back");
  document.getElementById(workIndex + 1)?.classList.remove("current");

  document.getElementById(workIndex + 2)?.classList.add("backback");
  document.getElementById(workIndex + 2)?.classList.remove("back");

  document.getElementById(workIndex + 3)?.classList.add("hidden");
  document.getElementById(workIndex + 3)?.classList.remove("backback");
}

function jobDown() {
  if (downDisabled) return;
  if (workIndex == totalWork - 1) document.getElementById("down_arrow").classList.add("hidden");

  document.getElementById("up_arrow").classList.remove("hidden");

  downDisabled = true;
  setTimeout(() => (downDisabled = false), 300);

  document.getElementById(workIndex)?.classList.remove("current");
  document.getElementById(workIndex)?.classList.add("forward");

  document.getElementById(workIndex + 1)?.classList.remove("back");
  document.getElementById(workIndex + 1)?.classList.add("current");

  document.getElementById(workIndex + 2)?.classList.remove("backback");
  document.getElementById(workIndex + 2)?.classList.add("back");

  document.getElementById(workIndex + 3)?.classList.remove("hidden");
  document.getElementById(workIndex + 3)?.classList.add("backback");

  workIndex++;
}
