import styles from "@/components/JobCards/style.module.css";
import MagneticButton from "@/components/MagneticButton";
import { DateType } from "@/types";
import Image from "next/image";
import { RollingCounter } from "../RollingCounter/RollingCounter";

export function Control({ start, end, data, changeIndex }: { start: DateType; end: DateType; data: { length: number; index: number }; changeIndex: (change: number) => void }) {
  return (
    <>
      <div style={{ transition: "0.2s" }} className={data.index === data.length - 1 ? styles.disabled : ""}>
        <MagneticButton padding={"10px"} onClick={() => changeIndex(1)} smile={false}>
          <Image src={"/assets/icons/arrow.png"} draggable="false" alt={"Left"} width={50} height={50} style={{ rotate: "-90deg" }} className={styles.arrow} />
        </MagneticButton>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>
        <h4 className={styles.dateText}>
          <RollingCounter text={start?.join(" ")} />
        </h4>

        <h4 style={{ paddingInline: "10px 5px", width: "auto" }}>to</h4>

        <h4 className={styles.dateText}>
          <RollingCounter text={end?.join(" ")} delay={0.05} />
        </h4>
      </div>

      <div style={{ transition: "0.2s" }} className={data.index === 0 ? styles.disabled : ""}>
        <MagneticButton padding={"10px"} onClick={() => changeIndex(-1)} smile={false}>
          <Image src={"/assets/icons/arrow.png"} draggable="false" alt={"Right"} width={50} height={50} style={{ rotate: "90deg" }} className={styles.arrow} />
        </MagneticButton>
      </div>
    </>
  );
}
