import { horizontalLoop } from "@/lib/horizontalLoop";
import { Achievement, Achievements } from "@/types";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { ForwardedRef, forwardRef, useRef } from "react";
import styles from "./style.module.css";

export function Banner({ data, direction = "right", speed = 1 }: { data: Achievements; direction?: "right" | "left"; speed?: number }) {
  const itemRefs = useRef<HTMLAnchorElement[]>([]);
  const loopRef = useRef<gsap.core.Timeline>();

  useGSAP(() => {
    setTimeout(() => {
      loopRef.current = horizontalLoop(itemRefs.current, {
        speed: speed,
        paused: false,
        repeat: -1,
        reversed: direction === "left",
      });
    }, 0);
  });

  return (
    <>
      <div className={styles.wrapper}>
        {data.map((achievement, i) => (
          <BannerItem
            key={i}
            ref={(el) => {
              if (el) itemRefs.current[i] = el;
            }}
            data={achievement}
          />
        ))}
        {data.map((achievement, i) => (
          <BannerItem
            key={i + data.length}
            ref={(el) => {
              if (el) itemRefs.current[i + data.length] = el;
            }}
            data={achievement}
          />
        ))}
      </div>
    </>
  );
}

export const BannerItem = forwardRef(function BannerItem(
  {
    data,
  }: {
    data: Achievement;
  },
  ref: ForwardedRef<HTMLAnchorElement>
) {
  return (
    <a ref={ref} className={styles.item} {...(data.url && { href: data.url })} target="_blank">
      <div className={styles.contentWrapper} style={{ pointerEvents: data.url ? "all" : "none" }} data-cursor-size="100px" data-cursor-text={"More info"} data-smile-animation={true}>
        <Image className={styles.logo} src={data.logo} alt={"logo"} width={0} height={0} />
        <div>
          <h3>{data.title}</h3>
          <h4 className={styles.description}>{data.description}</h4>
        </div>
      </div>
    </a>
  );
});
