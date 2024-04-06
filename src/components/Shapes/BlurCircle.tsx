import React, {CSSProperties, forwardRef} from "react";

export const BlurCircle = forwardRef(function Blob({blur = 10, dark = true, style}: {
    blur?: number,
    dark?: boolean,
    style?: CSSProperties
}, ref: React.ForwardedRef<HTMLDivElement>) {

    const color = dark ? 0 : 255

    return (
        <div ref={ref} style={{
            ...{
                borderRadius: "50%",
                aspectRatio: "1",
                background: "rgba(" + color + ", " + color + ", " + color + ", " + (dark ? 0.2 : 0.05) + ")",
                backdropFilter: "blur(" + blur + "px)",
            },
            ...style
        }}/>
    )
})