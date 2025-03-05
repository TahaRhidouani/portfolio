import { AnimationStateContext } from "@/components/Face/AnimationStateContext";
import { Model } from "@/components/Face/Model";
import { useGSAP } from "@gsap/react";
import { Float, PerformanceMonitor, useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import { Suspense, useContext, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import styles from "./style.module.css";

export function Face() {
  const { lastMoved } = useContext(AnimationStateContext);
  const progress = useProgress();

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const ref = useRef<HTMLDivElement>(null);
  const offset = useRef<number | null>(null);
  const introDone = useRef<boolean>(false);

  const scrollData = [
    [0, -25],
    [0.6, -25],
    [1.2, 25],
    [1.8, 25],
    [2.2, -25],
    [2.8, -25],
    [3, 0],
    [4.2, 100],
    [4.2, -100],
    [4.8, -100],
    [5.8, 25],
    [6.4, 25],
    [6.8, -25],
    [7.2, -25],
    [7.8, 25],
    [10, 25],
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

        if (!introDone.current && offset.current !== null && progress.loaded === progress.total && progress.total > 0) intro();
      } else {
        offset.current = 0;
      }
    },
    [isMobile, progress]
  );

  const { contextSafe } = useGSAP();

  const intro = contextSafe(() => {
    if (offset.current) {
      introDone.current = true;
      gsap.fromTo(
        ref.current,
        {
          x: isMobile ? "0%" : offset.current > 0 ? "100%" : "-100%",
          y: isMobile ? "-100%" : "0%",
        },
        {
          x: isMobile ? "0%" : offset.current + "%",
          y: "0%",
          delay: 0.2,
          duration: 1.3,
          ease: "back.inOut(0.8)",
        }
      );
    }
  });

  const updateOffset = contextSafe((offset: number) => {
    gsap.quickSetter(ref.current, "x", "%")(offset);
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

  const [dpr, setDpr] = useState<number>(1);

  return (
    <div ref={ref} className={styles.model}>
      <Canvas
        style={{ pointerEvents: "none" }}
        gl={{
          powerPreference: "high-performance",
        }}
        dpr={dpr}
      >
        <PerformanceMonitor onChange={({ factor }) => setDpr(Math.round(0.5 + 1.5 * factor))}>
          <Suspense>
            <Float rotationIntensity={isMobile ? 2 : 0} floatIntensity={isMobile ? 2 : 1} speed={2}>
              <Model offset={offset} />
            </Float>
            <EffectComposer>
              <N8AO halfRes quality="performance" depthAwareUpsampling={false} color="black" aoRadius={2} intensity={1} />
            </EffectComposer>
          </Suspense>
          <ambientLight intensity={2} color={"white"} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
