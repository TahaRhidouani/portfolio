"use client";

import Loading from "@/app/(portfolio)/loading";
import { useGSAP } from "@gsap/react";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";

export function Loader() {
  const progress = useProgress();

  useGSAP(() => {
    if (progress.loaded === progress.total && progress.total > 0) {
      gsap.fromTo(
        "#loading",
        {
          opacity: 1,
        },
        {
          opacity: 0,
          duration: 0.3,
          delay: 0.5,
        }
      );
    }
  }, [progress]);

  return (
    <div id="loading" style={{ position: "fixed", zIndex: 9999999999999, pointerEvents: "none" }}>
      <Loading />
    </div>
  );
}
