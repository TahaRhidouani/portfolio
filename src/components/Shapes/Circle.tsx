import React, {CSSProperties, forwardRef, useId} from "react";

export const Circle = forwardRef(function Blob({gradient, style}: {
    gradient?: string[],
    style?: CSSProperties
}, ref: React.ForwardedRef<SVGSVGElement>) {

    const id = useId()

    // console.log(Math.max(0, (100 / ((gradient?.length ?? 0) - 1)) * 0) + "%")

    return (
        <svg ref={ref} style={style} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={id}>
                    {gradient ? gradient.map((color, i) => (
                        <stop key={i}
                              offset={100 / Math.max(1, ((gradient.length ?? 0) - 1)) * i + "%"}
                              stopColor={color}/>
                    )) : (<stop offset="0%" stopColor={"var(--accent)"}/>)}
                </linearGradient>
            </defs>
            <circle fill={"url(#" + id + ")"}
                    cx="50" cy="50" r="50"
                    transform="translate(50 50)"
            />
        </svg>
    )
})