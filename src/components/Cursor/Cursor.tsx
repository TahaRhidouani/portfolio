import { AnimationStateContext, AnimationStates } from "@/components/Face/AnimationStateContext";
import { RollingCounter } from "@/components/RollingCounter/RollingCounter";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useContext, useRef, useState } from "react";
import styles from "./style.module.css";

type CursorProps = {
  animationDuration?: number;
  magneticAnimationDuration?: number;
  sizeAnimationDuration?: number;
  textAnimationDuration?: number;
  cursorSize?: number;
};

type Coordinates = {
  x: number;
  y: number;
};

type SetterProperties = {
  x?: Function;
  y?: Function;
  r?: Function;
  sx?: Function;
  sy?: Function;
  width?: Function;
  rt?: Function;
};

type Attributes = {
  smile?: boolean;
  size?: string[];
  text?: string;
  magnetic?: string;
  sticky?: string;
  element?: HTMLElement;
};

function getScale(diffX: number, diffY: number) {
  const distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  return Math.min(distance / 500, 0.35);
}

function getAngle(diffX: number, diffY: number) {
  return (Math.atan2(diffY, diffX) * 180) / Math.PI;
}

function useTicker(callback: () => void, paused?: boolean) {
  useGSAP(() => {
    if (!paused && callback) {
      gsap.ticker.add(callback);
    }
    return () => {
      gsap.ticker.remove(callback);
    };
  }, [callback, paused]);
}

export function Cursor({ animationDuration = 0.5, magneticAnimationDuration = 1, sizeAnimationDuration = 0.5, textAnimationDuration = 1, cursorSize = 30 }: CursorProps) {
  const cursor = useRef<HTMLDivElement | null>(null);
  const cursorInner = useRef<HTMLDivElement | null>(null);

  const gelly = useRef<boolean>(true);
  const magnetic = useRef<boolean>(false);
  const sticky = useRef<boolean>(false);
  const timeout = useRef<NodeJS.Timeout>(undefined);

  const position = useRef<Coordinates>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const velocity = useRef<Coordinates>({ x: 0, y: 0 });
  const setter = useRef<SetterProperties>({});
  const attributes = useRef<Attributes>({});

  const [text, setText] = useState<string>("");

  const { lastMoved, setState } = useContext(AnimationStateContext);

  useGSAP(() => {
    setter.current.x = gsap.quickSetter(cursor.current, "x", "px");
    setter.current.y = gsap.quickSetter(cursor.current, "y", "px");
    setter.current.r = gsap.quickSetter(cursor.current, "rotate", "deg");
    setter.current.sx = gsap.quickSetter(cursor.current, "scaleX");
    setter.current.sy = gsap.quickSetter(cursor.current, "scaleY");
    setter.current.width = gsap.quickSetter(cursor.current, "width", "px");
    setter.current.rt = gsap.quickSetter(cursorInner.current, "rotate", "deg");
  });

  const loop = () => {
    const rotation = getAngle(velocity.current.x, velocity.current.y);
    const scale = getScale(velocity.current.x, velocity.current.y);

    setter.current.x!(position.current.x);
    setter.current.y!(position.current.y);

    if (gelly.current && scale && rotation && cursor.current) {
      setter.current.width!(cursor.current?.style.height + scale * 50);
      setter.current.r!(rotation);
      setter.current.sx!(1 + scale);
      setter.current.sy!(1 - scale);
      setter.current.rt!(-rotation);
    }

    if (!gelly.current) {
      setter.current.sx!(1);
      setter.current.sy!(1);
      setter.current.r!(0);
      setter.current.rt!(0);
    }
  };

  useGSAP(() => {
    function getAttributes(target: HTMLElement): Attributes {
      let element = target;
      while (element && element !== document.body) {
        const smileAnimationAttribute = element.getAttribute("data-smile-animation");
        const cursorSizeAttribute = element.getAttribute("data-cursor-size");
        const cursorTextAttribute = element.getAttribute("data-cursor-text");
        const cursorMagneticAttribute = element.getAttribute("data-cursor-magnetic");
        const cursorStickAttribute = element.getAttribute("data-cursor-stick");

        const result: Attributes = {};

        if (smileAnimationAttribute && smileAnimationAttribute !== "false") {
          result.smile = true;
        }

        if (cursorSizeAttribute) {
          result.size = cursorSizeAttribute?.split(" ");
        }

        if (cursorTextAttribute) {
          result.text = cursorTextAttribute;
        }

        if (cursorMagneticAttribute) {
          result.magnetic = cursorMagneticAttribute;
        }

        if (cursorStickAttribute) {
          result.sticky = cursorStickAttribute;
        }

        if (Object.keys(result).length) {
          result.element = element;
          return result;
        } else {
          element = element.parentNode as HTMLElement;
        }
      }

      return {};
    }

    function mouseMove(event: MouseEvent) {
      const areaTarget = event.target as HTMLElement;
      let target: Element | null;
      let bound: DOMRect | undefined;
      let x = event.clientX;
      let y = event.clientY;
      let ease = "expo.out";

      lastMoved!.current = Date.now();

      if (magnetic.current) {
        gsap.to(areaTarget, {
          x: (event.clientX - areaTarget.getBoundingClientRect().left - areaTarget.clientWidth / 2) * 0.2,
          y: (event.clientY - areaTarget.getBoundingClientRect().top - areaTarget.clientHeight / 2) * 0.2,
          duration: animationDuration,
          ease: "power4.out",
        });
      }

      if (sticky.current) {
        target = document.getElementById(areaTarget.dataset["cursorStick"] as string);
        bound = target?.getBoundingClientRect();

        if (target && bound) {
          y = bound.top + target.clientHeight / 2 - (bound.top + target.clientHeight / 2 - event.clientY) * 0.1;
          x = bound.left + target.clientWidth / 2 - (bound.left + target.clientWidth / 2 - event.clientX) * 0.1;
          ease = "power4.out";
        }
      }

      gsap.set(position.current, {});

      const xTo = gsap.quickTo(position.current, "x", {
        duration: animationDuration,
        ease,
        onUpdate: () => {
          if (position.current.x) velocity.current.x = x - position.current.x;
        },
      });

      const yTo = gsap.quickTo(position.current, "y", {
        duration: animationDuration,
        ease,
        onUpdate: () => {
          if (position.current.y) velocity.current.y = y - position.current.y;
        },
      });

      xTo(x);
      yTo(y);

      loop();
    }

    function mouseEnter(event: MouseEvent) {
      if (!cursor.current || !cursorInner.current) return;

      const target = event.target as HTMLElement;
      const oldAttributes = attributes.current;
      attributes.current = getAttributes(target);

      if ("magnetic" in oldAttributes) {
        magnetic.current = false;
        const areaTarget = oldAttributes.element!;

        gsap.to(areaTarget, {
          x: 0,
          y: 0,
          duration: magneticAnimationDuration,
          ease: "power4.out",
        });
      }

      // Undo old effects
      if (!Object.keys(attributes.current).length) {
        gsap.to(cursor.current, {
          opacity: 1,
          mixBlendMode: "difference",
          background: "white",
          duration: sizeAnimationDuration,
          ease: "expo.out",
        });
      }

      if ("smile" in oldAttributes && !("smile" in attributes.current)) {
        setState!(AnimationStates.Idle);
      }

      if ("size" in oldAttributes && !("size" in attributes.current)) {
        gsap.to(cursor.current, {
          width: `${cursorSize}`,
          height: `${cursorSize}`,
          duration: sizeAnimationDuration,
          ease: "expo.out",
        });
      }

      if ("text" in oldAttributes && !("text" in attributes.current)) {
        setText("");

        gsap.to(cursorInner.current, {
          scale: 0,
          opacity: 0,
          duration: textAnimationDuration,
          ease: "expo.out",
        });
      }

      if ("sticky" in oldAttributes && !("sticky" in attributes.current)) {
        sticky.current = false;
        timeout.current = setTimeout(() => (gelly.current = true), 400);

        gsap.to(cursor.current, {
          width: `${cursorSize}`,
          height: `${cursorSize}`,
          borderRadius: "100%",
          duration: sizeAnimationDuration,
          ease: "expo.out",
        });
      }

      // Add new effects
      if ("smile" in attributes.current) {
        setState!(AnimationStates.Smile);
      }

      if ("size" in attributes.current) {
        gsap.to(cursor.current, {
          width: attributes.current.size![0],
          height: attributes.current.size?.length === 2 ? attributes.current.size[1] : attributes.current.size![0],
          duration: sizeAnimationDuration,
          ease: "expo.out",
        });
      }

      if ("text" in attributes.current) {
        setText(attributes.current.text!);

        gsap.to(cursorInner.current, {
          scale: 1,
          opacity: 1,
          duration: textAnimationDuration,
          ease: "expo.out",
        });

        gsap.to(cursor.current, {
          mixBlendMode: "",
          background: "white",
          opacity: 0.7,
          borderRadius: "100%",
          duration: sizeAnimationDuration,
          ease: "expo.out",
        });
      }

      if ("magnetic" in attributes.current) {
        magnetic.current = true;
      }

      if ("sticky" in attributes.current) {
        gelly.current = false;
        sticky.current = true;
        clearTimeout(timeout.current);

        const dim = attributes.current.element!.getBoundingClientRect();

        gsap.to(cursor.current, {
          width: dim.width + "px",
          height: dim.height + "px",
          borderRadius: attributes.current.magnetic,
          duration: sizeAnimationDuration,
          ease: "expo.out",
        });
      }
    }

    function mouseLeave() {
      gsap.to(cursor.current, {
        opacity: 0,
        duration: animationDuration,
      });
    }

    document.body.addEventListener("mousemove", mouseMove);
    document.body.addEventListener("mouseover", mouseEnter);
    document.body.addEventListener("mouseleave", mouseLeave);

    gsap.set(cursor.current, {
      opacity: 1,
      mixBlendMode: "difference",
      background: "white",
    });

    return () => {
      document.body.removeEventListener("mousemove", mouseMove);
      document.body.removeEventListener("mouseover", mouseEnter);
      document.body.removeEventListener("mouseleave", mouseLeave);
    };
  }, []);

  useTicker(loop);

  return (
    <div
      ref={cursor}
      className={styles.cursor}
      style={{
        width: cursorSize,
        height: cursorSize,
      }}
    >
      <div ref={cursorInner} className={styles.inner}>
        {text && <RollingCounter text={text} />}
      </div>
    </div>
  );
}
