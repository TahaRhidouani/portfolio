import { Project, Projects } from "@/types";
import styles from "./style.module.css";
import MagneticButton from "@/components/MagneticButton";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useMediaQuery } from "usehooks-ts";

export function List({ data, githubUsername }: { data: Projects; githubUsername: string }) {
  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const container = useRef<HTMLDivElement>(null);
  const [maxEntries, setMaxEntries] = useState<number>(data.length);

  useGSAP(
    () => {
      gsap.fromTo(
        "." + styles.entry,
        {
          y: "20vh",
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          delay: 0.3,
          duration: 0.3,
          scrollTrigger: container.current,
          stagger: 0.05,
          onComplete: () => {
            gsap.set("." + styles.entry, { clearProps: "all" });
          },
        }
      );
    },
    { scope: container }
  );

  useEffect(() => {
    const handleResize = () => {
      setMaxEntries(Math.floor(Math.max(0, isMobile ? window.screen.height * 0.6 - 200 : innerHeight - 300) / (isMobile ? 100 : 150)));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  return (
    <div ref={container} className={styles.entriesWrapper}>
      {data.slice(0, maxEntries).map((project, i) => (
        <Entry key={i} project={project} />
      ))}

      <div className={styles.entry} style={{ padding: "50px" }}>
        <MagneticButton padding={"10px 40px"} borderRadius={"10px"} href={"https://github.com/" + githubUsername + "?tab=repositories"}>
          View All
        </MagneticButton>
      </div>
    </div>
  );
}

export function Entry({ project }: { project: Project }) {
  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const content = useRef<HTMLAnchorElement>(null);
  const timeline = useRef<gsap.core.Timeline>();
  const { contextSafe } = useGSAP({ scope: content, dependencies: [isMobile] });

  const toggle = contextSafe((hover: boolean) => {
    if (!isMobile && project.images.length > 0) {
      timeline.current?.kill();
      timeline.current = gsap.timeline();

      timeline.current.to(
        content.current,
        {
          backgroundColor: hover ? "rgba(255, 255, 255, 0.2)" : "transparent",
          duration: 0.3,
        },
        "start"
      );

      timeline.current.to(
        "." + styles.title,
        {
          opacity: hover ? 0.5 : 1,
          duration: 0.3,
        },
        "start"
      );

      timeline.current.to(
        "." + styles.description,
        {
          opacity: hover ? 0 : 1,
          duration: 0.3,
        },
        "start"
      );

      timeline.current.to(
        "." + styles.image,
        {
          opacity: hover ? 1 : 0,
          scale: hover ? 1 : 0.7,
          transformOrigin: hover ? "100% 50%" : "50% 50%",
          duration: 0.5,
          ease: "power4.out",
          stagger: {
            each: hover ? 0.15 / project.images.length : 0,
            from: "end",
          },
        },
        "start"
      );
    }
  });

  return (
    <a
      ref={content}
      className={styles.entry}
      href={project.repoUrl}
      target="_blank"
      onMouseEnter={() => toggle(true)}
      onMouseLeave={() => toggle(false)}
      data-cursor-size="100px"
      data-cursor-text="More info"
      data-smile-animation={true}
    >
      <h3 className={styles.title}>{project.name}</h3>
      <div className={styles.contentWrapper}>
        <div className={styles.imageWrapper}>
          {project.images.map((image, i) => (
            <Image key={i} alt={project.name + " screenshot " + (i + 1)} height={100} width={200} src={image} className={styles.image} />
          ))}
        </div>
        <h5 className={styles.description}>{project.description}</h5>
      </div>
    </a>
  );
}
