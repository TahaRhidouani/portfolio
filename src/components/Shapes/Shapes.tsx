import { Blob } from "@/components/Shapes/Blob";
import React, { CSSProperties, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Circle } from "@/components/Shapes/Circle";
import { BlurCircle } from "@/components/Shapes/BlurCircle";

export function Shapes() {
  const shape1 = useRef(null);
  const shape2 = useRef(null);
  const shape3 = useRef(null);
  const shape4 = useRef(null);
  const shape5 = useRef(null);
  const shape6 = useRef(null);
  const shape7 = useRef(null);
  const shape8 = useRef(null);
  const shape9 = useRef(null);

  const base: CSSProperties = {
    position: "absolute",
    translate: "-50% -50%",
    opacity: 0,
    willChange: "filter",
    zIndex: -1,
  };

  useGSAP(() => {
    gsap.to(shape1.current, {
      opacity: 0.2,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape2.current, {
      opacity: 0.5,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape3.current, {
      opacity: 0.5,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape4.current, {
      opacity: 0.4,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape5.current, {
      opacity: 0.3,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape6.current, {
      opacity: 1,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape7.current, {
      opacity: 0.4,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape8.current, {
      opacity: 1,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    gsap.to(shape9.current, {
      opacity: 0.4,
      scale: 1,
      delay: 0.5,
      scrollTrigger: shape1.current,
      duration: 2,
      ease: "power3.inOut",
    });

    function mouseMove(event?: MouseEvent) {
      const x = event?.clientX ?? window.innerWidth / 2;

      gsap.to(shape1.current, { x: x / 20, duration: 1.5 });
      gsap.to(shape2.current, { x: x / 50, duration: 1.5 });
      gsap.to(shape3.current, { x: x / 200, duration: 1.5 });
      gsap.to(shape7.current, { x: x / 50, duration: 1.5 });
      gsap.to(shape8.current, { x: x / 10, duration: 1.5 });
      gsap.to(shape4.current, { x: -x / 20, duration: 1.5 });
      gsap.to(shape5.current, { x: -x / 30, duration: 1.5 });
      gsap.to(shape6.current, { x: -x / 10, duration: 1.5 });
      gsap.to(shape9.current, { x: -x / 80, duration: 1.5 });
    }

    mouseMove();
    document.body.addEventListener("mousemove", mouseMove);

    return () => {
      document.body.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  return (
    <>
      {/* Background blob */}
      <Blob
        style={{
          ...base,
          ...{
            filter: "blur(100px)",
            left: "70%",
            top: "50%",
            opacity: 0.2,
            width: "80vw",
          },
        }}
        animate={false}
      />

      {/* Top foreground blob */}
      <Blob
        ref={shape1}
        style={{
          ...base,
          ...{
            left: "80%",
            top: "20%",
            rotate: "150deg",
            scale: "0.9",
            width: "20vw",
          },
        }}
        gradient={["color-mix(in lab, var(--accent) 35%, black)", "color-mix(in lab, var(--accent) 100%, black)"]}
      />

      {/* Highlight blob */}
      <Blob
        ref={shape2}
        style={{
          ...base,
          ...{
            filter: "blur(60px)",
            left: "40%",
            top: "20%",
            rotate: "10deg",
            width: "30vw",
          },
        }}
        animate={false}
        gradient={["var(--accent)"]}
      />

      {/* Shadow blob */}
      <Blob
        ref={shape3}
        style={{
          ...base,
          ...{
            filter: "blur(50px)",
            left: "60%",
            top: "40%",
            rotate: "170deg",
            width: "40vw",
          },
        }}
        animate={false}
        gradient={["black"]}
      />

      {/* Bottom foreground circle */}
      <Circle
        ref={shape5}
        style={{
          ...base,
          ...{
            width: "40vw",
            left: "40%",
            top: "80%",
            rotate: "300deg",
            scale: "0.9",
          },
        }}
        gradient={["black", "color-mix(in lab, var(--accent) 50%, black)"]}
      />

      {/* Bottom foreground blob */}
      <Blob
        ref={shape4}
        style={{
          ...base,
          ...{
            width: "15vw",
            left: "60%",
            top: "85%",
            rotate: "250deg",
            scale: "0.9",
          },
        }}
        gradient={["color-mix(in lab, var(--accent) 35%, black)", "color-mix(in lab, var(--accent) 70%, black)"]}
        morphDuration={5}
      />

      {/* Bottom foreground blur circle */}
      <BlurCircle
        ref={shape6}
        style={{
          ...base,
          ...{
            maskImage: "linear-gradient(to top, rgb(0, 0, 0, 0) 5%, rgba(0, 0, 0, 1) 80%)",
            width: "25vw",
            left: "55%",
            top: "90%",
            scale: "0.9",
          },
        }}
        blur={15}
      />

      {/* Top foreground deformed blob */}
      <Blob
        ref={shape7}
        style={{
          ...base,
          ...{
            filter: "blur(3px)",
            width: "20vw",
            left: "50%",
            top: "25%",
            scale: "0.9",
          },
        }}
        extraDeformed={true}
        gradient={["color-mix(in lab, var(--accent) 50%, black)", "black"]}
      />

      {/* Top foreground blur circle */}
      <BlurCircle
        ref={shape8}
        style={{
          ...base,
          ...{
            width: "5vw",
            left: "82%",
            top: "20%",
            scale: "0.9",
          },
        }}
        dark={false}
        blur={15}
      />

      {/* Bottom foreground deformed blob */}
      <Blob
        ref={shape9}
        style={{
          ...base,
          ...{
            filter: "blur(15px)",
            width: "25vw",
            left: "75%",
            top: "65%",
            rotate: "180deg",
            scale: "0.9",
          },
        }}
        extraDeformed={true}
        gradient={["color-mix(in lab, var(--accent) 50%, black)", "color-mix(in lab, var(--accent) 90%, white)"]}
        morphDuration={15}
      />
    </>
  );
}
