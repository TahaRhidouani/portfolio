import React, { createContext, ReactNode, RefObject, useRef, useState } from "react";

export type ContextData = {
  content?: string;
  repoUrl?: string;
  websiteUrl?: string;
  trailerUrl?: string;
  rawRepoUrl?: string;
};

export const CardContext = createContext<{
  data?: ContextData;
  setData?: React.Dispatch<React.SetStateAction<ContextData>>;
  show?: boolean;
  setShow?: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCardFunction?: RefObject<Function | null>;
  fullscreenRef?: RefObject<HTMLDivElement | null>;
}>({});

export const CardProvider = ({ children, fullscreenRef }: { children: ReactNode; fullscreenRef: RefObject<HTMLDivElement | null> }) => {
  const [data, setData] = useState<ContextData>({});
  const [show, setShow] = useState<boolean>(false);
  const toggleCardFunction = useRef<Function | null>(null);

  return <CardContext.Provider value={{ data, setData, show, setShow, toggleCardFunction, fullscreenRef }}>{children}</CardContext.Provider>;
};
