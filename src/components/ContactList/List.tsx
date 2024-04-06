import styles from "./style.module.css";
import React, { useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useMediaQuery } from "usehooks-ts";

export type Contact = {
  icon: string;
  name: string;
  hover: string;
  url: string;
};

export function List({ data }: { data: Contact[] }) {
  const container = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={container} className={styles.entriesWrapper}>
      {data.map((contact, i) => (
        <Entry key={i} contact={contact} />
      ))}
    </div>
  );
}

export function Entry({ contact }: { contact: Contact }) {
  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const content = useRef<HTMLAnchorElement>(null);
  const timeline = useRef<gsap.core.Timeline>();

  const { contextSafe } = useGSAP(
    () => {
      if (isMobile) {
        gsap.set("." + styles.icon, { x: 0 });
        gsap.set("." + styles.title, { x: 0 });
        gsap.set("." + styles.arrow, { clearProps: "invert() brightness(0.3)" });
      }
    },
    { scope: content, dependencies: [isMobile] }
  );

  const toggle = contextSafe((hover: boolean) => {
    if (!isMobile) {
      timeline.current?.kill();
      timeline.current = gsap.timeline();

      timeline.current.to(
        "." + styles.icon,
        {
          x: hover ? 0 : -100,
          ease: "expo.out",
          duration: 0.6,
        },
        "start"
      );

      timeline.current.to(
        "." + styles.title,
        {
          x: hover ? 0 : -100,
          ease: "expo.out",
          duration: 0.6,
        },
        "start"
      );

      timeline.current.to(
        "." + styles.arrow,
        {
          filter: hover ? "invert() brightness(1)" : "invert() brightness(0.3)",
          duration: 0.4,
        },
        "start"
      );
    }
  });

  return (
    <a
      ref={content}
      className={styles.entry}
      href={contact.url}
      target="_blank"
      onMouseEnter={() => toggle(true)}
      onMouseLeave={() => toggle(false)}
      data-cursor-size="100px"
      data-cursor-text={contact.hover}
      data-smile-animation={true}
    >
      <Image src={contact.icon} alt={contact.name + " logo"} height={100} width={100} className={styles.icon} />
      <h3 className={styles.title}>{contact.name}</h3>
      <Image src={"/assets/icons/diagonal-arrow.png"} alt={"Arrow"} height={100} width={100} className={styles.arrow} />
    </a>
  );
}
