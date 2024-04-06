import React, { createContext, MutableRefObject, ReactNode, useRef, useState } from "react";

export enum AnimationStates {
  Idle,
  Smile,
  Sleep,
}

export const AnimationStateContext = createContext<{
  lastMoved?: MutableRefObject<number>;
  state?: AnimationStates;
  setState?: (state: AnimationStates) => void;
  showGlasses?: boolean;
  setShowGlasses?: (value: boolean) => void;
}>({});

export const AnimationStateProvider = ({ children }: { children: ReactNode }) => {
  const lastMoved = useRef<number>(0);
  const [state, setState] = useState<AnimationStates>(AnimationStates.Sleep);
  const [showGlasses, setShowGlasses] = useState<boolean>(false);

  return <AnimationStateContext.Provider value={{ lastMoved, state, setState, showGlasses, setShowGlasses }}>{children}</AnimationStateContext.Provider>;
};
