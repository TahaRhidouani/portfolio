import { gsap } from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

export function RollingCounter({ text, delay = 0 }: { text: string; delay?: number }) {
  const txt = useRef<HTMLHeadingElement>(null);
  const txtSwap = useRef<HTMLHeadingElement>(null);

  const [oldTextData, setOldTextData] = useState<string>("");
  const [newTextData, setNewTextData] = useState<string>(text);

  useEffect(() => {
    if (newTextData !== text) {
      setOldTextData(newTextData);
      setNewTextData(text);
    }
  }, [text, newTextData]);

  const updateText = useCallback(() => {
    if (!txtSwap.current) return;

    txtSwap.current.innerHTML = newTextData;

    const duration = oldTextData === "" ? 0 : 0.2;

    let tl = gsap.timeline({
      onComplete: () => {
        if (!txt.current) return;

        txt.current.innerHTML = newTextData;
        gsap.set(txt.current, { y: "-50%" });
        gsap.set(txtSwap.current, { y: "-100%" });
      },
    });

    tl.fromTo(txt.current, { y: "-50%" }, { y: "150%", duration: duration, delay: delay, ease: "linear" }, "start");
    tl.fromTo(txtSwap.current, { y: "-100%" }, { y: "50%", duration: duration, delay: delay, ease: "linear" }, "start");
  }, [delay, newTextData, oldTextData]);

  useEffect(() => {
    updateText();
  }, [oldTextData, newTextData, updateText]);

  return (
    <div
      style={{
        overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
      }}
    >
      <div style={{ overflow: "visible" }}>
        <div ref={txtSwap} style={{ textAlign: "center" }}></div>
        <div ref={txt} style={{ textAlign: "center" }}></div>
      </div>
    </div>
  );
}
