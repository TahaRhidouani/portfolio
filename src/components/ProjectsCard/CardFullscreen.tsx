import MagneticButton from "@/components/MagneticButton";
import { MaskText } from "@/components/MaskText";
import { CardContext } from "@/components/ProjectsCard/CardContext";
import styles from "@/components/ProjectsCard/style.module.css";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { compiler } from "markdown-to-jsx";
import Image from "next/image";
import React, { ForwardedRef, forwardRef, useContext, useMemo, useRef } from "react";

export const CardFullscreen = forwardRef(function CardFullscreen({}, ref: ForwardedRef<HTMLDivElement>) {
  const { data, show, toggleCardFunction } = useContext(CardContext);

  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (show) {
      videoRef.current?.load();
      videoRef.current?.addEventListener(
        "loadeddata",
        () => {
          videoRef.current?.play().then(() => {
            gsap.to(videoRef.current, {
              opacity: 1,
              delay: 0.5,
              duration: 0.5,
            });
          });
        },
        false
      );
      gsap.to(closeRef.current, {
        opacity: 1,
        delay: 0.5,
        duration: 0.5,
      });
    } else {
      gsap.to(videoRef.current, {
        opacity: 0,
        duration: 0.3,
      });
      gsap.to(closeRef.current, {
        opacity: 0,
        duration: 0.3,
      });
    }
  }, [show]);

  const content = useMemo(() => {
    const isAbsoluteUrl = new RegExp("^(?:[a-z+]+:)?//", "i");

    return compiler(data?.content ?? "", {
      createElement(type, props, children) {
        return (
          <React.Fragment key={props.key}>
            {React.createElement(type, props, children)}
            {type === "h1" && (
              <div style={{ marginBlock: "50px 70px" }}>
                <div style={{ display: "flex" }}>
                  {data?.websiteUrl && (
                    <MagneticButton href={data.websiteUrl} padding={"15px 40px"} borderRadius={"10px"}>
                      <span className="accent">View Demo</span>
                    </MagneticButton>
                  )}

                  {data?.repoUrl && (
                    <MagneticButton href={data.repoUrl} padding={"15px 40px"} borderRadius={"10px"}>
                      <span className="accent">View in Github</span>
                    </MagneticButton>
                  )}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      },
      overrides: {
        p: {
          component: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
          props: {
            style: { marginBlock: "20px", lineHeight: "normal" },
          },
        },
        a: {
          component: ({ children, ...props }) => <a {...props}>{children}</a>,
          props: {
            style: { fontSize: "inherit", display: "inline" },
          },
        },
        img: {
          component: ({ children, src, ...props }) => <Image src={isAbsoluteUrl.test(src) ? src : data?.rawRepoUrl + src} alt={props.alt || ""} {...props} />,
          props: {
            style: {
              marginBlock: "20px",
              borderRadius: "10px",
              display: "block",
              height: "auto",
              width: "60%",
            },
            width: 1000,
            height: 1000,
            placeholder:
              "data:image/png;base64,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",
            priority: true,
          },
        },
      },
      wrapper: null,
    }) as unknown;
  }, [data]) as JSX.Element[];

  return (
    <div ref={ref} className={styles.fullscreen} data-lenis-prevent>
      <div ref={closeRef} className={styles.close}>
        <MagneticButton padding={"10px"} onClick={() => toggleCardFunction!.current?.()} smile={false}>
          <Image height={50} width={50} draggable="false" src={"/assets/icons/close.png"} alt={"Close"} style={{ verticalAlign: "top" }} />
        </MagneticButton>
      </div>

      <video ref={videoRef} src={data?.trailerUrl} className={styles.videoFullscreen} playsInline loop muted autoPlay disablePictureInPicture />

      <div className={styles.fullscreenContent}>
        <div style={{ width: "80%", maxWidth: "1500px" }}>
          {content.map((elem, i) => (
            <MaskText key={i} show={show!} duration={show ? 1 : 0.5}>
              {elem}
            </MaskText>
          ))}
        </div>
      </div>
    </div>
  );
});
