import styles from "@/components/JobCards/style.module.css";
import MagneticButton from "@/components/MagneticButton";
import { MaskText } from "@/components/MaskText";
import { Job } from "@/types";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Image from "next/image";
import { useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

export function Card({ data, position, changeIndex }: { data: Job; position: { key: number; index: number }; changeIndex: (change: number) => void }) {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [scrollbarVisible, setScrollbarVisible] = useState<boolean>(false);

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const hasMoreInfo = "description" in data || "preview" in data || "repoUrl" in data || "websiteUrl" in data;
  const descriptionEntries = data.description?.split(/\n?- /);
  const difference = position.key - position.index;

  if (difference !== 0 && showInfo) {
    setShowInfo(false);
  }

  const translate = () => {
    if (difference < 0) return "100vw";
    if (difference === 0) return "0px";
    if (difference === 1) return "-50px";
    if (difference === 2) return "-90px";
    return "-100px";
  };

  const scale = () => {
    if (difference < 0) return "1";
    if (difference === 0) return "1";
    if (difference === 1) return "0.9";
    if (difference === 2) return "0.8";
    return "0.8";
  };

  const opacity = () => {
    if (difference < 0) return "1";
    if (difference === 0) return "1";
    if (difference === 1) return "1";
    if (difference === 2) return "0.7";
    return "0";
  };

  const blur = () => {
    if (difference < 0) return "0px";
    if (difference === 0) return "0px";
    if (difference === 1) return "2px";
    if (difference === 2) return "5px";
    return "5px";
  };

  const card = useRef<HTMLDivElement>(null);
  const cardContent = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const linkBlock = useRef<HTMLDivElement>(null);
  const descriptionBlock = useRef<HTMLDivElement>(null);
  const ready = useRef<boolean>(false);
  const showInfoTimeline = useRef<gsap.core.Timeline>();

  useGSAP(() => {
    showInfoTimeline.current?.kill();
    showInfoTimeline.current = gsap.timeline();

    if (showInfo) {
      showInfoTimeline.current
        .to(linkBlock.current, {
          height: "100%",
          opacity: 1,
          duration: 0.5,
          ease: "power4.inOut",
        })
        .to(
          descriptionBlock.current,
          {
            flex: 1,
            duration: 0.5,
            ease: "power4.inOut",
            onComplete: () => {
              setScrollbarVisible(descriptionBlock.current!.scrollHeight > descriptionBlock.current!.clientHeight);
            },
          },
          "<"
        )
        .to(descriptionBlock.current, { opacity: 1, duration: 0.2 });
    } else {
      showInfoTimeline.current
        .to(linkBlock.current, {
          height: 0,
          opacity: 0,
          duration: 0.2,
          ease: "power4.inOut",
        })
        .to(
          descriptionBlock.current,
          {
            opacity: 0,
            duration: 0.2,
          },
          "<"
        )
        .to(descriptionBlock.current, {
          flex: 0,
          duration: 0.5,
          ease: "power4.inOut",
        });
    }

    gsap.to(logo.current, {
      filter: showInfo ? "blur(20px) opacity(0.5) saturate(0.5)" : "blur(0px) opacity(1) saturate(1)",
      delay: showInfo ? 0 : 0.3,
      duration: 0.5,
    });

    if (difference === 0 && hasMoreInfo) {
      let tl = gsap.timeline();
      tl.to(cardContent.current, { pointerEvents: "none" });
      tl.to(cardContent.current, { pointerEvents: "all" }, ">");
    }
  }, [showInfo]);

  useGSAP(() => {
    if (ready.current) {
      gsap.to(card.current, {
        x: translate(),
        scale: scale(),
        rotate: difference < 0 ? "40deg" : "0deg",
        opacity: opacity(),
        filter: "blur(" + blur() + ")",
        duration: 0.5,
        ease: "back.out(0.3)",
      });
    }
  }, [position]);

  useGSAP(() => {
    if (difference < 3) {
      gsap.fromTo(
        card.current,
        {
          x: "100vw",
          rotate: "40deg",
        },
        {
          scrollTrigger: {
            trigger: card.current,
            start: "center bottom",
          },
          x: translate(),
          xPercent: "-50",
          scale: scale(),
          rotate: difference < 0 ? "40deg" : "0deg",
          opacity: opacity(),
          filter: "blur(" + blur() + ")",
          duration: 0.8,
          delay: (3 - difference) / 10,
          ease: "back.out(0.3)",
          onComplete: () => {
            ready.current = true;
          },
        }
      );
    } else {
      gsap.set(card.current, {
        x: translate(),
        xPercent: "-50",
        scale: scale(),
        opacity: 0,
        filter: "blur(" + blur() + ")",
        onComplete: () => {
          ready.current = true;
        },
      });
    }
  });

  function addAlpha(color: string, opacity: number) {
    let transparency = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + transparency.toString(16).toUpperCase();
  }

  return (
    <div
      ref={card}
      className={styles.card}
      style={{
        zIndex: 9999 - position.key,
        background: "linear-gradient(300deg, " + addAlpha(data.colors[0], 0.1) + ", " + addAlpha(data.colors[1], 0.1) + ", " + addAlpha(data.colors[2], 0.1) + "), #3f3f3f",
      }}
      onClick={() => {
        if (difference === 0 && hasMoreInfo) {
          setShowInfo(!showInfo);
        } else {
          changeIndex(difference);
        }
      }}
    >
      <div
        ref={cardContent}
        className={styles.cardContent}
        data-cursor-size="100px"
        data-cursor-text={showInfo ? "Less info" : "More info"}
        data-smile-animation={true}
        style={{ pointerEvents: difference === 0 && hasMoreInfo ? "all" : "none" }}
      >
        <Image ref={logo} className={styles.logo} width={500} height={500} draggable="false" src={data.logo} alt={data.company} />

        <div
          style={{
            translate: showInfo ? "0 100%" : "0 0",
            bottom: showInfo ? "100%" : "0",
          }}
          className={styles.cardText}
        >
          <h2 className={styles.title}>{data.company}</h2>

          <div className={styles.subtextWrapper}>
            <h4 className={styles.subtitle}>{data.position}</h4>
            {!isMobile && data.type && <h6 className={styles.subtext}>{data.type}</h6>}
          </div>

          <div
            ref={linkBlock}
            style={{
              flex: 0,
              height: 0,
              opacity: 0,
              marginTop: "5%",
            }}
          >
            <div style={{ display: "flex", translate: "-10px 0" }}>
              {data.repoUrl && (
                <MaskText show={showInfo} duration={1.2}>
                  <MagneticButton padding={"10px 15px"} borderRadius={"10px"} style={{ textDecoration: "underline", color: "white" }} href={data.repoUrl}>
                    <h5>View Repository</h5>
                  </MagneticButton>
                </MaskText>
              )}

              {data.websiteUrl && (
                <MaskText show={showInfo} duration={1.2}>
                  <MagneticButton padding={"10px 15px"} borderRadius={"10px"} style={{ textDecoration: "underline", color: "white" }} href={data.websiteUrl}>
                    <h5>View Demo</h5>
                  </MagneticButton>
                </MaskText>
              )}
            </div>
          </div>

          <div
            ref={descriptionBlock}
            style={{
              flex: 0,
              opacity: "0",
              paddingRight: isMobile ? "unset" : "20px",
              paddingBottom: "10px",
              overflow: "hidden auto",
            }}
            data-lenis-prevent={scrollbarVisible ? "" : null}
          >
            {descriptionEntries?.map((entry: string, i: number) => (
              <MaskText key={i} show={showInfo} duration={1} delay={showInfo ? (0.5 / descriptionEntries?.length) * i : 0}>
                <h5 className={styles.description}>{entry}</h5>
              </MaskText>
            ))}
            <br />
            {data.preview && (
              <MaskText show={showInfo} duration={1} delay={showInfo ? 0.5 : 0}>
                <>
                  {(() => {
                    switch (data.preview.split(":")[1].split("/")[0]) {
                      case "image":
                        return <Image style={{ width: "100%", height: "auto" }} height={0} width={0} draggable="false" src={data.preview} alt={data.company} />;
                      case "video":
                        return <video src={data.preview} style={{ width: "100%", height: "auto" }} playsInline loop muted autoPlay disablePictureInPicture />;
                      default:
                        return <></>;
                    }
                  })()}
                </>
              </MaskText>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
