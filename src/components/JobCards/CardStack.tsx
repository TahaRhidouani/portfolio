import styles from "./style.module.css";
import React, { useRef, useState } from "react";
import { MaskTextAuto } from "@/components/MaskText";
import { Jobs } from "@/types";
import { Card } from "@/components/JobCards/Card";
import { Control } from "@/components/JobCards/Controls";

export function CardStack({ data }: { data: Jobs }) {
  const [index, setIndex] = useState<number>(0);
  const stackRef = useRef<HTMLDivElement>(null);

  const changeIndex = (change: number) => {
    setIndex(Math.max(0, Math.min(data.length - 1, index + change)));
  };

  return (
    <div className={styles.cardStack}>
      <div ref={stackRef} className={styles.stack}>
        {data.map((d, i) => (
          <Card key={i} data={d} position={{ key: i, index: index }} changeIndex={changeIndex} />
        ))}
      </div>

      <MaskTextAuto duration={0.8} triggerRef={stackRef} style={{ overflow: "hidden" }}>
        <div className={styles.cardControl}>
          <Control start={data[index].date.start} end={data[index].date.end} data={{ length: data.length, index: index }} changeIndex={changeIndex} />
        </div>
      </MaskTextAuto>
    </div>
  );
}
