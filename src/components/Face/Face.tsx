import { AnimationStateContext } from "@/components/Face/AnimationStateContext";
import { Model } from "@/components/Face/Model";
import { useGSAP } from "@gsap/react";
import { Float } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { useLenis } from "@studio-freight/react-lenis";
import { gsap } from "gsap";
import { Suspense, useContext, useEffect, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";
import styles from "./style.module.css";

export function Face() {
  const { lastMoved } = useContext(AnimationStateContext);

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const ref = useRef<HTMLDivElement>(null);
  const offset = useRef<number>(isMobile ? 50 : 20);

  const scrollData = [
    [0, 20],
    [0.6, 20],
    [1.2, 80],
    [1.8, 80],
    [2.2, 20],
    [2.8, 20],
    [3, 50],
    [4.2, 120],
    [4.2, -20],
    [4.8, -20],
    [5.8, 80],
    [6.4, 80],
    [6.8, 20],
    [7.2, 20],
    [7.8, 80],
    [10, 80],
  ];

  const scrollRange = scrollData.map((item) => item[0]);
  const positionRange = scrollData.map((item) => item[1]);

  useLenis(
    ({ scroll }) => {
      if (scroll !== 0) lastMoved!.current = Date.now();

      if (!isMobile) {
        const scrollProgress = scroll / innerHeight;

        let scrollIndex = scrollRange.length - 1;
        for (const [index, value] of scrollRange.entries()) {
          if (value > scrollProgress) {
            scrollIndex = index;
            break;
          }
        }

        const diffScroll = scrollRange[scrollIndex] - scrollRange[scrollIndex - 1];
        const diffPosition = positionRange[scrollIndex] - positionRange[scrollIndex - 1];
        const normalizedProgress = (scrollProgress - scrollRange[scrollIndex - 1]) / diffScroll;

        offset.current = positionRange[scrollIndex - 1] + diffPosition * normalizedProgress;
        updateOffset(offset.current);
      } else {
        offset.current = 50;
      }
    },
    [isMobile]
  );

  const { contextSafe } = useGSAP(() => {
    gsap.fromTo(
      ref.current,
      {
        x: isMobile ? "0%" : offset.current > 50 ? "100%" : "-100%",
        y: isMobile ? "-100%" : "0%",
      },
      {
        x: "0%",
        y: "0%",
        scrollTrigger: {
          trigger: ref.current,
        },
        delay: 0.2,
        duration: 1.3,
        ease: "back.inOut(0.8)",
      }
    );
  }, [isMobile]);

  const updateOffset = contextSafe((offset: number) => {
    gsap.quickSetter(ref.current, "left", "%")(offset);
  });

  useEffect(() => {
    window.addEventListener("touchstart", updateLastMoved);

    function updateLastMoved() {
      lastMoved!.current = Date.now();
    }

    return () => {
      window.removeEventListener("touchstart", updateLastMoved);
    };
  }, [lastMoved]);

  return (
    <div ref={ref} className={styles.model} style={{ left: offset + "%", transform: "translateX(-50%)" }}>
      <Canvas style={{ pointerEvents: "none" }}>
        <Suspense>
          <Float rotationIntensity={isMobile ? 2 : 0} floatIntensity={isMobile ? 2 : 1} speed={2}>
            <Model offset={offset} />
          </Float>
          <EffectComposer>
            <N8AO halfRes color="black" aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
          </EffectComposer>
        </Suspense>
        <ambientLight intensity={2} color={"white"} />
      </Canvas>
    </div>
  );
}
