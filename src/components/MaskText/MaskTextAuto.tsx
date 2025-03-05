import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { CSSProperties, ReactNode, RefObject, useRef } from "react";

export function MaskTextAuto({
  children,
  triggerRef,
  dangerouslySetInnerHTML,
  style,
  delay = 0,
  duration = 0.5,
}: {
  children?: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
  dangerouslySetInnerHTML?: { __html: string | TrustedHTML };
  style?: CSSProperties;
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to(ref.current, {
      scrollTrigger: {
        trigger: triggerRef?.current ?? ref.current,
        start: "bottom bottom",
      },
      y: "0",
      rotate: "0",
      duration: duration,
      delay: delay,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(ref.current, {
          clearProps: "all",
        });
      },
    });
  });

  return (
    <div style={{ overflow: "visible hidden", ...style }}>
      <div
        ref={ref}
        style={{
          overflow: "hidden",
          translate: "0% 100%",
          rotate: "3deg",
          transformOrigin: "top left",
          willChange: "transform",
        }}
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      >
        {children}
      </div>
    </div>
  );
}
