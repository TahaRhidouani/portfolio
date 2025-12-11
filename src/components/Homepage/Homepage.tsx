"use client";
import gsap from "gsap";
import { Flip } from "gsap/all";
import MotionPath from "gsap/MotionPathPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import styles from "./style.module.css";

import Cursor from "@/components/Cursor";
import { AnimationStateProvider, Face } from "@/components/Face";
import { AboutMe, Achievements, Contact, Jobs, Name, OtherProjects, SelectedProjects } from "@/components/Homepage/Sections";
import { Data } from "@/types";
import { useGSAP } from "@gsap/react";
import { ReactLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";

gsap.registerPlugin(ScrollTrigger, Flip, MotionPath, useGSAP);

export function Homepage({ data }: { data: Data }) {
  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  ScrollTrigger.config({ ignoreMobileResize: true });

  const lenisRef = useRef<any>(null);
  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
    };
  });

  return (
    <ReactLenis ref={lenisRef} autoRaf={false} root>
      <AnimationStateProvider>
        <div className={styles.face}>
          <Face />
        </div>

        {!isMobile && (
          <div className={styles.noise} style={{ width: "calc(100vw - " + (window.innerWidth - document.documentElement.clientWidth) + "px)" }} />
        )}

        <div className={styles.background} />

        {!isMobile && <Cursor />}

        <Name position={data.position} resumeExists={data.resumeExists} />

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
