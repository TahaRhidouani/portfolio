import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import styles from "./style.module.css";

export function SleepText({ visible, direction }: { visible: boolean; direction: "right" | "left" }) {
  const texts = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline>(null);

  useGSAP(
    () => {
      const d = direction === "right" ? 1 : -1;
      const anchors = [
        { x: d * 100, y: -100 },
        { x: d * -50, y: -100 },
        { x: d * 100, y: -200 },
      ];

      timeline.current?.kill();
      timeline.current = gsap.timeline({
        repeat: -1,
      });

      for (let i = 0; i < 3; i++) {
        timeline.current.fromTo(
          ".text-" + (i + 1),
          {
            x: direction === "right" ? 100 : -200,
            y: 0,
            opacity: 0,
          },
          {
            duration: 3,
            ease: "linear",
            motionPath: {
              path: anchors,
              relative: true,
              curviness: 1.5,
            },
          },
          i
        );

        timeline.current.to(
          ".text-" + (i + 1),
          {
            keyframes: {
              "10%": { opacity: 0 },
              "30%": { opacity: 1 },
              "70%": { opacity: 1 },
              "90%": { opacity: 0 },
            },
            duration: 3,
          },
          i
        );
      }
    },
    { scope: texts, dependencies: [direction] }
  );

  useGSAP(() => {
    if (visible) {
      timeline.current?.play(0);
    } else {
      timeline.current?.pause();
    }
  }, [visible]);

  return (
    <div ref={texts} className={styles.sleepText} style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s" }}>
      <h1 className="text-1" style={{ position: "absolute" }}>
        Z
      </h1>
      <h1 className="text-2" style={{ position: "absolute" }}>
        Z
      </h1>
      <h1 className="text-3" style={{ position: "absolute" }}>
        Z
      </h1>
    </div>
  );
}
