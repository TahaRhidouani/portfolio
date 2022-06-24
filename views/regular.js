// Variables
let scroll = new LocomotiveScroll({ el: document.querySelector("body"), smooth: true, getDirection: true, multiplier: 1, tablet: { smooth: true }, smartphone: { smooth: true } });
let jobs, projects, moreprojects, sectionProgress, hasScrolled, target, container, cursor, scene, camera, renderer, vector, object, mixer, action, clips, clock, timer, smiling, lastEvent;
let mouse = { x: 0, y: 0 };
let noiseCanvas = document.getElementById("noise").getContext("2d");

scroll.stop();
init();

scroll.on("scroll", (event) => {
  let totalProgress = event.scroll.y / window.innerHeight;
  let sectionNumber = Math.floor(totalProgress);

  if (hasScrolled) document.getElementById("scroll_tutorial").classList.add("hidden");

  if (event.direction === "down") closeResume();

  if (sectionNumber % 2 != 0) {
    sectionProgress = 1 - (totalProgress - sectionNumber);
  } else {
    sectionProgress = totalProgress - sectionNumber;
  }

  if (sectionProgress <= 0.3 || sectionProgress >= 0.7) {
    sectionProgress = Math.round(sectionProgress);
  } else {
    sectionProgress = (sectionProgress - 0.3) * (10 / 4);
  }

  if (sectionNumber >= 2 && sectionNumber <= 3) {
    let progress = (event.scroll.y - 2 * window.innerHeight) / (2 * window.innerHeight);

    document.querySelector(".c-scrollbar").style.opacity = 0;
    document.getElementById("project_scrollhandle").style.width = progress * 100 + "%";
    document.getElementById("horizontal_list").style.left = 80 - progress * (document.getElementById("horizontal_list").offsetWidth - window.innerWidth * 0.6) + "px";

    sectionProgress = 0;
  } else {
    document.querySelector(".c-scrollbar").style.opacity = 1;

    if (sectionNumber < 2) {
      document.getElementById("project_scrollhandle").style.width = "0%";
      document.getElementById("horizontal_list").style.left = "80px";
    }

    if (sectionNumber > 3) {
      document.getElementById("project_scrollhandle").style.width = "100%";
      document.getElementById("horizontal_list").style.left = 80 - (document.getElementById("horizontal_list").offsetWidth - window.innerWidth * 0.6) + "px";
    }
  }

  container.style.left = sectionProgress * 60 + "%";
  moveHead();
});

function init() {
  target = new THREE.Vector3();
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);

  container = document.getElementById("face_model");
  cursor = document.getElementById("cursor");

  document.getElementById("age").innerText = getAge("2002/05/22");

  camera.position.set(0, 0, 5);
  camera.lookAt(scene.position);
  scene.add(camera);
  scene.add(new THREE.AmbientLight(0xffffff));
  renderer.setPixelRatio(window.devicePixelRatio);

  new THREE.GLTFLoader().load("assets/3d/profil.gltf", (head) => {
    mixer = new THREE.AnimationMixer(head.scene);

    object = head.scene;
    object.position.set(0, 0, 0);
    scene.add(object);
    clips = head.animations;
    container.appendChild(renderer.domElement);

    calculatePerpective();
    animate();
    scroll.update();
    noise(noiseCanvas);

    // Load responsive data (projects & jobs)
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
              <div class="button_wrapper small smile" onclick="openWork(${i})">
                  <a class="button small hide">More info</a>
              </div>
              <img src="assets/data${jobs[i].logo}" />
            </div>`;
        }

        projects = data[1];
        let projectList = document.getElementById("horizontal_list");
        let projectListContent = "";
        for (let id in projects) {
          let regex = /<img src=\\?["']([^">]+)["']/g;
          while ((match = regex.exec(projects[id].html))) {
            preloadImage(match[1]);
          }

          projectListContent =
            `
          <div class="card smile focus" onclick="openProject(${id})">
            <video playsinline loop muted autoplay>
                <source src="${projects[id].trailer}" type="video/mp4">
            </video>
            <div class="text_wrapper">
                <h2 class="highlight">${projects[id].name}</h2>
                <h4>${projects[id].description}</h4>
            </div>
            <div class="floor_fade"></div>
          </div>` + projectListContent;
        }
        projectList.innerHTML = projectListContent;

        moreprojects = data[2];
        let moreProjectList = document.getElementById("more_projects");
        let moreProjectListContent = "";
        for (let id in moreprojects) {
          moreProjectListContent =
            `<a href="${moreprojects[id].url}" target="_blank" class="small_card button focus smile">
              <h2 class="highlight">${moreprojects[id].name}</h2>
              <h4>${moreprojects[id].description}</h4>
            </a>` + moreProjectListContent;
        }
        moreProjectList.innerHTML = moreProjectListContent;

        // Event listeners
        window.addEventListener("mousemove", moveHead, false);

        window.addEventListener("resize", calculatePerpective);

        document.addEventListener("wheel", () => {
          hasScrolled = true;
          moveHead();
        });

        document.querySelectorAll(".smile").forEach((element) => {
          element.addEventListener("mouseenter", smile);
          element.addEventListener("mouseleave", idle);
        });

        document.querySelectorAll(".focus").forEach((element) => {
          element.addEventListener("mouseenter", () => cursor.classList.add("zoom"));
          element.addEventListener("mouseleave", () => cursor.classList.remove("zoom"));
        });

        document.querySelectorAll(".hide").forEach((element) => {
          element.addEventListener("mouseenter", () => cursor.classList.add("hidden"));
          element.addEventListener("mouseleave", () => cursor.classList.remove("hidden"));
        });

        document.querySelectorAll(".button_wrapper").forEach(magnetizeButtons);

        // Fade out intro
        scroll.start();
        document.getElementById("intro").classList.add("hidden");
        document.getElementById("face_model").classList.remove("hidden");
        document.querySelector(".section:nth-child(1)").classList.remove("hidden");
        smile();
        setTimeout(idle, 1000);
        setTimeout(() => {
          if (!hasScrolled) document.getElementById("scroll_tutorial").classList.remove("hidden");
        }, 8000);
      });
  });
}

function moveHead(event = lastEvent) {
  if (event == undefined) return;

  cursor.style.left = event.clientX + "px";
  cursor.style.top = event.clientY + "px";

  mouse.x = (event.clientX / window.innerWidth) * 2 - (sectionProgress ? sectionProgress : 0) * 2;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1.2;

  lastEvent = event;
}

function calculatePerpective() {
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  size = 1 + container.offsetWidth / 2000;
  object.scale.set(size, size, size);

  calculateNoiseSize();
}

function smile() {
  if (smiling) return;
  if (action) action.stop();

  action = mixer.clipAction(clips[1]);
  action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  action.play();
  smiling = true;
}

function idle() {
  if (timer) window.clearTimeout(timer);

  timer = window.setTimeout(() => {
    if (document.querySelectorAll(".smile:hover").length > 0) return;
    if (action) action.stop();

    action = mixer.clipAction(clips[0]);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
    smiling = false;
  }, 500);
}

function animate() {
  target.x += (mouse.x - target.x) * 0.25;
  target.y += (mouse.y - target.y) * 0.25;
  vector = new THREE.Vector3(target.x, target.y, 0.9);
  vector.unproject(camera);

  if (document.visibilityState == "visible") noise(noiseCanvas);

  if (object) object.lookAt(vector);

  requestAnimationFrame(animate);
  render();
}

function render() {
  if (mixer) mixer.update(clock.getDelta());

  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene, camera);
}

function calculateNoiseSize() {
  let canvas = document.getElementById("noise");
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
}

function noise(noiseCanvas) {
  let image = noiseCanvas.createImageData(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
  let imageData = new Uint32Array(image.data.buffer);
  let imageLength = imageData.length;

  for (let i = 0; i < imageLength / 5; i += 1) imageData[Math.floor(Math.random() * imageLength)] = 0xffffffff;

  noiseCanvas.putImageData(image, 0, 0);
}

function getAge(b) {
  var birthday = new Date(b);
  let difference = Date.now() - birthday.getTime();
  let ageDate = new Date(difference);

  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function closeResume() {
  document.getElementById("main_info").classList.remove("hidden");
  document.getElementById("pdf_wrapper").classList.add("hidden");
  document.getElementById("scroll_tutorial").classList.remove("invisible");
}

function viewResume() {
  document.getElementById("main_info").classList.add("hidden");
  document.getElementById("pdf_wrapper").classList.remove("hidden");
  document.getElementById("scroll_tutorial").classList.add("invisible");
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

function openWork(id) {
  document.getElementById("work_wrapper").classList.add("hidden");
  setTimeout(() => document.getElementById("work_title").classList.add("hidden"), 50);
  setTimeout(() => document.getElementById("work_page").classList.remove("hidden"), 100);

  document.querySelector("#work_general_info > div > .title").innerHTML = jobs[id].name;
  document.querySelector("#work_general_info > div > .role").innerHTML = jobs[id].role;
  document.querySelector("#work_general_info > div > .time").innerHTML = jobs[id].date;

  if (jobs[id].github) {
    document.querySelector("#work_page > div.buttons > div:nth-child(1)").classList.remove("hidden");
    document.querySelector("#work_page > div.buttons > div:nth-child(1) > .button").href = jobs[id].github;
  }

  if (jobs[id].demo) {
    document.querySelector("#work_page > div.buttons > div:nth-child(2)").classList.remove("hidden");
    document.querySelector("#work_page > div.buttons > div:nth-child(2) > .button").href = jobs[id].demo;
  }

  if (jobs[id].image) {
    document.querySelector("#work_picture > img").src = "/assets/data" + jobs[id].image;
    document.getElementById("work_picture").classList.remove("hidden");
  }

  let jobDescriptions = "";
  for (let description of jobs[id].description) jobDescriptions += "<li>" + description + "</li>";
  document.querySelector("#work_page > .description").innerHTML = jobDescriptions;

  document.getElementById("project_information").scrollTo(0, 0);
}

function closeWork() {
  document.getElementById("work_wrapper").classList.remove("hidden");
  setTimeout(() => document.getElementById("work_title").classList.remove("hidden"), 50);
  document.getElementById("work_page").classList.add("hidden");
  document.getElementById("work_picture").classList.add("hidden");
  document.querySelector("#work_page > div.buttons > div:nth-child(1)").classList.add("hidden");
  document.querySelector("#work_page > div.buttons > div:nth-child(2)").classList.add("hidden");
}

function openProject(id) {
  scroll.stop();
  document.getElementById("project_information").innerHTML = projects[id].html;

  document.querySelector("#project_page_trailer > source").src = projects[id].trailer;
  let video = document.getElementById("project_page_trailer");
  video.load();

  video.addEventListener(
    "loadeddata",
    function () {
      setTimeout(() => video.classList.remove("hidden"), 1000);
      video.play();
    },
    false
  );

  let githubButton = document.createElement("div");
  githubButton.classList.add("buttons", "hide");
  githubButton.innerHTML += "<div class='button_wrapper'><a class='button hide' id='project_link' onmouseenter='cursor.classList.add(\"hidden\")' onmouseleave='cursor.classList.remove(\"hidden\")' target='_blank' href='" + projects[id].url + "'>View in Github</a></div>";
  if (projects[id].demo) githubButton.innerHTML += "<div class='button_wrapper'><a class='button hide' id='project_link' onmouseenter='cursor.classList.add(\"hidden\")' onmouseleave='cursor.classList.remove(\"hidden\")' target='_blank' href='" + projects[id].demo + "'>View Demo</a></div>";
  document.querySelector("#project_information > h1").parentNode.insertBefore(githubButton, document.querySelector("#project_information > h1").nextSibling);

  document.querySelectorAll(".buttons > .button_wrapper").forEach(magnetizeButtons);

  document.getElementById("secondary_panel").classList.remove("hidden");
  setTimeout(() => document.getElementById("main_panel").classList.remove("hidden"), 100);
}

function closeProject() {
  scroll.start();
  document.getElementById("project_page_trailer").classList.add("hidden");
  document.getElementById("main_panel").classList.add("hidden");
  setTimeout(() => document.getElementById("secondary_panel").classList.add("hidden"), 100);
}

function magnetizeButtons(element) {
  element.addEventListener("mousemove", (event) => {
    cursor.classList.add("hidden");
    const position = element.getBoundingClientRect();
    const x = event.pageX - position.left - position.width / 2;
    const y = event.pageY - position.top - position.height / 2;
    element.children[0].style.transform = "translate(" + x * 0.1 + "px, " + y * 0.3 + "px) scale(1.1)";
  });
  element.addEventListener("mouseenter", (event) => {
    const position = element.getBoundingClientRect();
    const x = event.pageX - position.left - position.width / 2;
    const y = event.pageY - position.top - position.height / 2;
    element.children[0].style.transform = "translate(" + x * 0.1 + "px, " + y * 0.3 + "px) scale(1.1)";
  });
  element.addEventListener("mouseleave", () => {
    cursor.classList.remove("hidden");
    element.children[0].style.transform = "translate(0px, 0px) scale(1)";
  });
}

function preloadImage(src) {
  new Promise(() => {
    const image = new Image();
    image.src = src;
  });
}
