import { CardContext } from "@/components/ProjectsCard/CardContext";
import { Project } from "@/types";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Flip from "gsap/Flip";
import { useLenis } from "lenis/react";
import { useContext, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";
import styles from "./style.module.css";

export function Card({ data }: { data: Project }) {
  const { contextSafe } = useGSAP();
  const lenis = useLenis();

  const { setData, setShow, toggleCardFunction, fullscreenRef } = useContext(CardContext);

  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isFullscreen = useRef<boolean>(false);

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const toggleCard = contextSafe(() => {
    if (!wrapRef.current || !ref.current || !fullscreenRef?.current) return;

    if (isFullscreen.current) {
      document.documentElement.style.overflowY = "scroll";
      fullscreenRef.current.style.pointerEvents = "none";
      toggleCardFunction!.current = null;
      setShow!(false);
      lenis?.start();
    } else {
      document.documentElement.style.overflowY = "hidden";
      fullscreenRef.current.style.pointerEvents = "all";
      ref.current.style.pointerEvents = "none";
      toggleCardFunction!.current = toggleCard;
      lenis?.stop();
    }

    setTimeout(
      () => {
        let make2D = gsap.set(ref.current, { rotationX: 0, rotationY: 0, z: 0 });

        const f = Flip.fit(ref.current, isFullscreen.current ? wrapRef.current : fullscreenRef.current, {
          getVars: true,
          scale: true,
          absolute: true,
          duration: 1.2,
          ease: "power4.inOut",
        });

        make2D.revert();

        gsap.set(wrapRef.current, { zIndex: 100 });

        const tl = gsap.timeline({
          onComplete: () => {
            if (!isFullscreen.current) {
              gsap.set(wrapRef.current, { zIndex: 1 });
              setData!({
                content: "",
                repoUrl: "",
                websiteUrl: "",
                trailerUrl: "",
                rawRepoUrl: "",
              });
              ref.current!.style.pointerEvents = "all";
            } else {
              setData!({
                content: data.content,
                repoUrl: data.repoUrl,
                websiteUrl: data.websiteUrl,
                trailerUrl: data.trailerUrl,
                rawRepoUrl: data.rawRepoUrl,
              });
              setShow!(true);
            }
          },
        });

        tl.to(ref.current, f as gsap.TweenVars);

        tl.to(
          ref.current,
          {
            duration: 0.9,
            rotationY: isFullscreen.current ? "0deg" : "180deg",
            ease: "power4.inOut",
          },
          isFullscreen.current ? 0.3 : 0
        );

        isFullscreen.current = !isFullscreen.current;
      },
      isFullscreen.current ? 300 : 100
    );
  });

  useGSAP(() => {
    function resizeCard() {
      if (isFullscreen.current) {
        let make2D = gsap.set(ref.current, { rotationX: 0, rotationY: 0, z: 0 });

        const f = Flip.fit(ref.current, fullscreenRef!.current, {
          getVars: true,
          scale: true,
          absolute: true,
          duration: 0,
          ease: "power4.inOut",
        });

        make2D.revert();

        gsap.to(ref.current, f as gsap.TweenVars);
      }
    }

    window.addEventListener("resize", resizeCard);

    resizeCard();

    return () => window.removeEventListener("resize", resizeCard);
  });

  return (
    <div ref={wrapRef} className={styles.cardWrap}>
      <div ref={ref} onClick={() => (isMobile ? window.open(data.repoUrl) : toggleCard())} className={styles.card} data-cursor-size="100px" data-cursor-text={"More info"} data-smile-animation={true}>
        <div className={styles.cardFront}>
          <div className={styles.contentFront}>
            <h2>{data.name}</h2>
            <br />
            <h5 className={"secondary"}>{data.description}</h5>
          </div>
          <video className={styles.video} playsInline loop muted autoPlay disablePictureInPicture>
            <source src={data.trailerUrl} type="video/mp4" />
          </video>
        </div>

        <div className={styles.cardBack} />
      </div>
    </div>
  );
}
