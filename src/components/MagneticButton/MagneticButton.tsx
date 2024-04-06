import React, {CSSProperties, ReactNode, useId} from "react";

export function MagneticButton({
                                   children,
                                   onClick,
                                   href,
                                   smile = true,
                                   padding = "20px",
                                   borderRadius = "100%",
                                   style
                               }: {
    children: ReactNode;
    onClick?: () => void;
    href?: string;
    smile?: boolean;
    padding?: string;
    borderRadius?: string;
    style?: CSSProperties;
}) {
    const id = useId();

    const onclick = onClick ? onClick : (e: React.MouseEvent) => e.stopPropagation()

    return (
        <a data-cursor-stick={id} data-cursor-magnetic={borderRadius} data-smile-animation={smile}
           style={{padding: padding, textDecoration: "none"}}
           onClick={onclick} {...(href && {href: href, target: "_blank"})}>
            <div id={id} style={{pointerEvents: "none", ...style}}>
                {children}
            </div>
        </a>
    )
}