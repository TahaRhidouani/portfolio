import {CSSProperties, ReactNode, useRef} from "react";
import {useGSAP} from "@gsap/react";
import {gsap} from "gsap";

export function MaskText({children, dangerouslySetInnerHTML, style, show, delay = 0, duration = 0.5}: {
    children?: ReactNode,
    dangerouslySetInnerHTML?: { __html: string | TrustedHTML; },
    style?: CSSProperties,
    show: boolean,
    delay?: number,
    duration?: number
}) {
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        gsap.fromTo(ref.current, {
            y: show ? "100%" : "0%",
            rotate: show ? "3deg" : "0deg",
        }, {
            y: show ? "0%" : "100%",
            rotate: show ? "0deg" : "3deg",
            duration: duration,
            delay: delay,
            ease: "power3.inOut"
        })
    }, [show]);

    return (
        <div style={{overflow: "visible hidden", ...style}}>
            <div ref={ref} style={{
                overflow: "hidden",
                transformOrigin: "top left",
                willChange: "transform"
            }} dangerouslySetInnerHTML={dangerouslySetInnerHTML}>
                {children}
            </div>
        </div>
    );
}