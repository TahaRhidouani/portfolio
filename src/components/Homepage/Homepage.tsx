"use client";

import gsap from "gsap";
import Flip from "gsap/Flip";
import MotionPath from "gsap/MotionPathPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./style.module.css";

import Cursor from "@/components/Cursor";
import { AnimationStateProvider, Face } from "@/components/Face";
import { AboutMe, Achievements, Contact, Jobs, Name, OtherProjects, SelectedProjects } from "@/components/Homepage/Sections";
import { Data } from "@/types";
import { ReactLenis } from "@studio-freight/react-lenis";
import { useMediaQuery } from "usehooks-ts";

gsap.registerPlugin(ScrollTrigger, Flip, MotionPath);

export function Homepage({ data }: { data: Data }) {
  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  ScrollTrigger.config({ ignoreMobileResize: true });

  return (
    <ReactLenis root>
      <AnimationStateProvider>
        <div className={styles.face}>
          <Face />
        </div>

        {!isMobile && <div className={styles.noise} style={{ width: "calc(100vw - " + (window.innerWidth - document.documentElement.clientWidth) + "px)" }}></div>}

        <div className={styles.background}></div>

        {!isMobile && <Cursor />}

        <Name position={data.position} resume={data.resume} />

        <AboutMe text={data.about} />

        <Jobs jobs={data.jobs} />

        <SelectedProjects projects={data.projects.selected} />

        <OtherProjects githubUsername={data.githubUsername} projects={data.projects.other} />

        {data.achievements.length > 0 && <Achievements achievements={data.achievements} />}

        <Contact githubUsername={data.githubUsername} align={data.achievements.length > 0 ? "left" : "right"} />
      </AnimationStateProvider>
    </ReactLenis>
  );
}
