import { Card } from "@/components/JobCards/Card";
import { Control } from "@/components/JobCards/Controls";
import { MaskTextAuto } from "@/components/MaskText";
import { Jobs } from "@/types";
import { useRef, useState } from "react";
import styles from "./style.module.css";

export function CardStack({ data }: { data: Jobs }) {
  const [index, setIndex] = useState<number>(0);
  const stackRef = useRef<HTMLDivElement>(null);

  function changeIndex(change: number) {
    setIndex(Math.max(0, Math.min(data.length - 1, index + change)));
  }

  function clampPositionValue(value: number, max: number = 3, min: number = -1) {
    return Math.min(max, Math.max(min, value));
  }

  return (
    <div className={styles.cardStack}>
      <div ref={stackRef} className={styles.stack}>
        {data.map((d, i) => (
          <Card key={i} data={d} difference={clampPositionValue(i - index)} changeIndex={changeIndex} stackRef={stackRef} />
        ))}
      </div>

      {data[0] && (
        <MaskTextAuto duration={0.8} triggerRef={stackRef} style={{ overflow: "hidden" }}>
          <div className={styles.cardControl}>
            <Control start={data[index].date.start} end={data[index].date.end} data={{ length: data.length, index: index }} changeIndex={changeIndex} />
          </div>
        </MaskTextAuto>
      )}
    </div>
  );
}
