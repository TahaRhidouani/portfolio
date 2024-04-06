import React, {createContext, MutableRefObject, ReactNode, RefObject, useRef, useState} from "react";

export type ContextData = {
    content?: string;
    repoUrl?: string;
    websiteUrl?: string;
    trailerUrl?: string;
    rawRepoUrl?: string;
}

export const CardContext = createContext<{
    data?: ContextData;
    setData?: React.Dispatch<React.SetStateAction<ContextData>>;
    show?: boolean;
    setShow?: React.Dispatch<React.SetStateAction<boolean>>;
    toggleCardFunction?: MutableRefObject<Function | null>;
    fullscreenRef?: RefObject<HTMLDivElement>;
}>({});

export const CardProvider = ({children, fullscreenRef}: {
    children: ReactNode,
    fullscreenRef: RefObject<HTMLDivElement>
}) => {
    const [data, setData] = useState<ContextData>({});
    const [show, setShow] = useState<boolean>(false);
    const toggleCardFunction = useRef<Function | null>(null);

    return (
        <CardContext.Provider value={{data, setData, show, setShow, toggleCardFunction, fullscreenRef}}>
            {children}
        </CardContext.Provider>
    );
};