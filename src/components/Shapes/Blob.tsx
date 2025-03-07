import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import React, { CSSProperties, forwardRef, useEffect, useId, useRef, useState } from "react";

export const regularBlobs = [
  "M39.3,-58.7C53.3,-60.1,68.5,-54.2,72.8,-43.2C77.2,-32.2,70.8,-16.1,71,0.1C71.3,16.4,78.2,32.8,72.4,41.2C66.5,49.6,47.8,50,33.6,56.7C19.4,63.5,9.7,76.4,-1,78.2C-11.8,80.1,-23.6,70.7,-36.5,63.2C-49.5,55.8,-63.5,50.3,-65,40.1C-66.5,29.9,-55.3,14.9,-53,1.3C-50.8,-12.3,-57.4,-24.7,-53.8,-31.2C-50.2,-37.6,-36.3,-38.3,-25.7,-38.8C-15,-39.3,-7.5,-39.7,2.6,-44.2C12.7,-48.7,25.4,-57.3,39.3,-58.7Z",
  "M36,-55C49.5,-54.6,65.1,-50.6,69.1,-40.9C73.1,-31.1,65.4,-15.5,61.7,-2.1C58.1,11.3,58.5,22.6,54.5,32.5C50.6,42.3,42.3,50.7,32.5,55.3C22.7,59.9,11.4,60.8,1.8,57.7C-7.8,54.6,-15.6,47.6,-24.4,42.4C-33.1,37.2,-42.8,33.7,-52.6,26.9C-62.4,20.2,-72.3,10.1,-71.6,0.4C-70.9,-9.2,-59.4,-18.5,-52.9,-30.9C-46.4,-43.3,-44.7,-59,-36.7,-62.5C-28.7,-66,-14.4,-57.5,-1.5,-54.8C11.3,-52.1,22.6,-55.4,36,-55Z",
  "M36.8,-66.9C43.2,-60,40.8,-41.1,43.9,-28C46.9,-14.8,55.3,-7.4,58.4,1.8C61.5,11,59.3,21.9,55.9,34.4C52.4,46.9,47.9,61,38.4,69.6C28.9,78.2,14.4,81.5,0,81.6C-14.5,81.6,-29,78.5,-37,69C-44.9,59.4,-46.3,43.5,-51.1,30.9C-55.8,18.3,-64,9.2,-67.7,-2.2C-71.5,-13.5,-70.8,-27,-65.4,-38.6C-60.1,-50.1,-50.1,-59.9,-38.4,-63.7C-26.8,-67.5,-13.4,-65.4,0.9,-66.9C15.2,-68.5,30.4,-73.7,36.8,-66.9Z",
  "M29.2,-59C35,-47.3,34.9,-33.7,42,-23.5C49.1,-13.3,63.6,-6.7,68.5,2.8C73.4,12.3,68.7,24.6,60.5,33C52.3,41.4,40.6,45.8,30,46.9C19.3,48,9.7,45.9,-1.9,49.2C-13.5,52.5,-27,61.3,-41.2,62.2C-55.4,63.1,-70.3,56.1,-74.9,44.5C-79.5,32.8,-73.8,16.4,-68.9,2.9C-63.9,-10.6,-59.6,-21.3,-52.2,-28.1C-44.7,-34.9,-34.2,-37.9,-25,-47.6C-15.7,-57.3,-7.9,-73.6,1.9,-77C11.7,-80.3,23.5,-70.7,29.2,-59Z",
  "M28.8,-55.9C35.5,-46.1,37.9,-34.7,41,-25.1C44.1,-15.5,47.9,-7.7,51.2,1.9C54.6,11.6,57.5,23.2,53.1,30.6C48.8,38,37.2,41.1,27.1,51.6C17,62,8.5,79.8,0.9,78.2C-6.6,76.5,-13.3,55.5,-20.7,43.5C-28,31.5,-36.2,28.6,-44.7,22.8C-53.2,17.1,-62.1,8.5,-66.2,-2.4C-70.2,-13.3,-69.6,-26.5,-65.8,-40.5C-62.1,-54.4,-55.2,-69.1,-43.7,-76.1C-32.2,-83.2,-16.1,-82.6,-2.5,-78.3C11.1,-73.9,22.1,-65.7,28.8,-55.9Z",
  "M44.1,-72.2C55.3,-69.8,61.4,-54.4,68.2,-40.2C75.1,-26,82.6,-13,82.1,-0.3C81.6,12.4,72.9,24.7,64.3,35.8C55.7,46.9,47.1,56.8,36.4,57.1C25.6,57.3,12.8,48.1,-1.6,50.9C-16.1,53.7,-32.2,68.7,-43.7,68.9C-55.3,69.1,-62.3,54.6,-64.7,40.6C-67,26.7,-64.7,13.3,-59.5,3.1C-54.2,-7.2,-45.9,-14.5,-42.4,-26.5C-39,-38.6,-40.4,-55.5,-34.1,-60.7C-27.8,-66,-13.9,-59.7,1.2,-61.9C16.4,-64,32.8,-74.7,44.1,-72.2Z",
  "M27.6,-56.6C33.2,-44.5,33.5,-32,37.3,-22.5C41.1,-13,48.4,-6.5,55.8,4.3C63.2,15,70.6,30,68.4,42.4C66.3,54.8,54.6,64.5,41.6,66.5C28.6,68.6,14.3,63,2.2,59.2C-9.9,55.3,-19.7,53.3,-31.1,50.3C-42.6,47.3,-55.5,43.4,-57.5,34.9C-59.5,26.4,-50.6,13.2,-47.4,1.8C-44.3,-9.5,-46.9,-19.1,-45.1,-28C-43.3,-36.8,-37,-45.1,-28.8,-55.6C-20.5,-66.2,-10.3,-79,0.4,-79.6C11,-80.2,22,-68.6,27.6,-56.6Z",
  "M39.3,-65.5C51.3,-61.1,61.8,-51.4,64.3,-39.6C66.7,-27.8,61.2,-13.9,56.3,-2.8C51.4,8.3,47.2,16.6,42.9,25.1C38.6,33.6,34.1,42.4,26.9,48.7C19.7,55,9.9,58.8,-0.6,59.9C-11.1,61.1,-22.3,59.5,-31.7,54.5C-41.1,49.4,-48.7,41,-53,31.3C-57.4,21.7,-58.5,10.8,-61.8,-1.9C-65,-14.6,-70.5,-29.2,-64.3,-35.7C-58.1,-42.2,-40.3,-40.5,-27.6,-44.5C-15,-48.6,-7.5,-58.3,3.1,-63.6C13.6,-68.9,27.2,-69.9,39.3,-65.5Z",
  "M34.5,-56.8C45,-53.6,53.9,-45,58.1,-34.6C62.3,-24.2,61.6,-12.1,61.1,-0.3C60.6,11.6,60.3,23.1,54.4,30.4C48.4,37.7,36.8,40.7,26.8,48.3C16.8,56,8.4,68.3,-0.1,68.5C-8.6,68.7,-17.3,56.8,-23.9,47.2C-30.6,37.6,-35.4,30.4,-42.2,22.9C-49,15.4,-57.8,7.7,-61.1,-1.9C-64.3,-11.5,-61.9,-22.9,-58.1,-35.6C-54.3,-48.2,-49,-62,-39.1,-65.5C-29.2,-68.9,-14.6,-62,-1.3,-59.8C12,-57.5,24,-59.9,34.5,-56.8Z",
];

export const deformedBlobs = [
  "M30.8,-61.8C35.8,-50.4,33,-33.9,34.3,-22.8C35.6,-11.7,41,-5.8,49.7,5C58.3,15.8,70.3,31.7,63.5,33.3C56.7,34.9,31.1,22.3,17.4,23.9C3.7,25.5,1.9,41.4,-3.7,47.8C-9.2,54.2,-18.5,51.1,-27.7,46.9C-36.9,42.6,-46,37.2,-53.5,29.2C-61,21.2,-66.8,10.6,-70.2,-2C-73.6,-14.5,-74.5,-29,-65.1,-33.7C-55.7,-38.3,-35.9,-33.1,-23.3,-40.2C-10.8,-47.3,-5.4,-66.7,3.7,-73.2C12.9,-79.7,25.7,-73.2,30.8,-61.8Z",
  "M28.8,-54.9C31.4,-48.3,23.5,-28.7,30.2,-17.4C36.9,-6,58.2,-3,65.2,4C72.2,11.1,65,22.2,52.6,23.8C40.3,25.3,22.8,17.3,13.2,23C3.6,28.7,1.8,48,-4,55C-9.9,62,-19.7,56.6,-32.4,52.7C-45.1,48.8,-60.7,46.4,-65.3,37.9C-70,29.3,-63.8,14.7,-52.2,6.7C-40.6,-1.3,-23.6,-2.6,-14.9,-4.1C-6.2,-5.6,-5.7,-7.3,-4.6,-14.7C-3.5,-22.2,-1.7,-35.4,5.7,-45.2C13.1,-55.1,26.2,-61.5,28.8,-54.9Z",
  "M41,-73.1C51.1,-65.2,55.8,-50.1,51,-36.7C46.2,-23.3,31.9,-11.6,23,-5.1C14.1,1.4,10.7,2.8,12.1,10.3C13.5,17.7,19.6,31.2,18.4,45.9C17.2,60.6,8.6,76.4,-0.5,77.2C-9.6,78.1,-19.1,63.9,-21,49.6C-23,35.3,-17.2,21,-18.3,12.7C-19.5,4.4,-27.5,2.2,-32.1,-2.7C-36.7,-7.5,-37.9,-15.1,-32.9,-16.7C-27.9,-18.2,-16.7,-13.9,-10.2,-23.8C-3.7,-33.8,-1.8,-58,6.8,-69.8C15.5,-81.6,30.9,-81,41,-73.1Z",
  "M16.4,-32.3C26.9,-22.3,44.9,-29.3,52.5,-26.8C60,-24.3,57.1,-12.1,47.2,-5.7C37.3,0.7,20.6,1.5,18.9,14.1C17.2,26.8,30.5,51.4,29.9,65.2C29.3,78.9,14.6,81.8,4.5,74C-5.7,66.3,-11.4,48,-19,38.3C-26.6,28.5,-36,27.4,-44.4,22.5C-52.8,17.5,-60.1,8.8,-53.1,4C-46.1,-0.7,-24.8,-1.3,-15.3,-4.3C-5.8,-7.3,-8,-12.5,-7.4,-28.3C-6.8,-44.1,-3.4,-70.3,-0.2,-69.9C2.9,-69.5,5.9,-42.3,16.4,-32.3Z",
  "M29.3,-54.1C31,-49.9,20.6,-27.9,17.2,-15.9C13.9,-3.9,17.6,-2,25.6,4.6C33.6,11.2,45.8,22.4,46.5,29.7C47.2,37,36.3,40.5,26.6,44.6C16.9,48.7,8.5,53.4,-3.5,59.5C-15.5,65.6,-31,73.1,-33.2,64.7C-35.4,56.3,-24.4,32,-30.3,18.5C-36.3,5.1,-59.3,2.6,-65.4,-3.5C-71.5,-9.6,-60.8,-19.3,-49.8,-23.9C-38.8,-28.6,-27.5,-28.4,-19.2,-28.8C-10.8,-29.2,-5.4,-30.4,4.2,-37.6C13.8,-44.9,27.7,-58.4,29.3,-54.1Z",
  "M25.5,-57.1C27.5,-43,19.8,-25,16.4,-14.8C13.1,-4.6,14.1,-2.3,14.1,0C14.2,2.4,13.3,4.8,16.6,15C20,25.2,27.7,43.2,25.6,46.7C23.6,50.3,11.8,39.3,0.9,37.8C-10.1,36.3,-20.1,44.3,-32.9,46.9C-45.7,49.6,-61.3,47,-63.6,38.3C-66,29.6,-55.3,14.8,-50,3C-44.8,-8.7,-45,-17.4,-38.9,-19.7C-32.8,-21.9,-20.3,-17.7,-12.7,-28.7C-5.2,-39.6,-2.6,-65.7,4.6,-73.6C11.7,-81.6,23.5,-71.3,25.5,-57.1Z",
];

export const Blob = forwardRef(function Blob(
  {
    gradient,
    morphDuration = 8,
    animate = true,
    extraDeformed = false,
    style,
  }: {
    gradient?: string[];
    morphDuration?: number;
    animate?: boolean;
    extraDeformed?: boolean;
    style?: CSSProperties;
  },
  ref: React.ForwardedRef<SVGSVGElement>
) {
  const blob = useRef<SVGPathElement>(null);
  const id = useId();

  const randomVariation = () => {
    const id = Math.floor(Math.random() * (extraDeformed ? deformedBlobs.length : regularBlobs.length));
    return extraDeformed ? deformedBlobs[id] : regularBlobs[id];
  };

  const { contextSafe } = useGSAP(() => {
    if (animate) {
      animation();
    }
  }, [animate]);

  const animation = contextSafe(() => {
    gsap.to(blob.current, {
      attr: {
        d: randomVariation(),
      },
      duration: morphDuration,
      ease: "power1.inOut",
      onComplete: animation,
    });
  });

  const [shape, setShape] = useState<string>(randomVariation());

  useEffect(() => {
    setShape(randomVariation());
  }, [randomVariation]);

  return (
    <svg ref={ref} style={style} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id}>
          {gradient ? (
            gradient.map((color, i) => <stop key={i} offset={(100 / Math.max(1, (gradient.length ?? 0) - 1)) * i + "%"} stopColor={color} />)
          ) : (
            <stop offset="0%" stopColor={"var(--accent)"} />
          )}
        </linearGradient>
      </defs>
      <path ref={blob} fill={"url(#" + id + ")"} d={shape} transform="translate(100 100)" />
    </svg>
  );
});
