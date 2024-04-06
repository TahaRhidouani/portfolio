import { AnimationStateContext } from "@/components/Face";
import { useGSAP } from "@gsap/react";
import { useLenis } from "@studio-freight/react-lenis";
import gsap from "gsap";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import styles from "@/components/Homepage/style.module.css";
import MagneticButton from "@/components/MagneticButton";
import { MaskTextAuto } from "@/components/MaskText";
import { formatTextToHtml } from "@/lib/formatText";
import { Achievements as AchievementsType, Jobs as JobsType, Projects as ProjectsType } from "@/types";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMediaQuery } from "usehooks-ts";
import HorizontalBanner from "../AchievementsBanner";
import ContactList from "../ContactList";
import CardStack from "../JobCards";
import { Card, CardFullscreen, CardProvider } from "../ProjectsCard";
import ProjectsList from "../ProjectsList";
import Shapes from "../Shapes";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export type Align = "right" | "left";

export function Name({ position, resume, align = "right" }: { position: string; resume: string; align?: Align }) {
  const [showResume, setShowResume] = useState<boolean>(false);

  const { setShowGlasses } = useContext(AnimationStateContext);

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const ref = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.set(ref.current, { pointerEvents: showResume ? "all" : "none" });
    gsap.set(backgroundRef.current, { opacity: showResume ? 1 : 0 });
    gsap.set(childrenRef.current, {
      x: isMobile ? 0 : showResume ? "0" : "100vw",
      y: isMobile ? (showResume ? "0" : "100vh") : 0,
      xPercent: isMobile ? 0 : 50,
      yPercent: isMobile ? 0 : -50,
    });
  }, [isMobile]);

  useGSAP(() => {
    gsap.set(ref.current, { pointerEvents: showResume ? "all" : "none" });
    gsap.to(backgroundRef.current, { opacity: showResume ? 1 : 0, duration: 0.5 });
    gsap.to(childrenRef.current, {
      x: isMobile ? 0 : showResume ? "0" : "100vw",
      y: isMobile ? (showResume ? "0" : "100vh") : 0,
      duration: 0.5,
      ease: "back.out(0.5)",
    });
  }, [showResume, isMobile]);

  useLenis(
    ({ scroll }) => {
      const scrollProgress = scroll / innerHeight;

      if (scrollProgress > 0.6 && showResume) {
        setShowResume(false);
        setShowGlasses!(false);
      }
    },
    [showResume]
  );

  return (
    <>
      <div
        className={styles.section}
        style={{
          width: "60vw",
          marginBottom: "50vh",
          paddingRight: align === "left" ? "40vw" : "unset",
          right: align === "right" ? 0 : "unset",
          paddingLeft: align === "right" ? "40vw" : "unset",
        }}
      >
        <h1 className={styles.center}>Taha Rhidouani</h1>
        <h2 className={styles.center + " " + "secondary"}>{position}</h2>

        {resume && (
          <div style={{ marginTop: "5%" }}>
            <MagneticButton
              padding={"15px 40px"}
              borderRadius={"10px"}
              onClick={() => {
                setShowResume(true);
                setShowGlasses!(true);
              }}
            >
              View Resume
            </MagneticButton>
          </div>
        )}

        <Shapes />
      </div>

      {resume && (
        <div ref={ref} className={styles.spotlightSection}>
          <div ref={childrenRef} className={styles.spotlightContent}>
            <div className={styles.resume}>
              <Document file={"data:application/pdf;base64," + resume} loading={"Loading resume..."}>
                <Page pageNumber={1} height={isMobile ? innerHeight * 0.5 : Math.min(innerHeight - 200, 1000)} />
              </Document>
            </div>
          </div>
          <div
            onClick={() => {
              setShowResume(false);
              setShowGlasses!(false);
            }}
            ref={backgroundRef}
            className={styles.spotlightBackground}
          />
        </div>
      )}

      <div className={styles.megaBlob} />
    </>
  );
}

export function AboutMe({ text, align = "left" }: { text: string; align?: Align }) {
  const aboutMeRef = useRef<HTMLHeadingElement>(null);

  return (
    <div
      className={styles.section}
      style={{
        width: "60vw",
        paddingRight: align === "left" ? "40vw" : "unset",
        right: align === "right" ? 0 : "unset",
        paddingLeft: align === "right" ? "40vw" : "unset",
      }}
    >
      <MaskTextAuto duration={0.8} style={{ marginBottom: "3%" }}>
        <h1 ref={aboutMeRef} className={styles.center}>
          About Me
        </h1>
      </MaskTextAuto>

      <h3 className={styles.aboutMeText}>
        {formatTextToHtml(text).map((html, i) => (
          <MaskTextAuto key={i} triggerRef={aboutMeRef} delay={0.01 * i} style={{ display: "inline-flex" }} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </h3>

      <div className={styles.blob} />
    </div>
  );
}

export function Jobs({ jobs, align = "right" }: { jobs: JobsType; align?: Align }) {
  return (
    <div
      className={styles.section}
      style={{
        width: "60vw",
        marginBottom: "50vh",
        paddingRight: align === "left" ? "40vw" : "unset",
        right: align === "right" ? 0 : "unset",
        paddingLeft: align === "right" ? "40vw" : "unset",
      }}
    >
      <MaskTextAuto duration={0.8} style={{ marginBottom: "3%" }}>
        <h1 className={styles.center}>Work Experience</h1>
      </MaskTextAuto>

      <CardStack data={jobs} />

      <div className={styles.blob} />
    </div>
  );
}

export function SelectedProjects({ projects }: { projects: ProjectsType }) {
  const projectFullscreenRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  useGSAP(() => {
    if (!isMobile) {
      const h = cardListRef.current!.clientWidth;

      gsap.fromTo(
        cardListRef.current,
        {
          x: "-" + 1.5 * h + "px",
        },
        {
          x: h + innerWidth / 2 + "px",
          ease: "none",
          scrollTrigger: {
            id: "selectedProjectCards",
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        titleRef.current,
        {
          x: "-10vw",
        },
        {
          x: "10vw",
          ease: "none",
          scrollTrigger: {
            id: "selectedProjectTitle",
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }
      );
    } else {
      ScrollTrigger.getById("selectedProjectCards")?.kill();
      ScrollTrigger.getById("selectedProjectTitle")?.kill();
      ScrollTrigger.refresh();
      gsap.set([cardListRef.current, titleRef.current], { x: 0 });
    }
  }, [isMobile]);

  return (
    <CardProvider fullscreenRef={projectFullscreenRef}>
      <div
        className={styles.section}
        style={{
          width: "100vw",
          height: "auto",
        }}
      >
        <div ref={containerRef} className={styles.horizontalContainer}>
          <div className={styles.horizontal}>
            <div ref={titleRef}>
              <MaskTextAuto duration={1}>
                <h1 style={{ textAlign: "center", marginBottom: "50px" }}>Selected Projects</h1>
              </MaskTextAuto>
            </div>

            <div ref={cardListRef} className={styles.selectedProjectsWrapper}>
              <div className={styles.selectedProjects}>
                {projects.map((project, i) => (
                  <Card key={i} data={project} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {isMobile && <div className={styles.blob} />}
      </div>

      <CardFullscreen ref={projectFullscreenRef} />
    </CardProvider>
  );
}

export function OtherProjects({ projects, githubUsername, align = "left" }: { projects: ProjectsType; githubUsername: string; align?: Align }) {
  return (
    <div
      className={styles.section}
      style={{
        width: "60vw",
        paddingRight: align === "left" ? "40vw" : "unset",
        right: align === "right" ? 0 : "unset",
        paddingLeft: align === "right" ? "40vw" : "unset",
      }}
    >
      <MaskTextAuto duration={0.8} style={{ marginBottom: "3%" }}>
        <h1 className={styles.center}>More Projects</h1>
      </MaskTextAuto>

      <ProjectsList githubUsername={githubUsername} data={projects} />

      <div className={styles.blob} />
    </div>
  );
}

export function Achievements({ achievements, align = "right" }: { achievements: AchievementsType; align?: Align }) {
  const [splitAchievements, setSplitAchievements] = useState<AchievementsType[]>([]);

  useEffect(() => {
    const shuffledArray = achievements.sort(() => Math.random() - 0.5);

    const midpoint = Math.floor(shuffledArray.length / 2);

    const a = shuffledArray.slice(0, midpoint);
    const b = shuffledArray.slice(midpoint);

    setSplitAchievements([a, b]);
  }, [achievements]);

  return (
    <div
      className={styles.section}
      style={{
        width: "60vw",
        paddingRight: align === "left" ? "40vw" : "unset",
        right: align === "right" ? 0 : "unset",
        paddingLeft: align === "right" ? "40vw" : "unset",
      }}
    >
      <h1 className={styles.center} style={{ marginBottom: "3%" }}>
        Achievements
      </h1>

      {splitAchievements.map((a, i) => (
        <HorizontalBanner key={i} data={a} direction={i % 2 == 0 ? "right" : "left"} />
      ))}

      <div className={styles.blob} />
    </div>
  );
}

export function Contact({ githubUsername, align = "left" }: { githubUsername: string; align?: Align }) {
  return (
    <div
      className={styles.section}
      style={{
        width: "60vw",
        paddingRight: align === "left" ? "40vw" : "unset",
        right: align === "right" ? 0 : "unset",
        paddingLeft: align === "right" ? "40vw" : "unset",
      }}
    >
      <MaskTextAuto duration={0.8} style={{ marginBottom: "3%" }}>
        <h1 className={styles.center}>Get In Touch</h1>
      </MaskTextAuto>

      <ContactList
        data={[
          {
            icon: "/assets/icons/github.png",
            name: "Github",
            hover: "View profile",
            url: "https://github.com/" + githubUsername,
          },
          {
            icon: "/assets/icons/linkedin.png",
            name: "LinkedIn",
            hover: "View profile",
            url: "https://www.linkedin.com/in/taha-rhidouani",
          },
          {
            icon: "/assets/icons/email.png",
            name: "Email",
            hover: "Send email",
            url: "mailto:taharhidouani@gmail.com",
          },
        ]}
      />

      <div className={styles.blob} />
    </div>
  );
}
