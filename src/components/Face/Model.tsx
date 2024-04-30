import { AnimationStateContext, AnimationStates } from "@/components/Face/AnimationStateContext";
import { SleepText } from "@/components/Face/SleepText";
import { useGSAP } from "@gsap/react";
import { Html, Outlines, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import { easing } from "maath";
import React, { useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useMediaQuery } from "usehooks-ts";

export function Model({ offset }: { offset: React.MutableRefObject<number | null> }) {
  const x = useRef<number>(window.innerWidth / 2);
  const y = useRef<number>(window.innerHeight / 2);
  const mesh = useRef<THREE.Group>(null);
  const currentRotation = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const glasses = useRef<THREE.Mesh>(null);
  const altAnimation = useRef<boolean>(false);
  const smileTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastMovedFace = useRef<number>();
  const lastAnimationState = useRef<any>(AnimationStates.Idle);

  const mobileOrientation = new THREE.Euler(0, 0, 0);
  const mobileOrientationSleep = new THREE.Euler(0.3, 0, 0);

  const [dummy] = useState(() => new THREE.Object3D());

  const isMobile = useMediaQuery("(orientation: portrait) or (hover: none)");

  const { nodes, materials, animations } = useGLTF("./assets/head.glb") as GLTFResult;
  const { actions } = useAnimations<GLTFActions>(animations, mesh);

  const { lastMoved, state, setState, showGlasses } = useContext(AnimationStateContext);

  const updateMousePosition = (e: { clientX: number; clientY: number }) => {
    x.current = e.clientX;
    y.current = e.clientY;
  };

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition);

    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  useFrame((s, dt) => {
    if (mesh.current && !altAnimation.current) {
      if (!isMobile) {
        const normalizedOffset = ((offset.current ?? 0) - -25) / (25 - -25);
        const pointerOffset = normalizedOffset * (0.8 - 0.2) + 0.2;

        const canvasX = x.current / window.innerWidth - pointerOffset;
        const canvasY = -y.current / window.innerHeight + 0.5;

        dummy.lookAt(canvasX, canvasY, 1);
        easing.dampE(mesh.current.rotation, dummy.rotation, 0.1, dt);
      } else {
        if (state === AnimationStates.Sleep) {
          easing.dampE(mesh.current.rotation, mobileOrientationSleep, 0.1, dt);
        } else {
          easing.dampE(mesh.current.rotation, mobileOrientation, 0.1, dt);
        }
      }

      currentRotation.current = {
        x: mesh.current.rotation.x,
        y: mesh.current.rotation.y,
        z: mesh.current.rotation.z,
      };

      if (Date.now() - lastMoved!.current > 30000) {
        if (lastMovedFace.current !== lastMoved!.current) {
          lastMovedFace.current = lastMoved!.current;
          setState!(AnimationStates.Sleep);
        }
      } else if (state === AnimationStates.Sleep) {
        setState!(AnimationStates.Idle);
      }
    }
  });

  useEffect(() => {
    switch (state) {
      case AnimationStates.Idle:
        if (lastAnimationState.current === AnimationStates.Sleep) {
          actions.Idle!.reset().fadeIn(0.3).play();
          actions.Smile?.fadeOut(0.3);
          actions.Sleeping!.fadeOut(0.3);
        } else {
          smileTimeout.current = setTimeout(() => {
            actions.Idle!.reset().fadeIn(0.3).play();
            actions.Idle!.paused = true;
            setTimeout(() => (actions.Idle!.paused = false), randomInt(1000, 5000));
            actions.Smile?.fadeOut(0.3);
            actions.Sleeping!.fadeOut(0.3);
            smileTimeout.current = undefined;
          }, 800);
        }
        break;

      case AnimationStates.Smile:
        if (smileTimeout.current) {
          clearTimeout(smileTimeout.current);
          smileTimeout.current = undefined;
        } else {
          actions.Smile?.reset().fadeIn(0.1).play();
          actions.Sleeping?.fadeOut(0.1);
          actions.Idle!.fadeOut(0.1);
        }
        break;

      case AnimationStates.Sleep:
        actions.Sleeping!.reset().fadeIn(0.5).play();
        actions.Smile?.fadeOut(0.1);
        actions.Idle!.fadeOut(0.1);
        y.current = window.innerHeight * 0.8;
        clearTimeout(smileTimeout.current);
        smileTimeout.current = undefined;
        break;
    }

    lastAnimationState.current = state;
  }, [state, actions]);

  useGSAP(() => {
    const tl = gsap.timeline({
      onStart: () => {
        altAnimation.current = true;
      },
      onComplete: () => {
        altAnimation.current = false;
      },
    });

    tl.fromTo(
      mesh.current!.rotation,
      {
        y: currentRotation.current.y,
      },
      {
        duration: 0.6,
        y: (showGlasses ? "+" : "-") + "=" + Math.PI * 2,
        ease: "power4.inOut",
      },
      "start"
    );

    tl.fromTo(
      glasses.current!,
      {
        visible: !showGlasses,
      },
      {
        visible: showGlasses,
        duration: 0.01,
      },
      "<+=0.3"
    );
  }, [showGlasses]);

  useEffect(() => {
    window.addEventListener("visibilitychange", PageBlur);
    window.addEventListener("blur", PageBlur);

    function PageBlur() {
      if (document.visibilityState === "hidden" || !document.hasFocus()) {
        clearTimeout(smileTimeout.current);
        smileTimeout.current = undefined;
        lastMoved!.current = 0;
        setState!(AnimationStates.Sleep);
      }
    }

    return () => {
      window.removeEventListener("visibilitychange", PageBlur);
      window.removeEventListener("blur", PageBlur);
    };
  }, [lastMoved, setState]);

  const isSleeping = state === AnimationStates.Sleep && offset.current !== null && offset.current < 100 && offset.current > -100;

  return (
    <group ref={mesh} dispose={null} position={[0, -0.025, 0]} scale={10}>
      <group name="Scene">
        <Html distanceFactor={5} position={[0, 0, 0.1]} scale={1}>
          <SleepText visible={isSleeping} direction={offset.current ?? 0 > 0 ? "left" : "right"} />
        </Html>

        <mesh
          ref={glasses}
          name="glasses"
          castShadow
          receiveShadow
          geometry={nodes.glasses.geometry}
          material={materials.Glasses}
          position={[0, -0.01180774, 0.05036403]}
          rotation={[-0.0185405, Math.PI / 2, 0]}
          scale={0.04336883}
          renderOrder={1}
        >
          <Outlines thickness={0.04} color="black" />
        </mesh>
        <group name="spine" position={[0, 0.28888801, -0.04879069]} rotation={[0.14086974, 2.4e-7, 0]} />
        <group name="spine001" position={[0, 0.4191733, -0.03031507]} rotation={[-0.11397948, 2.4e-7, 0]} />
        <group name="spine002" position={[0, 0.49480927, -0.03897355]} rotation={[-0.07135298, 2.4e-7, 0]} />
        <group name="spine003" position={[0, 0.56282514, -0.04383494]} rotation={[-0.15436, 2.4e-7, 0]} />
        <group name="spine004" position={[0, 0.69119173, -0.0638085]} rotation={[0.37770063, 4.8e-7, 0]} />
        <group name="spine005" position={[0, 0.74555081, -0.0422416]} rotation={[0.18769953, 2.4e-7, 0]} />
        <group name="spine006" position={[0, 0.79999834, -0.03190009]} />
        <group name="face" position={[0, 0.79999834, -0.03190009]} />
        <group name="nose" position={[0, 0.88104039, 0.08090857]} rotation={[2.63285613, 4.8e-7, 0]} />
        <group name="nose001" position={[0, 0.85320109, 0.09643458]} rotation={[2.33703835, 9.5e-7, 0]} />
        <group name="nose004" position={[0, 0.83361119, 0.0921642]} rotation={[-3.01389266, 2.4e-7, 0]} />
        <group name="earL" position={[0.0868528, 0.84844929, -0.03232452]} rotation={[0.0660214, -0.22029964, -0.02598935]} />
        <group name="earL001" position={[0.08769782, 0.8816759, -0.02993802]} rotation={[-1.42072707, 0.18401726, -0.40414771]} />
        <group name="earL002" position={[0.0990375, 0.8836211, -0.05691951]} rotation={[3.06198655, 0.49373903, 0.14615349]} />
        <group name="earL003" position={[0.09506913, 0.85293335, -0.05661396]} rotation={[2.16625381, 0.32753112, 0.22637254]} />
        <group name="earL004" position={[0.08927283, 0.83639491, -0.03571379]} rotation={[0.32269324, -0.2462885, 0.19692812]} />
        <group name="earR" position={[-0.0868528, 0.84844929, -0.03232452]} rotation={[0.0660214, 0.22029964, 0.02598935]} />
        <group name="earR001" position={[-0.08769782, 0.8816759, -0.02993802]} rotation={[-1.42072707, -0.18401726, 0.40414771]} />
        <group name="earR002" position={[-0.0990375, 0.8836211, -0.05691951]} rotation={[3.06198655, -0.49373903, -0.14615349]} />
        <group name="earR003" position={[-0.09506913, 0.85293335, -0.05661396]} rotation={[2.16625381, -0.32753112, -0.22637254]} />
        <group name="earR004" position={[-0.08927283, 0.83639491, -0.03571379]} rotation={[0.32269324, 0.2462885, -0.19692812]} />
        <group name="browBL" position={[0.0734411, 0.89746344, 0.04787607]} rotation={[-0.76913769, 0.99227622, 1.72847458]} />
        <group name="browBL001" position={[0.06222581, 0.90706468, 0.06248371]} rotation={[-0.6487516, 0.55896486, 1.80823276]} />
        <group name="browBL002" position={[0.04530545, 0.90961075, 0.07383546]} rotation={[-0.45347023, 0.05679335, 2.05213709]} />
        <group name="browBL003" position={[0.02927791, 0.90247244, 0.07832795]} rotation={[-0.28488416, -0.17260132, 2.35976879]} />
        <group name="browBR" position={[-0.0734411, 0.89746344, 0.04787607]} rotation={[-0.76913769, -0.99227622, -1.72847458]} />
        <group name="browBR001" position={[-0.06222581, 0.90706468, 0.06248371]} rotation={[-0.6487516, -0.55896486, -1.80823276]} />
        <group name="browBR002" position={[-0.04530545, 0.90961075, 0.07383546]} rotation={[-0.45347023, -0.05679335, -2.05213709]} />
        <group name="browBR003" position={[-0.02927791, 0.90247244, 0.07832795]} rotation={[-0.28488416, 0.17260132, -2.35976879]} />
        <group name="foreheadL" position={[0.01484934, 0.96714181, 0.06338318]} rotation={[-2.15499382, 1.4047328, -1.47328816]} />
        <group name="foreheadL001" position={[0.0423383, 0.97173816, 0.05003645]} rotation={[-3.06512935, 1.2568456, -0.60337707]} />
        <group name="foreheadL002" position={[0.06355164, 0.96829093, 0.02935344]} rotation={[2.84218294, 0.7219783, -0.2382768]} />
        <group name="templeL" position={[0.07716354, 0.95114338, -0.00096396]} rotation={[3.10449287, -0.0214327, -0.0673868]} />
        <group name="cheekBL" position={[0.02899424, 0.81137615, 0.07494673]} rotation={[-1.06536597, -0.34689805, -0.88399516]} />
        <group name="cheekBL001" position={[0.06505425, 0.83800578, 0.0537488]} rotation={[-0.65427516, -0.623757, -0.40076767]} />
        <group name="browTL" position={[0.07905418, 0.87643814, 0.03696842]} rotation={[0.48002756, -0.73999908, 0.16691437]} />
        <group name="browTL001" position={[0.07336281, 0.91941184, 0.05348362]} rotation={[1.54887517, -0.20381526, 0.76432173]} />
        <group name="browTL002" position={[0.05197269, 0.92433119, 0.07616415]} rotation={[1.69838267, 0.02105458, 1.20395485]} />
        <group name="browTL003" position={[0.02329925, 0.92233014, 0.08701751]} rotation={[2.09923404, 1.02930246, 1.23964275]} />
        <group name="foreheadR" position={[-0.01484934, 0.96714181, 0.06338318]} rotation={[-2.15499382, -1.4047328, 1.47328816]} />
        <group name="foreheadR001" position={[-0.0423383, 0.97173816, 0.05003645]} rotation={[-3.06512935, -1.2568456, 0.60337707]} />
        <group name="foreheadR002" position={[-0.06355164, 0.96829093, 0.02935344]} rotation={[2.84218294, -0.7219783, 0.2382768]} />
        <group name="templeR" position={[-0.07716354, 0.95114338, -0.00096396]} rotation={[3.10449287, 0.0214327, 0.0673868]} />
        <group name="cheekBR" position={[-0.02899424, 0.81137615, 0.07494673]} rotation={[-1.06536597, 0.34689805, 0.88399516]} />
        <group name="cheekBR001" position={[-0.06505425, 0.83800578, 0.0537488]} rotation={[-0.65427516, 0.623757, 0.40076767]} />
        <group name="browTR" position={[-0.07905418, 0.87643814, 0.03696842]} rotation={[0.48002756, 0.73999908, -0.16691437]} />
        <group name="browTR001" position={[-0.07336281, 0.91941184, 0.05348362]} rotation={[1.54887517, 0.20381526, -0.76432173]} />
        <group name="browTR002" position={[-0.05197269, 0.92433119, 0.07616415]} rotation={[1.69838267, -0.02105458, -1.20395485]} />
        <group name="browTR003" position={[-0.02329925, 0.92233014, 0.08701751]} rotation={[2.09923404, -1.02930246, -1.23964275]} />
        <group name="eyeL" position={[0.03895602, 0.88168663, 0.03868516]} rotation={[-Math.PI / 2, 1.5e-7, -Math.PI]} />
        <group name="lidTL" position={[0.07056371, 0.8778457, 0.04846411]} rotation={[-0.93566904, 1.09772988, 1.62982149]} />
        <group name="lidTL001" position={[0.06009041, 0.89351201, 0.06169758]} rotation={[-1.59228399, 0.21474187, 2.034154]} />
        <group name="lidTL002" position={[0.04454608, 0.89707232, 0.06957202]} rotation={[-1.78352508, -0.52703136, 1.4264402]} />
        <group name="lidTL003" position={[0.02519908, 0.88538039, 0.06876843]} rotation={[-2.89945039, -0.76598069, 0.44051881]} />
        <group name="lidBL" position={[0.02055449, 0.8710373, 0.06982775]} rotation={[-1.78618133, 0.4738733, -1.34693743]} />
        <group name="lidBL001" position={[0.03083173, 0.8653264, 0.06838534]} rotation={[-1.59455118, 0.07312758, -1.43453871]} />
        <group name="lidBL002" position={[0.04871637, 0.86395818, 0.06595847]} rotation={[-1.34874649, -0.12104172, -1.03337022]} />
        <group name="lidBL003" position={[0.06141876, 0.8671447, 0.05886035]} rotation={[-0.91465122, -0.22951297, -0.56647939]} />
        <group name="eyeR" position={[-0.03895602, 0.88168663, 0.03868516]} rotation={[-Math.PI / 2, 1.5e-7, -Math.PI]} />
        <group name="lidTR" position={[-0.07056371, 0.8778457, 0.04846411]} rotation={[-0.93566943, -1.0977299, -1.62982193]} />
        <group name="lidTR001" position={[-0.06009041, 0.89351201, 0.06169758]} rotation={[-1.59228386, -0.21474194, -2.0341542]} />
        <group name="lidTR002" position={[-0.04454608, 0.89707232, 0.06957202]} rotation={[-1.78352518, 0.52703137, -1.4264403]} />
        <group name="lidTR003" position={[-0.02519908, 0.88538039, 0.06876843]} rotation={[-2.89945052, 0.76598057, -0.44051862]} />
        <group name="lidBR" position={[-0.02055448, 0.8710373, 0.06982775]} rotation={[-1.78618142, -0.47387344, 1.34693729]} />
        <group name="lidBR001" position={[-0.03083173, 0.8653264, 0.06838534]} rotation={[-1.59455085, -0.07312755, 1.43453839]} />
        <group name="lidBR002" position={[-0.04871637, 0.86395818, 0.06595847]} rotation={[-1.34874602, 0.12104161, 1.03336986]} />
        <group name="lidBR003" position={[-0.06141875, 0.8671447, 0.05886035]} rotation={[-0.91465105, 0.22951279, 0.5664793]} />
        <group name="cheekTL" position={[0.07905418, 0.87643814, 0.03696842]} rotation={[-3.05315672, -0.84143203, 1.10213666]} />
        <group name="cheekTL001" position={[0.04798719, 0.84985787, 0.06950738]} rotation={[-3.01532397, -0.1204887, 1.94442458]} />
        <group name="cheekTR" position={[-0.07905418, 0.87643814, 0.03696842]} rotation={[-3.05315672, 0.84143203, -1.10213666]} />
        <group name="cheekTR001" position={[-0.04798719, 0.84985787, 0.06950738]} rotation={[-3.01532397, 0.1204887, -1.94442458]} />
        <group name="teethT" position={[0, 0.81491488, 0.0790236]} rotation={[-Math.PI / 2, 0, 0]} />
        <group name="jaw_master" position={[0, 0.88175827, 0.00151093]} rotation={[2.64131966, 0, 0]} />
        <group name="lipTL" position={[0, 0.8147772, 0.09168467]} rotation={[-1.58281199, -0.01073327, -1.34784846]} />
        <group name="lipTL001" position={[0.01723585, 0.81491524, 0.08777483]} rotation={[-1.77141301, 0.07738983, -0.72633755]} />
        <group name="lipBL" position={[0, 0.805794, 0.08866864]} rotation={[-1.39259077, -0.10177539, -1.2529214]} />
        <group name="lipBL001" position={[0.01643042, 0.80840874, 0.08361789]} rotation={[-1.2945673, -0.03898454, -0.94161162]} />
        <group name="jaw" position={[0, 0.77963257, 0.00324057]} rotation={[1.78196589, 0.00000238, 0]} />
        <group name="chin" position={[0, 0.76649648, 0.06451963]} rotation={[0.64993046, 2.4e-7, 0]} />
        <group name="chin001" position={[0, 0.78012633, 0.07487962]} rotation={[0.34948621, 2.4e-7, 0]} />
        <group name="lipTR" position={[0, 0.8147772, 0.09168467]} rotation={[-1.58281199, 0.01073327, 1.34784846]} />
        <group name="lipTR001" position={[-0.01723585, 0.81491524, 0.08777483]} rotation={[-1.77141301, -0.07738983, 0.72633755]} />
        <group name="lipBR" position={[0, 0.805794, 0.08866864]} rotation={[-1.39259077, 0.10177539, 1.2529214]} />
        <group name="lipBR001" position={[-0.01643042, 0.80840874, 0.08361789]} rotation={[-1.2945673, 0.03898454, 0.94161162]} />
        <group name="jawL" position={[0.08184815, 0.88175827, 0.00151092]} rotation={[3.06237536, -0.02390906, 0.18468828]} />
        <group name="jawL001" position={[0.06920853, 0.81431741, 0.00716781]} rotation={[2.33846493, -0.29158871, 0.5008493]} />
        <group name="chinL" position={[0.03420652, 0.77551466, 0.06249929]} rotation={[0.59633533, -1.08372488, 0.29489882]} />
        <group name="jawR" position={[-0.08184815, 0.88175827, 0.00151092]} rotation={[3.06237536, 0.02390906, -0.18468828]} />
        <group name="jawR001" position={[-0.06920853, 0.81431741, 0.00716781]} rotation={[2.33846493, 0.29158871, -0.5008493]} />
        <group name="chinR" position={[-0.03420652, 0.77551466, 0.06249929]} rotation={[0.59633533, 1.08372488, -0.29489882]} />
        <group name="teethB" position={[0, 0.79925972, 0.07781545]} rotation={[-Math.PI / 2, 0, 0]} />
        <group name="tongue" position={[0, 0.80538011, 0.07450833]} rotation={[-1.58660959, 0, 0]} />
        <group name="tongue001" position={[0, 0.80514222, 0.05946641]} rotation={[-1.82872968, 0, 0]} />
        <group name="tongue002" position={[0, 0.79963022, 0.03857257]} rotation={[-2.37729227, 2.4e-7, 0]} />
        <group name="chin_end_glue001" position={[0, 0.79735428, 0.08115828]} rotation={[0.7271971, Math.PI / 4, -3.3e-7]} />
        <group name="nose_master" position={[0, 0.8406316, 0.0861811]} rotation={[-Math.PI / 2, 1.5e-7, Math.PI]} />
        <group name="nose002" position={[0, 0.84267402, 0.10737292]} rotation={[-2.69631779, 0, 0]} />
        <group name="nose003" position={[0, 0.83429283, 0.10337308]} rotation={[-1.63153403, -3e-8, 0]} />
        <group name="noseL001" position={[0.0124255, 0.8406316, 0.08618111]} rotation={[-1.58654239, 0.13664178, 2.60779648]} />
        <group name="noseR001" position={[-0.0124255, 0.8406316, 0.0861811]} rotation={[-1.58654242, -0.13664169, -2.6077965]} />
        <group name="browBL004" position={[0.01709325, 0.88992035, 0.0797904]} rotation={[0.3099809, -0.90427403, -2.98340438]} />
        <group name="noseL" position={[0.0200341, 0.86038262, 0.07425502]} rotation={[-0.54698897, -0.0114168, 2.82302992]} />
        <group name="browBR004" position={[-0.01709325, 0.88992035, 0.0797904]} rotation={[0.3099809, 0.90427403, 2.98340438]} />
        <group name="noseR" position={[-0.0200341, 0.86038262, 0.07425502]} rotation={[-0.54698897, 0.0114168, -2.82302992]} />
        <group name="brow_glueBL002" position={[0.04530545, 0.90961075, 0.07383546]} rotation={[0.28061502, 0.26915868, -0.43742968]} />
        <group name="brow_glueBR002" position={[-0.04530545, 0.90961075, 0.07383546]} rotation={[0.28061502, -0.26915868, 0.43742968]} />
        <group name="lid_glueBL002" position={[0.04871637, 0.86395818, 0.06595847]} rotation={[2.85102294, 0.72002144, 0.06667266]} />
        <group name="lid_glueBR002" position={[-0.04871637, 0.86395818, 0.06595847]} rotation={[2.85102294, -0.72002144, -0.06667266]} />
        <group name="cheek_glueTL001" position={[0.04798719, 0.84985787, 0.06950738]} rotation={[-1.3837575, 0.70682572, -1.03651217]} />
        <group name="cheek_glueTR001" position={[-0.04798719, 0.84985787, 0.06950738]} rotation={[-1.3837575, -0.70682572, 1.03651217]} />
        <group name="nose_glueL001" position={[0.0124255, 0.8406316, 0.0861811]} rotation={[-2.93546645, 0.95673322, -0.32416079]} />
        <group name="nose_glueR001" position={[-0.0124255, 0.8406316, 0.0861811]} rotation={[-2.93546645, -0.95673322, 0.32416079]} />
        <group name="nose_glue004" position={[0, 0.83361119, 0.0921642]} rotation={[-3.11613741, Math.PI / 4, 4e-8]} />
        <group name="nose_end_glue004" position={[0, 0.82046682, 0.0904765]} rotation={[2.93235117, Math.PI / 4, 2.4e-7]} />
        <group name="shoulderL" position={[0.01617518, 0.64425719, 0.02183804]} rotation={[-1.56728102, 0.01839401, -0.95816174]} />
        <group name="upper_armL" position={[0.14156432, 0.63073927, -0.05939208]} rotation={[0.10506998, 0.18893104, -2.08234656]} />
        <group name="forearmL" position={[0.28399581, 0.55263543, -0.09501435]} rotation={[-0.17391617, -0.25685469, -2.17597221]} />
        <group name="handL" position={[0.40907723, 0.47020847, -0.04717603]} rotation={[-0.05977462, -0.08017347, -2.2126822]} />
        <group name="palm01L" position={[0.42792588, 0.45989069, -0.03172819]} rotation={[1.58746625, -0.6313815, -1.30983234]} />
        <group name="f_index01L" position={[0.45922512, 0.43683425, -0.02175626]} rotation={[1.81147444, -0.9433979, -1.28934566]} />
        <group name="f_index02L" position={[0.47386599, 0.41550696, -0.01956589]} rotation={[1.87742986, -1.0959583, -1.23904353]} />
        <group name="f_index03L" position={[0.48089823, 0.40086603, -0.01864363]} rotation={[2.08273646, -1.31390995, -1.11274168]} />
        <group name="thumb01L" position={[0.41547543, 0.45159039, -0.03115177]} rotation={[2.79250308, 0.44642214, -0.41553412]} />
        <group name="thumb02L" position={[0.42423686, 0.43233815, -0.01968117]} rotation={[3.07740766, 0.27076613, -0.66553653]} />
        <group name="thumb03L" position={[0.43570751, 0.41740909, -0.01553101]} rotation={[3.10584198, 0.25255088, -0.75529775]} />
        <group name="palm02L" position={[0.43075043, 0.45960248, -0.04123899]} rotation={[1.56555213, -0.61922568, -1.40883692]} />
        <group name="f_middle01L" position={[0.46233782, 0.4371224, -0.03478317]} rotation={[1.73143673, -1.04096412, -1.34468376]} />
        <group name="f_middle02L" position={[0.47640219, 0.41239432, -0.0323046]} rotation={[1.65304851, -1.28831646, -1.44206087]} />
        <group name="f_middle03L" position={[0.48153225, 0.3945832, -0.03138234]} rotation={[1.48624213, -1.40664064, -1.64540954]} />
        <group name="palm03L" position={[0.43034688, 0.45942956, -0.05023102]} rotation={[1.52309089, -0.59757668, -1.56323245]} />
        <group name="f_ring01L" position={[0.46360588, 0.43683425, -0.04884763]} rotation={[1.47932849, -1.16938343, -1.60588923]} />
        <group name="f_ring02L" position={[0.47369307, 0.41308603, -0.04757952]} rotation={[1.28439271, -1.3107098, -1.83229645]} />
        <group name="f_ring03L" position={[0.47824675, 0.39533255, -0.04729132]} rotation={[-0.39747717, -1.3998311, 2.71701133]} />
        <group name="palm04L" position={[0.42838708, 0.45925665, -0.05893484]} rotation={[1.55755517, -0.63579053, -1.66835414]} />
        <group name="f_pinky01L" position={[0.46291414, 0.43372157, -0.0627968]} rotation={[0.87037213, -1.28379195, -2.25801516]} />
        <group name="f_pinky02L" position={[0.46643028, 0.41804317, -0.06291209]} rotation={[0.56605927, -1.32564842, -2.58431827]} />
        <group name="f_pinky03L" position={[0.46810183, 0.40513152, -0.06320029]} rotation={[-0.17558226, -1.32726353, 2.94707565]} />
        <group name="shoulderR" position={[-0.01617518, 0.64425719, 0.02183804]} rotation={[-1.56728108, -0.01839394, 0.95816205]} />
        <group name="upper_armR" position={[-0.14156432, 0.63073933, -0.05939208]} rotation={[0.10507, -0.18893118, 2.08234679]} />
        <group name="forearmR" position={[-0.28399575, 0.55263549, -0.09501436]} rotation={[-0.17391626, 0.25685456, 2.17597217]} />
        <group name="handR" position={[-0.40907717, 0.47020853, -0.04717603]} rotation={[-0.05977467, 0.08017333, 2.21268243]} />
        <group name="palm01R" position={[-0.42792583, 0.45989075, -0.03172819]} rotation={[1.58746601, 0.63138133, 1.30983247]} />
        <group name="f_index01R" position={[-0.45922506, 0.43683431, -0.02175626]} rotation={[1.8114741, 0.94339802, 1.28934605]} />
        <group name="f_index02R" position={[-0.47386593, 0.41550702, -0.01956589]} rotation={[1.87742953, 1.09595835, 1.2390439]} />
        <group name="f_index03R" position={[-0.48089817, 0.40086609, -0.01864363]} rotation={[2.08273567, 1.31390991, 1.11274253]} />
        <group name="thumb01R" position={[-0.41547537, 0.45159048, -0.03115178]} rotation={[2.79250303, -0.44642199, 0.41553401]} />
        <group name="thumb02R" position={[-0.4242368, 0.43233824, -0.01968117]} rotation={[3.0774078, -0.27076612, 0.66553655]} />
        <group name="thumb03R" position={[-0.43570745, 0.41740918, -0.015531]} rotation={[3.10584216, -0.25255088, 0.75529766]} />
        <group name="palm02R" position={[-0.43075034, 0.45960256, -0.04123899]} rotation={[1.56555186, 0.61922564, 1.40883712]} />
        <group name="f_middle01R" position={[-0.46233773, 0.43712249, -0.03478317]} rotation={[1.73143655, 1.04096406, 1.34468396]} />
        <group name="f_middle02R" position={[-0.4764021, 0.4123944, -0.0323046]} rotation={[1.65304816, 1.28831635, 1.44206121]} />
        <group name="f_middle03R" position={[-0.48153216, 0.39458328, -0.03138234]} rotation={[1.48623961, 1.40664063, 1.64541216]} />
        <group name="palm03R" position={[-0.43034682, 0.45942962, -0.05023102]} rotation={[1.52309048, 0.59757678, 1.56323273]} />
        <group name="f_ring01R" position={[-0.46360582, 0.43683431, -0.04884763]} rotation={[1.47932852, 1.16938338, 1.60588925]} />
        <group name="f_ring02R" position={[-0.47369301, 0.41308609, -0.04757952]} rotation={[1.28439277, 1.31070979, 1.83229649]} />
        <group name="f_ring03R" position={[-0.47824669, 0.3953326, -0.04729132]} rotation={[-0.3974768, 1.39983112, -2.71701156]} />
        <group name="palm04R" position={[-0.42838702, 0.45925671, -0.05893485]} rotation={[1.55755492, 0.63579055, 1.66835426]} />
        <group name="f_pinky01R" position={[-0.46291408, 0.43372163, -0.06279681]} rotation={[0.87037171, 1.28379184, 2.25801566]} />
        <group name="f_pinky02R" position={[-0.46643022, 0.41804323, -0.0629121]} rotation={[0.56605894, 1.32564827, 2.58431868]} />
        <group name="f_pinky03R" position={[-0.46810177, 0.40513158, -0.0632003]} rotation={[-0.17558199, 1.32726337, -2.94707583]} />
        <group name="breastL" position={[0.1046525, 0.55743337, -0.08148863]} rotation={[-Math.PI / 2, 1.4e-7, Math.PI]} />
        <group name="breastR" position={[-0.10465249, 0.55743337, -0.08148862]} rotation={[-Math.PI / 2, 1.4e-7, Math.PI]} />
        <group name="pelvisL" position={[0, 0.28888801, -0.04879069]} rotation={[-1.7822977, -0.81989225, -2.23719947]} />
        <group name="pelvisR" position={[0, 0.28888801, -0.04879069]} rotation={[-1.78229771, 0.81989248, 2.23719949]} />
        <group name="thighL" position={[0.08662115, 0.34377757, -0.01096023]} rotation={[2.9002348, 2.4e-7, 1e-8]} />
        <group name="shinL" position={[0.08662115, 0.19655631, 0.02527924]} rotation={[-2.82592685, 2.4e-7, 0]} />
        <group name="footL" position={[0.08662115, 0.07530735, -0.014319]} rotation={[2.12939572, 0, 0]} />
        <group name="toeL" position={[0.08662115, 0.01476093, 0.08255529]} rotation={[-Math.PI / 2, -1.5e-7, Math.PI]} />
        <group name="heel02L" position={[0.05303336, -2e-8, -0.04057049]} rotation={[-Math.PI / 2, 9e-8, -Math.PI / 2]} />
        <group name="thighR" position={[-0.08662115, 0.34377757, -0.01096023]} rotation={[2.90023477, 2.4e-7, 1e-8]} />
        <group name="shinR" position={[-0.08662115, 0.19655631, 0.02527924]} rotation={[-2.82592671, 2.4e-7, 0]} />
        <group name="footR" position={[-0.08662115, 0.07530738, -0.014319]} rotation={[2.12939563, 0, 0]} />
        <group name="toeR" position={[-0.08662115, 0.01476096, 0.08255529]} rotation={[-Math.PI / 2, -1.5e-7, -Math.PI]} />
        <group name="heel02R" position={[-0.05303336, 1e-8, -0.0405705]} rotation={[-Math.PI / 2, -9e-8, Math.PI / 2]} />
        <group name="rig" position={[0, -0.86104661, 0]}>
          <primitive object={nodes.root} />
          <primitive object={nodes["MCH-torsoparent"]} />
          <primitive object={nodes["MCH-hand_ikparentL"]} />
          <primitive object={nodes["MCH-upper_arm_ik_targetparentL"]} />
          <primitive object={nodes["MCH-hand_ikparentR"]} />
          <primitive object={nodes["MCH-upper_arm_ik_targetparentR"]} />
          <primitive object={nodes["MCH-eye_commonparent"]} />
          <primitive object={nodes["MCH-foot_ikparentL"]} />
          <primitive object={nodes["MCH-thigh_ik_targetparentL"]} />
          <primitive object={nodes["MCH-foot_ikparentR"]} />
          <primitive object={nodes["MCH-thigh_ik_targetparentR"]} />
          <primitive object={nodes["MCH-lip_armBL001"]} />
          <primitive object={nodes["MCH-lip_armBR001"]} />
          <primitive object={nodes["MCH-lip_armTL001"]} />
          <primitive object={nodes["MCH-lip_armTR001"]} />
          <primitive object={nodes["DEF-spine"]} />
          <primitive object={nodes["DEF-spine001"]} />
          <primitive object={nodes["DEF-spine002"]} />
          <primitive object={nodes["DEF-spine003"]} />
          <primitive object={nodes["DEF-spine004"]} />
          <primitive object={nodes["DEF-spine005"]} />
          <primitive object={nodes["DEF-spine006"]} />
          <primitive object={nodes.VIS_upper_arm_ik_poleL} />
          <primitive object={nodes.VIS_upper_arm_ik_poleR} />
          <primitive object={nodes.VIS_thigh_ik_poleL} />
          <primitive object={nodes.VIS_thigh_ik_poleR} />
          <primitive object={nodes.torso} />
          <primitive object={nodes.hips} />
          <primitive object={nodes.chest} />
          <primitive object={nodes["MCH-spine001"]} />
          <primitive object={nodes.spine_fk001} />
          <primitive object={nodes["MCH-spine"]} />
          <primitive object={nodes.spine_fk} />
          <primitive object={nodes.tweak_spine} />
          <primitive object={nodes["ORG-spine"]} />
          <primitive object={nodes["ORG-pelvisL"]} />
          <primitive object={nodes["DEF-pelvisL"]} />
          <primitive object={nodes["ORG-pelvisR"]} />
          <primitive object={nodes["DEF-pelvisR"]} />
          <primitive object={nodes["ORG-thighL"]} />
          <primitive object={nodes["ORG-shinL"]} />
          <primitive object={nodes["ORG-footL"]} />
          <primitive object={nodes["ORG-toeL"]} />
          <primitive object={nodes["ORG-heel02L"]} />
          <primitive object={nodes["MCH-foot_tweakL"]} />
          <primitive object={nodes.foot_tweakL} />
          <primitive object={nodes["MCH-shin_tweakL"]} />
          <primitive object={nodes.shin_tweakL} />
          <primitive object={nodes["MCH-shin_tweakL001"]} />
          <primitive object={nodes.shin_tweakL001} />
          <primitive object={nodes["MCH-thigh_parent_widgetL"]} />
          <primitive object={nodes["MCH-thigh_tweakL001"]} />
          <primitive object={nodes.thigh_tweakL001} />
          <primitive object={nodes["ORG-thighR"]} />
          <primitive object={nodes["ORG-shinR"]} />
          <primitive object={nodes["ORG-footR"]} />
          <primitive object={nodes["ORG-toeR"]} />
          <primitive object={nodes["ORG-heel02R"]} />
          <primitive object={nodes["MCH-foot_tweakR"]} />
          <primitive object={nodes.foot_tweakR} />
          <primitive object={nodes["MCH-shin_tweakR"]} />
          <primitive object={nodes.shin_tweakR} />
          <primitive object={nodes["MCH-shin_tweakR001"]} />
          <primitive object={nodes.shin_tweakR001} />
          <primitive object={nodes["MCH-thigh_parent_widgetR"]} />
          <primitive object={nodes["MCH-thigh_tweakR001"]} />
          <primitive object={nodes.thigh_tweakR001} />
          <primitive object={nodes.thigh_parentL} />
          <primitive object={nodes["MCH-thigh_parentL"]} />
          <primitive object={nodes.thigh_fkL} />
          <primitive object={nodes.shin_fkL} />
          <primitive object={nodes["MCH-foot_fkL"]} />
          <primitive object={nodes.foot_fkL} />
          <primitive object={nodes["MCH-toe_fkL"]} />
          <primitive object={nodes.toe_fkL} />
          <primitive object={nodes["MCH-thigh_ik_swingL"]} />
          <primitive object={nodes.thigh_ikL} />
          <primitive object={nodes["MCH-shin_ikL"]} />
          <primitive object={nodes["MCH-thigh_tweakL"]} />
          <primitive object={nodes.thigh_tweakL} />
          <primitive object={nodes["DEF-thighL"]} />
          <primitive object={nodes["DEF-thighL001"]} />
          <primitive object={nodes["DEF-shinL"]} />
          <primitive object={nodes["DEF-shinL001"]} />
          <primitive object={nodes["DEF-footL"]} />
          <primitive object={nodes["DEF-toeL"]} />
          <primitive object={nodes.thigh_parentR} />
          <primitive object={nodes["MCH-thigh_parentR"]} />
          <primitive object={nodes.thigh_fkR} />
          <primitive object={nodes.shin_fkR} />
          <primitive object={nodes["MCH-foot_fkR"]} />
          <primitive object={nodes.foot_fkR} />
          <primitive object={nodes["MCH-toe_fkR"]} />
          <primitive object={nodes.toe_fkR} />
          <primitive object={nodes["MCH-thigh_ik_swingR"]} />
          <primitive object={nodes.thigh_ikR} />
          <primitive object={nodes["MCH-shin_ikR"]} />
          <primitive object={nodes["MCH-thigh_tweakR"]} />
          <primitive object={nodes.thigh_tweakR} />
          <primitive object={nodes["DEF-thighR"]} />
          <primitive object={nodes["DEF-thighR001"]} />
          <primitive object={nodes["DEF-shinR"]} />
          <primitive object={nodes["DEF-shinR001"]} />
          <primitive object={nodes["DEF-footR"]} />
          <primitive object={nodes["DEF-toeR"]} />
          <primitive object={nodes.tweak_spine001} />
          <primitive object={nodes["ORG-spine001"]} />
          <primitive object={nodes["MCH-WGT-hips"]} />
          <primitive object={nodes["MCH-spine002"]} />
          <primitive object={nodes.spine_fk002} />
          <primitive object={nodes["MCH-pivot"]} />
          <primitive object={nodes.tweak_spine002} />
          <primitive object={nodes["ORG-spine002"]} />
          <primitive object={nodes["MCH-spine003"]} />
          <primitive object={nodes.spine_fk003} />
          <primitive object={nodes["ORG-spine004"]} />
          <primitive object={nodes["ORG-spine005"]} />
          <primitive object={nodes["ORG-spine006"]} />
          <primitive object={nodes["ORG-face"]} />
          <primitive object={nodes["ORG-nose"]} />
          <primitive object={nodes["ORG-nose001"]} />
          <primitive object={nodes["ORG-nose004"]} />
          <primitive object={nodes["ORG-earL"]} />
          <primitive object={nodes["ORG-earL001"]} />
          <primitive object={nodes["ORG-earL002"]} />
          <primitive object={nodes["ORG-earL003"]} />
          <primitive object={nodes["ORG-earL004"]} />
          <primitive object={nodes["DEF-earL"]} />
          <primitive object={nodes["MCH-ear_handleL001"]} />
          <primitive object={nodes["DEF-earL001"]} />
          <primitive object={nodes["MCH-ear_handleL002"]} />
          <primitive object={nodes["MCH-ear_handleL003"]} />
          <primitive object={nodes["DEF-earL002"]} />
          <primitive object={nodes["DEF-earL003"]} />
          <primitive object={nodes["MCH-ear_handleL004"]} />
          <primitive object={nodes["MCH-ear_end_handleL004"]} />
          <primitive object={nodes["DEF-earL004"]} />
          <primitive object={nodes.earL001_1} />
          <primitive object={nodes.earL002_1} />
          <primitive object={nodes["MCH-ear_offsetL003"]} />
          <primitive object={nodes.earL003_1} />
          <primitive object={nodes.earL004_1} />
          <primitive object={nodes.ear_endL004} />
          <primitive object={nodes["ORG-earR"]} />
          <primitive object={nodes["ORG-earR001"]} />
          <primitive object={nodes["ORG-earR002"]} />
          <primitive object={nodes["ORG-earR003"]} />
          <primitive object={nodes["ORG-earR004"]} />
          <primitive object={nodes["DEF-earR"]} />
          <primitive object={nodes["MCH-ear_handleR001"]} />
          <primitive object={nodes["DEF-earR001"]} />
          <primitive object={nodes["MCH-ear_handleR002"]} />
          <primitive object={nodes["MCH-ear_handleR003"]} />
          <primitive object={nodes["DEF-earR002"]} />
          <primitive object={nodes["DEF-earR003"]} />
          <primitive object={nodes["MCH-ear_handleR004"]} />
          <primitive object={nodes["MCH-ear_end_handleR004"]} />
          <primitive object={nodes["DEF-earR004"]} />
          <primitive object={nodes.earR001_1} />
          <primitive object={nodes.earR002_1} />
          <primitive object={nodes["MCH-ear_offsetR003"]} />
          <primitive object={nodes.earR003_1} />
          <primitive object={nodes.earR004_1} />
          <primitive object={nodes.ear_endR004} />
          <primitive object={nodes["ORG-browBL"]} />
          <primitive object={nodes["ORG-browBL001"]} />
          <primitive object={nodes["ORG-browBL002"]} />
          <primitive object={nodes["ORG-browBL003"]} />
          <primitive object={nodes["ORG-browBR"]} />
          <primitive object={nodes["ORG-browBR001"]} />
          <primitive object={nodes["ORG-browBR002"]} />
          <primitive object={nodes["ORG-browBR003"]} />
          <primitive object={nodes["ORG-foreheadL"]} />
          <primitive object={nodes["ORG-foreheadL001"]} />
          <primitive object={nodes["ORG-foreheadL002"]} />
          <primitive object={nodes["ORG-templeL"]} />
          <primitive object={nodes["ORG-cheekBL"]} />
          <primitive object={nodes["ORG-cheekBL001"]} />
          <primitive object={nodes["ORG-browTL"]} />
          <primitive object={nodes["ORG-browTL001"]} />
          <primitive object={nodes["ORG-browTL002"]} />
          <primitive object={nodes["ORG-browTL003"]} />
          <primitive object={nodes["ORG-foreheadR"]} />
          <primitive object={nodes["ORG-foreheadR001"]} />
          <primitive object={nodes["ORG-foreheadR002"]} />
          <primitive object={nodes["ORG-templeR"]} />
          <primitive object={nodes["ORG-cheekBR"]} />
          <primitive object={nodes["ORG-cheekBR001"]} />
          <primitive object={nodes["ORG-browTR"]} />
          <primitive object={nodes["ORG-browTR001"]} />
          <primitive object={nodes["ORG-browTR002"]} />
          <primitive object={nodes["ORG-browTR003"]} />
          <primitive object={nodes["ORG-cheekTL"]} />
          <primitive object={nodes["ORG-cheekTL001"]} />
          <primitive object={nodes["ORG-cheekTR"]} />
          <primitive object={nodes["ORG-cheekTR001"]} />
          <primitive object={nodes["ORG-teethT"]} />
          <primitive object={nodes["DEF-teethT"]} />
          <primitive object={nodes["ORG-nose_master"]} />
          <primitive object={nodes["ORG-nose002"]} />
          <primitive object={nodes["ORG-nose003"]} />
          <primitive object={nodes["ORG-noseL001"]} />
          <primitive object={nodes["ORG-noseR001"]} />
          <primitive object={nodes["MCH-nose_handle002"]} />
          <primitive object={nodes["MCH-nose_handle003"]} />
          <primitive object={nodes["DEF-nose002"]} />
          <primitive object={nodes["DEF-nose003"]} />
          <primitive object={nodes["MCH-nose_handleL001"]} />
          <primitive object={nodes["MCH-nose_end_handleL001"]} />
          <primitive object={nodes["DEF-noseL001"]} />
          <primitive object={nodes["MCH-nose_handleR001"]} />
          <primitive object={nodes["MCH-nose_end_handleR001"]} />
          <primitive object={nodes["DEF-noseR001"]} />
          <primitive object={nodes.noseL001_1} />
          <primitive object={nodes["ORG-nose_glueL001"]} />
          <primitive object={nodes.noseR001_1} />
          <primitive object={nodes["ORG-nose_glueR001"]} />
          <primitive object={nodes.nose002_1} />
          <primitive object={nodes.nose004_1} />
          <primitive object={nodes["ORG-nose_glue004"]} />
          <primitive object={nodes["MCH-nose_offset003"]} />
          <primitive object={nodes.nose003_1} />
          <primitive object={nodes["ORG-browBL004"]} />
          <primitive object={nodes["ORG-noseL"]} />
          <primitive object={nodes["ORG-browBR004"]} />
          <primitive object={nodes["ORG-noseR"]} />
          <primitive object={nodes.earL_1} />
          <primitive object={nodes.earR_1} />
          <primitive object={nodes.eye_masterL} />
          <primitive object={nodes["ORG-eyeL"]} />
          <primitive object={nodes["ORG-lidTL"]} />
          <primitive object={nodes["ORG-lidTL001"]} />
          <primitive object={nodes["ORG-lidTL002"]} />
          <primitive object={nodes["ORG-lidTL003"]} />
          <primitive object={nodes["ORG-lidBL"]} />
          <primitive object={nodes["ORG-lidBL001"]} />
          <primitive object={nodes["ORG-lidBL002"]} />
          <primitive object={nodes["ORG-lidBL003"]} />
          <primitive object={nodes["DEF-eye_masterL"]} />
          <primitive object={nodes["MCH-lid_handleBL"]} />
          <primitive object={nodes["MCH-lid_handleBL001"]} />
          <primitive object={nodes["MCH-lid_handleBL002"]} />
          <primitive object={nodes["MCH-lid_handleBL003"]} />
          <primitive object={nodes["MCH-lid_end_handleBL003"]} />
          <primitive object={nodes["MCH-lid_handle_preBL"]} />
          <primitive object={nodes["MCH-lid_handle_preBL001"]} />
          <primitive object={nodes["MCH-lid_handle_preBL002"]} />
          <primitive object={nodes["MCH-lid_handle_preBL003"]} />
          <primitive object={nodes["MCH-lid_end_handle_preBL003"]} />
          <primitive object={nodes["DEF-lidBL"]} />
          <primitive object={nodes["DEF-lidBL001"]} />
          <primitive object={nodes["DEF-lidBL002"]} />
          <primitive object={nodes["DEF-lidBL003"]} />
          <primitive object={nodes["MCH-lid_handleTL"]} />
          <primitive object={nodes["MCH-lid_handleTL001"]} />
          <primitive object={nodes["MCH-lid_handleTL002"]} />
          <primitive object={nodes["MCH-lid_handleTL003"]} />
          <primitive object={nodes["MCH-lid_end_handleTL003"]} />
          <primitive object={nodes["MCH-lid_handle_preTL"]} />
          <primitive object={nodes["MCH-lid_handle_preTL001"]} />
          <primitive object={nodes["MCH-lid_handle_preTL002"]} />
          <primitive object={nodes["MCH-lid_handle_preTL003"]} />
          <primitive object={nodes["MCH-lid_end_handle_preTL003"]} />
          <primitive object={nodes["DEF-lidTL"]} />
          <primitive object={nodes["DEF-lidTL001"]} />
          <primitive object={nodes["DEF-lidTL002"]} />
          <primitive object={nodes["DEF-lidTL003"]} />
          <primitive object={nodes.lidBL_1} />
          <primitive object={nodes["MCH-lid_offsetBL001"]} />
          <primitive object={nodes.lidBL001_1} />
          <primitive object={nodes["MCH-lid_offsetBL002"]} />
          <primitive object={nodes.lidBL002_1} />
          <primitive object={nodes["ORG-lid_glueBL002"]} />
          <primitive object={nodes["MCH-lid_offsetBL003"]} />
          <primitive object={nodes.lidBL003_1} />
          <primitive object={nodes.lidTL_1} />
          <primitive object={nodes["MCH-lid_offsetTL001"]} />
          <primitive object={nodes.lidTL001_1} />
          <primitive object={nodes["MCH-lid_offsetTL002"]} />
          <primitive object={nodes.lidTL002_1} />
          <primitive object={nodes["MCH-lid_offsetTL003"]} />
          <primitive object={nodes.lidTL003_1} />
          <primitive object={nodes["MCH-eyeL"]} />
          <primitive object={nodes["DEF-eyeL"]} />
          <primitive object={nodes["DEF-eye_irisL"]} />
          <primitive object={nodes["MCH-eye_trackL"]} />
          <primitive object={nodes.eye_masterR} />
          <primitive object={nodes["ORG-eyeR"]} />
          <primitive object={nodes["ORG-lidTR"]} />
          <primitive object={nodes["ORG-lidTR001"]} />
          <primitive object={nodes["ORG-lidTR002"]} />
          <primitive object={nodes["ORG-lidTR003"]} />
          <primitive object={nodes["ORG-lidBR"]} />
          <primitive object={nodes["ORG-lidBR001"]} />
          <primitive object={nodes["ORG-lidBR002"]} />
          <primitive object={nodes["ORG-lidBR003"]} />
          <primitive object={nodes["DEF-eye_masterR"]} />
          <primitive object={nodes["MCH-lid_handleBR"]} />
          <primitive object={nodes["MCH-lid_handleBR001"]} />
          <primitive object={nodes["MCH-lid_handleBR002"]} />
          <primitive object={nodes["MCH-lid_handleBR003"]} />
          <primitive object={nodes["MCH-lid_end_handleBR003"]} />
          <primitive object={nodes["MCH-lid_handle_preBR"]} />
          <primitive object={nodes["MCH-lid_handle_preBR001"]} />
          <primitive object={nodes["MCH-lid_handle_preBR002"]} />
          <primitive object={nodes["MCH-lid_handle_preBR003"]} />
          <primitive object={nodes["MCH-lid_end_handle_preBR003"]} />
          <primitive object={nodes["DEF-lidBR"]} />
          <primitive object={nodes["DEF-lidBR001"]} />
          <primitive object={nodes["DEF-lidBR002"]} />
          <primitive object={nodes["DEF-lidBR003"]} />
          <primitive object={nodes["MCH-lid_handleTR"]} />
          <primitive object={nodes["MCH-lid_handleTR001"]} />
          <primitive object={nodes["MCH-lid_handleTR002"]} />
          <primitive object={nodes["MCH-lid_handleTR003"]} />
          <primitive object={nodes["MCH-lid_end_handleTR003"]} />
          <primitive object={nodes["MCH-lid_handle_preTR"]} />
          <primitive object={nodes["MCH-lid_handle_preTR001"]} />
          <primitive object={nodes["MCH-lid_handle_preTR002"]} />
          <primitive object={nodes["MCH-lid_handle_preTR003"]} />
          <primitive object={nodes["MCH-lid_end_handle_preTR003"]} />
          <primitive object={nodes["DEF-lidTR"]} />
          <primitive object={nodes["DEF-lidTR001"]} />
          <primitive object={nodes["DEF-lidTR002"]} />
          <primitive object={nodes["DEF-lidTR003"]} />
          <primitive object={nodes.lidBR_1} />
          <primitive object={nodes["MCH-lid_offsetBR001"]} />
          <primitive object={nodes.lidBR001_1} />
          <primitive object={nodes["MCH-lid_offsetBR002"]} />
          <primitive object={nodes.lidBR002_1} />
          <primitive object={nodes["ORG-lid_glueBR002"]} />
          <primitive object={nodes["MCH-lid_offsetBR003"]} />
          <primitive object={nodes.lidBR003_1} />
          <primitive object={nodes.lidTR_1} />
          <primitive object={nodes["MCH-lid_offsetTR001"]} />
          <primitive object={nodes.lidTR001_1} />
          <primitive object={nodes["MCH-lid_offsetTR002"]} />
          <primitive object={nodes.lidTR002_1} />
          <primitive object={nodes["MCH-lid_offsetTR003"]} />
          <primitive object={nodes.lidTR003_1} />
          <primitive object={nodes["MCH-eyeR"]} />
          <primitive object={nodes["DEF-eyeR"]} />
          <primitive object={nodes["DEF-eye_irisR"]} />
          <primitive object={nodes["MCH-eye_trackR"]} />
          <primitive object={nodes.jaw_master_1} />
          <primitive object={nodes["ORG-jaw_master"]} />
          <primitive object={nodes["ORG-jaw"]} />
          <primitive object={nodes["ORG-chin"]} />
          <primitive object={nodes["ORG-chin001"]} />
          <primitive object={nodes["ORG-jawL"]} />
          <primitive object={nodes["ORG-jawL001"]} />
          <primitive object={nodes["ORG-chinL"]} />
          <primitive object={nodes["ORG-jawR"]} />
          <primitive object={nodes["ORG-jawR001"]} />
          <primitive object={nodes["ORG-chinR"]} />
          <primitive object={nodes["ORG-teethB"]} />
          <primitive object={nodes["DEF-teethB"]} />
          <primitive object={nodes["ORG-tongue"]} />
          <primitive object={nodes["ORG-tongue001"]} />
          <primitive object={nodes["ORG-tongue002"]} />
          <primitive object={nodes.teethB_1} />
          <primitive object={nodes.tongue_1} />
          <primitive object={nodes.tweak_tongue} />
          <primitive object={nodes["DEF-tongue"]} />
          <primitive object={nodes["DEF-tongue001"]} />
          <primitive object={nodes["DEF-tongue002"]} />
          <primitive object={nodes["DEF-jaw_master"]} />
          <primitive object={nodes["MCH-chin_handle"]} />
          <primitive object={nodes["MCH-chin_handle001"]} />
          <primitive object={nodes["MCH-chin_end_handle001"]} />
          <primitive object={nodes["DEF-chin"]} />
          <primitive object={nodes["DEF-chin001"]} />
          <primitive object={nodes["MCH-jaw_handle"]} />
          <primitive object={nodes["DEF-jaw"]} />
          <primitive object={nodes["MCH-jaw_handleL"]} />
          <primitive object={nodes["MCH-jaw_handleL001"]} />
          <primitive object={nodes["MCH-chin_handleL"]} />
          <primitive object={nodes["MCH-chin_end_handleL"]} />
          <primitive object={nodes["DEF-jawL"]} />
          <primitive object={nodes["DEF-jawL001"]} />
          <primitive object={nodes["DEF-chinL"]} />
          <primitive object={nodes["MCH-jaw_handleR"]} />
          <primitive object={nodes["MCH-jaw_handleR001"]} />
          <primitive object={nodes["MCH-chin_handleR"]} />
          <primitive object={nodes["MCH-chin_end_handleR"]} />
          <primitive object={nodes["DEF-jawR"]} />
          <primitive object={nodes["DEF-jawR001"]} />
          <primitive object={nodes["DEF-chinR"]} />
          <primitive object={nodes.tweak_tongue003} />
          <primitive object={nodes["MCH-tongue001"]} />
          <primitive object={nodes.tweak_tongue001} />
          <primitive object={nodes["MCH-tongue002"]} />
          <primitive object={nodes.tweak_tongue002} />
          <primitive object={nodes.chin_1} />
          <primitive object={nodes["MCH-chin_offset001"]} />
          <primitive object={nodes.chin001_1} />
          <primitive object={nodes.chin_end001} />
          <primitive object={nodes["ORG-chin_end_glue001"]} />
          <primitive object={nodes["MCH-chin_end_glue_reparent001"]} />
          <primitive object={nodes.jaw_1} />
          <primitive object={nodes.jawL001_1} />
          <primitive object={nodes.chinL_1} />
          <primitive object={nodes.jawR001_1} />
          <primitive object={nodes.chinR_1} />
          <primitive object={nodes["MCH-jaw_master_lock"]} />
          <primitive object={nodes["MCH-jaw_master_top"]} />
          <primitive object={nodes["ORG-lipTL"]} />
          <primitive object={nodes["ORG-lipTL001"]} />
          <primitive object={nodes["ORG-lipTR"]} />
          <primitive object={nodes["ORG-lipTR001"]} />
          <primitive object={nodes["MCH-jaw_master_middle"]} />
          <primitive object={nodes.jaw_master_mouth} />
          <primitive object={nodes["MCH-jaw_master_top_out"]} />
          <primitive object={nodes["MCH-lip_armTL"]} />
          <primitive object={nodes.lipT} />
          <primitive object={nodes["MCH-jaw_master_bottom_out"]} />
          <primitive object={nodes["MCH-lip_armBL"]} />
          <primitive object={nodes.lipB} />
          <primitive object={nodes["MCH-jaw_master_middle_out"]} />
          <primitive object={nodes["MCH-lip_end_armBL001"]} />
          <primitive object={nodes.lip_endL001} />
          <primitive object={nodes["MCH-lip_end_armBR001"]} />
          <primitive object={nodes.lip_endR001} />
          <primitive object={nodes["MCH-lip_handleTL"]} />
          <primitive object={nodes["MCH-lip_handleTL001"]} />
          <primitive object={nodes["MCH-lip_end_handleTL001"]} />
          <primitive object={nodes["DEF-lipTL"]} />
          <primitive object={nodes["DEF-lipTL001"]} />
          <primitive object={nodes["MCH-lip_handleTR"]} />
          <primitive object={nodes["MCH-lip_handleTR001"]} />
          <primitive object={nodes["MCH-lip_end_handleTR001"]} />
          <primitive object={nodes["DEF-lipTR"]} />
          <primitive object={nodes["DEF-lipTR001"]} />
          <primitive object={nodes["MCH-jaw_master_bottom"]} />
          <primitive object={nodes["ORG-lipBL"]} />
          <primitive object={nodes["ORG-lipBL001"]} />
          <primitive object={nodes["ORG-lipBR"]} />
          <primitive object={nodes["ORG-lipBR001"]} />
          <primitive object={nodes["MCH-lip_handleBL"]} />
          <primitive object={nodes["MCH-lip_handleBL001"]} />
          <primitive object={nodes["MCH-lip_end_handleBL001"]} />
          <primitive object={nodes["DEF-lipBL"]} />
          <primitive object={nodes["DEF-lipBL001"]} />
          <primitive object={nodes["MCH-lip_handleBR"]} />
          <primitive object={nodes["MCH-lip_handleBR001"]} />
          <primitive object={nodes["MCH-lip_end_handleBR001"]} />
          <primitive object={nodes["DEF-lipBR"]} />
          <primitive object={nodes["DEF-lipBR001"]} />
          <primitive object={nodes.nose_master_1} />
          <primitive object={nodes.teethT_1} />
          <primitive object={nodes["MCH-brow_handleBL"]} />
          <primitive object={nodes["MCH-brow_handleBL001"]} />
          <primitive object={nodes["MCH-brow_handleBL002"]} />
          <primitive object={nodes["MCH-brow_handleBL003"]} />
          <primitive object={nodes["DEF-browBL"]} />
          <primitive object={nodes["DEF-browBL001"]} />
          <primitive object={nodes["DEF-browBL002"]} />
          <primitive object={nodes["DEF-browBL003"]} />
          <primitive object={nodes["MCH-brow_handleBL004"]} />
          <primitive object={nodes["MCH-nose_handleL"]} />
          <primitive object={nodes["MCH-nose_end_handleL"]} />
          <primitive object={nodes["DEF-browBL004"]} />
          <primitive object={nodes["DEF-noseL"]} />
          <primitive object={nodes["MCH-brow_handleBR"]} />
          <primitive object={nodes["MCH-brow_handleBR001"]} />
          <primitive object={nodes["MCH-brow_handleBR002"]} />
          <primitive object={nodes["MCH-brow_handleBR003"]} />
          <primitive object={nodes["DEF-browBR"]} />
          <primitive object={nodes["DEF-browBR001"]} />
          <primitive object={nodes["DEF-browBR002"]} />
          <primitive object={nodes["DEF-browBR003"]} />
          <primitive object={nodes["MCH-brow_handleBR004"]} />
          <primitive object={nodes["MCH-nose_handleR"]} />
          <primitive object={nodes["MCH-nose_end_handleR"]} />
          <primitive object={nodes["DEF-browBR004"]} />
          <primitive object={nodes["DEF-noseR"]} />
          <primitive object={nodes["MCH-brow_handleTL"]} />
          <primitive object={nodes["DEF-browTL"]} />
          <primitive object={nodes["MCH-brow_handleTL001"]} />
          <primitive object={nodes["MCH-brow_handleTL002"]} />
          <primitive object={nodes["DEF-browTL001"]} />
          <primitive object={nodes["DEF-browTL002"]} />
          <primitive object={nodes["MCH-brow_handleTL003"]} />
          <primitive object={nodes["MCH-brow_end_handleTL003"]} />
          <primitive object={nodes["DEF-browTL003"]} />
          <primitive object={nodes["MCH-brow_handleTR"]} />
          <primitive object={nodes["DEF-browTR"]} />
          <primitive object={nodes["MCH-brow_handleTR001"]} />
          <primitive object={nodes["MCH-brow_handleTR002"]} />
          <primitive object={nodes["DEF-browTR001"]} />
          <primitive object={nodes["DEF-browTR002"]} />
          <primitive object={nodes["MCH-brow_handleTR003"]} />
          <primitive object={nodes["MCH-brow_end_handleTR003"]} />
          <primitive object={nodes["DEF-browTR003"]} />
          <primitive object={nodes["MCH-cheek_handleBL"]} />
          <primitive object={nodes["MCH-cheek_handleBL001"]} />
          <primitive object={nodes["DEF-cheekBL"]} />
          <primitive object={nodes["DEF-cheekBL001"]} />
          <primitive object={nodes["MCH-cheek_handleBR"]} />
          <primitive object={nodes["MCH-cheek_handleBR001"]} />
          <primitive object={nodes["DEF-cheekBR"]} />
          <primitive object={nodes["DEF-cheekBR001"]} />
          <primitive object={nodes["MCH-cheek_handleTL"]} />
          <primitive object={nodes["MCH-cheek_handleTL001"]} />
          <primitive object={nodes["MCH-cheek_end_handleTL001"]} />
          <primitive object={nodes["DEF-cheekTL"]} />
          <primitive object={nodes["DEF-cheekTL001"]} />
          <primitive object={nodes["MCH-cheek_handleTR"]} />
          <primitive object={nodes["MCH-cheek_handleTR001"]} />
          <primitive object={nodes["MCH-cheek_end_handleTR001"]} />
          <primitive object={nodes["DEF-cheekTR"]} />
          <primitive object={nodes["DEF-cheekTR001"]} />
          <primitive object={nodes["MCH-forehead_handleL"]} />
          <primitive object={nodes["MCH-forehead_end_handleL"]} />
          <primitive object={nodes["DEF-foreheadL"]} />
          <primitive object={nodes["MCH-forehead_handleL001"]} />
          <primitive object={nodes["MCH-forehead_end_handleL001"]} />
          <primitive object={nodes["DEF-foreheadL001"]} />
          <primitive object={nodes["MCH-forehead_handleL002"]} />
          <primitive object={nodes["MCH-forehead_end_handleL002"]} />
          <primitive object={nodes["DEF-foreheadL002"]} />
          <primitive object={nodes["MCH-forehead_handleR"]} />
          <primitive object={nodes["MCH-forehead_end_handleR"]} />
          <primitive object={nodes["DEF-foreheadR"]} />
          <primitive object={nodes["MCH-forehead_handleR001"]} />
          <primitive object={nodes["MCH-forehead_end_handleR001"]} />
          <primitive object={nodes["DEF-foreheadR001"]} />
          <primitive object={nodes["MCH-forehead_handleR002"]} />
          <primitive object={nodes["MCH-forehead_end_handleR002"]} />
          <primitive object={nodes["DEF-foreheadR002"]} />
          <primitive object={nodes["MCH-nose_handle"]} />
          <primitive object={nodes["MCH-nose_handle001"]} />
          <primitive object={nodes["DEF-nose"]} />
          <primitive object={nodes["DEF-nose001"]} />
          <primitive object={nodes["MCH-nose_handle004"]} />
          <primitive object={nodes["MCH-nose_end_handle004"]} />
          <primitive object={nodes["DEF-nose004"]} />
          <primitive object={nodes["MCH-temple_handleL"]} />
          <primitive object={nodes["MCH-temple_end_handleL"]} />
          <primitive object={nodes["DEF-templeL"]} />
          <primitive object={nodes["MCH-temple_handleR"]} />
          <primitive object={nodes["MCH-temple_end_handleR"]} />
          <primitive object={nodes["DEF-templeR"]} />
          <primitive object={nodes.browBL_1} />
          <primitive object={nodes["MCH-brow_offsetBL001"]} />
          <primitive object={nodes.browBL001_1} />
          <primitive object={nodes["MCH-brow_offsetBL002"]} />
          <primitive object={nodes.browBL002_1} />
          <primitive object={nodes["ORG-brow_glueBL002"]} />
          <primitive object={nodes["MCH-brow_offsetBL003"]} />
          <primitive object={nodes.browBL003_1} />
          <primitive object={nodes.browBL004_1} />
          <primitive object={nodes["MCH-nose_offsetL"]} />
          <primitive object={nodes.noseL_1} />
          <primitive object={nodes["MCH-nose_end_reparentL"]} />
          <primitive object={nodes.browBR_1} />
          <primitive object={nodes["MCH-brow_offsetBR001"]} />
          <primitive object={nodes.browBR001_1} />
          <primitive object={nodes["MCH-brow_offsetBR002"]} />
          <primitive object={nodes.browBR002_1} />
          <primitive object={nodes["ORG-brow_glueBR002"]} />
          <primitive object={nodes["MCH-brow_offsetBR003"]} />
          <primitive object={nodes.browBR003_1} />
          <primitive object={nodes.browBR004_1} />
          <primitive object={nodes["MCH-nose_offsetR"]} />
          <primitive object={nodes.noseR_1} />
          <primitive object={nodes["MCH-nose_end_reparentR"]} />
          <primitive object={nodes.browTL_1} />
          <primitive object={nodes.browTL001_1} />
          <primitive object={nodes["MCH-brow_reparentTL002"]} />
          <primitive object={nodes["MCH-brow_offsetTL002"]} />
          <primitive object={nodes.browTL002_1} />
          <primitive object={nodes.browTL003_1} />
          <primitive object={nodes.nose_1} />
          <primitive object={nodes.browTR_1} />
          <primitive object={nodes.browTR001_1} />
          <primitive object={nodes["MCH-brow_reparentTR002"]} />
          <primitive object={nodes["MCH-brow_offsetTR002"]} />
          <primitive object={nodes.browTR002_1} />
          <primitive object={nodes.browTR003_1} />
          <primitive object={nodes["MCH-cheek_reparentBL"]} />
          <primitive object={nodes["MCH-cheek_reparentBL001"]} />
          <primitive object={nodes["MCH-cheek_offsetBL001"]} />
          <primitive object={nodes.cheekBL001_1} />
          <primitive object={nodes["MCH-cheek_reparentBR"]} />
          <primitive object={nodes["MCH-cheek_reparentBR001"]} />
          <primitive object={nodes["MCH-cheek_offsetBR001"]} />
          <primitive object={nodes.cheekBR001_1} />
          <primitive object={nodes.cheekTL001_1} />
          <primitive object={nodes["ORG-cheek_glueTL001"]} />
          <primitive object={nodes.cheekTR001_1} />
          <primitive object={nodes["ORG-cheek_glueTR001"]} />
          <primitive object={nodes.foreheadL_1} />
          <primitive object={nodes.foreheadL001_1} />
          <primitive object={nodes.foreheadL002_1} />
          <primitive object={nodes.foreheadR_1} />
          <primitive object={nodes.foreheadR001_1} />
          <primitive object={nodes.foreheadR002_1} />
          <primitive object={nodes.jawL_1} />
          <primitive object={nodes.jawR_1} />
          <primitive object={nodes["MCH-nose_end_glue_reparent004"]} />
          <primitive object={nodes["MCH-nose_glue_reparentL001"]} />
          <primitive object={nodes["MCH-nose_glue_reparentR001"]} />
          <primitive object={nodes["MCH-nose_offset001"]} />
          <primitive object={nodes.nose001_1} />
          <primitive object={nodes["MCH-nose_end_reparent001"]} />
          <primitive object={nodes.nose_end004} />
          <primitive object={nodes["ORG-nose_end_glue004"]} />
          <primitive object={nodes.templeL_1} />
          <primitive object={nodes.templeR_1} />
          <primitive object={nodes["MCH-ROT-neck"]} />
          <primitive object={nodes.neck} />
          <primitive object={nodes["MCH-ROT-head"]} />
          <primitive object={nodes.head} />
          <primitive object={nodes.tweak_spine004} />
          <primitive object={nodes["MCH-STR-neck"]} />
          <primitive object={nodes["MCH-spine005"]} />
          <primitive object={nodes.tweak_spine005} />
          <primitive object={nodes.tweak_spine003} />
          <primitive object={nodes["ORG-spine003"]} />
          <primitive object={nodes["ORG-shoulderL"]} />
          <primitive object={nodes["ORG-upper_armL"]} />
          <primitive object={nodes["ORG-forearmL"]} />
          <primitive object={nodes["ORG-handL"]} />
          <primitive object={nodes["MCH-hand_tweakL"]} />
          <primitive object={nodes.hand_tweakL} />
          <primitive object={nodes["MCH-forearm_tweakL"]} />
          <primitive object={nodes.forearm_tweakL} />
          <primitive object={nodes["MCH-forearm_tweakL001"]} />
          <primitive object={nodes.forearm_tweakL001} />
          <primitive object={nodes["MCH-upper_arm_parent_widgetL"]} />
          <primitive object={nodes["MCH-upper_arm_tweakL001"]} />
          <primitive object={nodes.upper_arm_tweakL001} />
          <primitive object={nodes["DEF-shoulderL"]} />
          <primitive object={nodes.upper_arm_parentL} />
          <primitive object={nodes["MCH-upper_arm_parentL"]} />
          <primitive object={nodes.upper_arm_fkL} />
          <primitive object={nodes.forearm_fkL} />
          <primitive object={nodes["MCH-hand_fkL"]} />
          <primitive object={nodes.hand_fkL} />
          <primitive object={nodes["MCH-upper_arm_ik_swingL"]} />
          <primitive object={nodes.upper_arm_ikL} />
          <primitive object={nodes["MCH-forearm_ikL"]} />
          <primitive object={nodes["MCH-upper_arm_tweakL"]} />
          <primitive object={nodes.upper_arm_tweakL} />
          <primitive object={nodes["DEF-upper_armL"]} />
          <primitive object={nodes["DEF-upper_armL001"]} />
          <primitive object={nodes["DEF-forearmL"]} />
          <primitive object={nodes["DEF-forearmL001"]} />
          <primitive object={nodes["DEF-handL"]} />
          <primitive object={nodes["ORG-palm01L"]} />
          <primitive object={nodes["ORG-f_index01L"]} />
          <primitive object={nodes["ORG-f_index02L"]} />
          <primitive object={nodes["ORG-f_index03L"]} />
          <primitive object={nodes["ORG-thumb01L"]} />
          <primitive object={nodes["ORG-thumb02L"]} />
          <primitive object={nodes["ORG-thumb03L"]} />
          <primitive object={nodes["DEF-f_index01L"]} />
          <primitive object={nodes["DEF-f_index02L"]} />
          <primitive object={nodes["DEF-f_index03L"]} />
          <primitive object={nodes.f_index01_masterL} />
          <primitive object={nodes["DEF-thumb01L"]} />
          <primitive object={nodes["DEF-thumb02L"]} />
          <primitive object={nodes["DEF-thumb03L"]} />
          <primitive object={nodes.thumb01_masterL} />
          <primitive object={nodes["DEF-palm01L"]} />
          <primitive object={nodes["MCH-f_index01_drvL"]} />
          <primitive object={nodes.f_index01L_1} />
          <primitive object={nodes["MCH-f_index02_drvL"]} />
          <primitive object={nodes.f_index02L_1} />
          <primitive object={nodes["MCH-f_index03_drvL"]} />
          <primitive object={nodes.f_index03L_1} />
          <primitive object={nodes.f_index01L001} />
          <primitive object={nodes["MCH-f_index03L"]} />
          <primitive object={nodes["MCH-f_index02L"]} />
          <primitive object={nodes["MCH-f_index01L"]} />
          <primitive object={nodes["MCH-thumb01_drvL"]} />
          <primitive object={nodes.thumb01L_1} />
          <primitive object={nodes["MCH-thumb02_drvL"]} />
          <primitive object={nodes.thumb02L_1} />
          <primitive object={nodes["MCH-thumb03_drvL"]} />
          <primitive object={nodes.thumb03L_1} />
          <primitive object={nodes.thumb01L001} />
          <primitive object={nodes["MCH-thumb03L"]} />
          <primitive object={nodes["MCH-thumb02L"]} />
          <primitive object={nodes["MCH-thumb01L"]} />
          <primitive object={nodes["ORG-palm02L"]} />
          <primitive object={nodes["ORG-f_middle01L"]} />
          <primitive object={nodes["ORG-f_middle02L"]} />
          <primitive object={nodes["ORG-f_middle03L"]} />
          <primitive object={nodes["DEF-f_middle01L"]} />
          <primitive object={nodes["DEF-f_middle02L"]} />
          <primitive object={nodes["DEF-f_middle03L"]} />
          <primitive object={nodes.f_middle01_masterL} />
          <primitive object={nodes["DEF-palm02L"]} />
          <primitive object={nodes["MCH-f_middle01_drvL"]} />
          <primitive object={nodes.f_middle01L_1} />
          <primitive object={nodes["MCH-f_middle02_drvL"]} />
          <primitive object={nodes.f_middle02L_1} />
          <primitive object={nodes["MCH-f_middle03_drvL"]} />
          <primitive object={nodes.f_middle03L_1} />
          <primitive object={nodes.f_middle01L001} />
          <primitive object={nodes["MCH-f_middle03L"]} />
          <primitive object={nodes["MCH-f_middle02L"]} />
          <primitive object={nodes["MCH-f_middle01L"]} />
          <primitive object={nodes["ORG-palm03L"]} />
          <primitive object={nodes["ORG-f_ring01L"]} />
          <primitive object={nodes["ORG-f_ring02L"]} />
          <primitive object={nodes["ORG-f_ring03L"]} />
          <primitive object={nodes["DEF-f_ring01L"]} />
          <primitive object={nodes["DEF-f_ring02L"]} />
          <primitive object={nodes["DEF-f_ring03L"]} />
          <primitive object={nodes.f_ring01_masterL} />
          <primitive object={nodes["DEF-palm03L"]} />
          <primitive object={nodes["MCH-f_ring01_drvL"]} />
          <primitive object={nodes.f_ring01L_1} />
          <primitive object={nodes["MCH-f_ring02_drvL"]} />
          <primitive object={nodes.f_ring02L_1} />
          <primitive object={nodes["MCH-f_ring03_drvL"]} />
          <primitive object={nodes.f_ring03L_1} />
          <primitive object={nodes.f_ring01L001} />
          <primitive object={nodes["MCH-f_ring03L"]} />
          <primitive object={nodes["MCH-f_ring02L"]} />
          <primitive object={nodes["MCH-f_ring01L"]} />
          <primitive object={nodes["ORG-palm04L"]} />
          <primitive object={nodes["ORG-f_pinky01L"]} />
          <primitive object={nodes["ORG-f_pinky02L"]} />
          <primitive object={nodes["ORG-f_pinky03L"]} />
          <primitive object={nodes["DEF-f_pinky01L"]} />
          <primitive object={nodes["DEF-f_pinky02L"]} />
          <primitive object={nodes["DEF-f_pinky03L"]} />
          <primitive object={nodes.f_pinky01_masterL} />
          <primitive object={nodes["DEF-palm04L"]} />
          <primitive object={nodes["MCH-f_pinky01_drvL"]} />
          <primitive object={nodes.f_pinky01L_1} />
          <primitive object={nodes["MCH-f_pinky02_drvL"]} />
          <primitive object={nodes.f_pinky02L_1} />
          <primitive object={nodes["MCH-f_pinky03_drvL"]} />
          <primitive object={nodes.f_pinky03L_1} />
          <primitive object={nodes.f_pinky01L001} />
          <primitive object={nodes["MCH-f_pinky03L"]} />
          <primitive object={nodes["MCH-f_pinky02L"]} />
          <primitive object={nodes["MCH-f_pinky01L"]} />
          <primitive object={nodes.palmL} />
          <primitive object={nodes["ORG-shoulderR"]} />
          <primitive object={nodes["ORG-upper_armR"]} />
          <primitive object={nodes["ORG-forearmR"]} />
          <primitive object={nodes["ORG-handR"]} />
          <primitive object={nodes["MCH-hand_tweakR"]} />
          <primitive object={nodes.hand_tweakR} />
          <primitive object={nodes["MCH-forearm_tweakR"]} />
          <primitive object={nodes.forearm_tweakR} />
          <primitive object={nodes["MCH-forearm_tweakR001"]} />
          <primitive object={nodes.forearm_tweakR001} />
          <primitive object={nodes["MCH-upper_arm_parent_widgetR"]} />
          <primitive object={nodes["MCH-upper_arm_tweakR001"]} />
          <primitive object={nodes.upper_arm_tweakR001} />
          <primitive object={nodes["DEF-shoulderR"]} />
          <primitive object={nodes.upper_arm_parentR} />
          <primitive object={nodes["MCH-upper_arm_parentR"]} />
          <primitive object={nodes.upper_arm_fkR} />
          <primitive object={nodes.forearm_fkR} />
          <primitive object={nodes["MCH-hand_fkR"]} />
          <primitive object={nodes.hand_fkR} />
          <primitive object={nodes["MCH-upper_arm_ik_swingR"]} />
          <primitive object={nodes.upper_arm_ikR} />
          <primitive object={nodes["MCH-forearm_ikR"]} />
          <primitive object={nodes["MCH-upper_arm_tweakR"]} />
          <primitive object={nodes.upper_arm_tweakR} />
          <primitive object={nodes["DEF-upper_armR"]} />
          <primitive object={nodes["DEF-upper_armR001"]} />
          <primitive object={nodes["DEF-forearmR"]} />
          <primitive object={nodes["DEF-forearmR001"]} />
          <primitive object={nodes["DEF-handR"]} />
          <primitive object={nodes["ORG-palm01R"]} />
          <primitive object={nodes["ORG-f_index01R"]} />
          <primitive object={nodes["ORG-f_index02R"]} />
          <primitive object={nodes["ORG-f_index03R"]} />
          <primitive object={nodes["ORG-thumb01R"]} />
          <primitive object={nodes["ORG-thumb02R"]} />
          <primitive object={nodes["ORG-thumb03R"]} />
          <primitive object={nodes["DEF-f_index01R"]} />
          <primitive object={nodes["DEF-f_index02R"]} />
          <primitive object={nodes["DEF-f_index03R"]} />
          <primitive object={nodes.f_index01_masterR} />
          <primitive object={nodes["DEF-thumb01R"]} />
          <primitive object={nodes["DEF-thumb02R"]} />
          <primitive object={nodes["DEF-thumb03R"]} />
          <primitive object={nodes.thumb01_masterR} />
          <primitive object={nodes["DEF-palm01R"]} />
          <primitive object={nodes["MCH-f_index01_drvR"]} />
          <primitive object={nodes.f_index01R_1} />
          <primitive object={nodes["MCH-f_index02_drvR"]} />
          <primitive object={nodes.f_index02R_1} />
          <primitive object={nodes["MCH-f_index03_drvR"]} />
          <primitive object={nodes.f_index03R_1} />
          <primitive object={nodes.f_index01R001} />
          <primitive object={nodes["MCH-f_index03R"]} />
          <primitive object={nodes["MCH-f_index02R"]} />
          <primitive object={nodes["MCH-f_index01R"]} />
          <primitive object={nodes["MCH-thumb01_drvR"]} />
          <primitive object={nodes.thumb01R_1} />
          <primitive object={nodes["MCH-thumb02_drvR"]} />
          <primitive object={nodes.thumb02R_1} />
          <primitive object={nodes["MCH-thumb03_drvR"]} />
          <primitive object={nodes.thumb03R_1} />
          <primitive object={nodes.thumb01R001} />
          <primitive object={nodes["MCH-thumb03R"]} />
          <primitive object={nodes["MCH-thumb02R"]} />
          <primitive object={nodes["MCH-thumb01R"]} />
          <primitive object={nodes["ORG-palm02R"]} />
          <primitive object={nodes["ORG-f_middle01R"]} />
          <primitive object={nodes["ORG-f_middle02R"]} />
          <primitive object={nodes["ORG-f_middle03R"]} />
          <primitive object={nodes["DEF-f_middle01R"]} />
          <primitive object={nodes["DEF-f_middle02R"]} />
          <primitive object={nodes["DEF-f_middle03R"]} />
          <primitive object={nodes.f_middle01_masterR} />
          <primitive object={nodes["DEF-palm02R"]} />
          <primitive object={nodes["MCH-f_middle01_drvR"]} />
          <primitive object={nodes.f_middle01R_1} />
          <primitive object={nodes["MCH-f_middle02_drvR"]} />
          <primitive object={nodes.f_middle02R_1} />
          <primitive object={nodes["MCH-f_middle03_drvR"]} />
          <primitive object={nodes.f_middle03R_1} />
          <primitive object={nodes.f_middle01R001} />
          <primitive object={nodes["MCH-f_middle03R"]} />
          <primitive object={nodes["MCH-f_middle02R"]} />
          <primitive object={nodes["MCH-f_middle01R"]} />
          <primitive object={nodes["ORG-palm03R"]} />
          <primitive object={nodes["ORG-f_ring01R"]} />
          <primitive object={nodes["ORG-f_ring02R"]} />
          <primitive object={nodes["ORG-f_ring03R"]} />
          <primitive object={nodes["DEF-f_ring01R"]} />
          <primitive object={nodes["DEF-f_ring02R"]} />
          <primitive object={nodes["DEF-f_ring03R"]} />
          <primitive object={nodes.f_ring01_masterR} />
          <primitive object={nodes["DEF-palm03R"]} />
          <primitive object={nodes["MCH-f_ring01_drvR"]} />
          <primitive object={nodes.f_ring01R_1} />
          <primitive object={nodes["MCH-f_ring02_drvR"]} />
          <primitive object={nodes.f_ring02R_1} />
          <primitive object={nodes["MCH-f_ring03_drvR"]} />
          <primitive object={nodes.f_ring03R_1} />
          <primitive object={nodes.f_ring01R001} />
          <primitive object={nodes["MCH-f_ring03R"]} />
          <primitive object={nodes["MCH-f_ring02R"]} />
          <primitive object={nodes["MCH-f_ring01R"]} />
          <primitive object={nodes["ORG-palm04R"]} />
          <primitive object={nodes["ORG-f_pinky01R"]} />
          <primitive object={nodes["ORG-f_pinky02R"]} />
          <primitive object={nodes["ORG-f_pinky03R"]} />
          <primitive object={nodes["DEF-f_pinky01R"]} />
          <primitive object={nodes["DEF-f_pinky02R"]} />
          <primitive object={nodes["DEF-f_pinky03R"]} />
          <primitive object={nodes.f_pinky01_masterR} />
          <primitive object={nodes["DEF-palm04R"]} />
          <primitive object={nodes["MCH-f_pinky01_drvR"]} />
          <primitive object={nodes.f_pinky01R_1} />
          <primitive object={nodes["MCH-f_pinky02_drvR"]} />
          <primitive object={nodes.f_pinky02R_1} />
          <primitive object={nodes["MCH-f_pinky03_drvR"]} />
          <primitive object={nodes.f_pinky03R_1} />
          <primitive object={nodes.f_pinky01R001} />
          <primitive object={nodes["MCH-f_pinky03R"]} />
          <primitive object={nodes["MCH-f_pinky02R"]} />
          <primitive object={nodes["MCH-f_pinky01R"]} />
          <primitive object={nodes.palmR} />
          <primitive object={nodes["ORG-breastL"]} />
          <primitive object={nodes["DEF-breastL"]} />
          <primitive object={nodes["ORG-breastR"]} />
          <primitive object={nodes["DEF-breastR"]} />
          <primitive object={nodes.breastL_1} />
          <primitive object={nodes.breastR_1} />
          <primitive object={nodes.shoulderL_1} />
          <primitive object={nodes.shoulderR_1} />
          <primitive object={nodes["MCH-WGT-chest"]} />
          <primitive object={nodes.hand_ikL} />
          <primitive object={nodes["MCH-upper_arm_ik_targetL"]} />
          <primitive object={nodes.upper_arm_ik_targetL} />
          <primitive object={nodes.hand_ikR} />
          <primitive object={nodes["MCH-upper_arm_ik_targetR"]} />
          <primitive object={nodes.upper_arm_ik_targetR} />
          <primitive object={nodes.eye_common} />
          <primitive object={nodes.eyeL_1} />
          <primitive object={nodes.eyeR_1} />
          <primitive object={nodes.foot_ikL} />
          <primitive object={nodes.foot_spin_ikL} />
          <primitive object={nodes.foot_heel_ikL} />
          <primitive object={nodes["MCH-heel02_rock2L"]} />
          <primitive object={nodes["MCH-heel02_rock1L"]} />
          <primitive object={nodes["MCH-heel02_roll2L"]} />
          <primitive object={nodes["MCH-heel02_roll1L"]} />
          <primitive object={nodes["MCH-foot_rollL"]} />
          <primitive object={nodes["MCH-thigh_ik_targetL"]} />
          <primitive object={nodes["MCH-toe_ik_parentL"]} />
          <primitive object={nodes.toe_ikL} />
          <primitive object={nodes.thigh_ik_targetL} />
          <primitive object={nodes.foot_ikR} />
          <primitive object={nodes.foot_spin_ikR} />
          <primitive object={nodes.foot_heel_ikR} />
          <primitive object={nodes["MCH-heel02_rock2R"]} />
          <primitive object={nodes["MCH-heel02_rock1R"]} />
          <primitive object={nodes["MCH-heel02_roll2R"]} />
          <primitive object={nodes["MCH-heel02_roll1R"]} />
          <primitive object={nodes["MCH-foot_rollR"]} />
          <primitive object={nodes["MCH-thigh_ik_targetR"]} />
          <primitive object={nodes["MCH-toe_ik_parentR"]} />
          <primitive object={nodes.toe_ikR} />
          <primitive object={nodes.thigh_ik_targetR} />
          <primitive object={nodes["MCH-lip_offsetBL001"]} />
          <primitive object={nodes.lipBL001_1} />
          <primitive object={nodes["MCH-lip_offsetBR001"]} />
          <primitive object={nodes.lipBR001_1} />
          <primitive object={nodes["MCH-lip_offsetTL001"]} />
          <primitive object={nodes.lipTL001_1} />
          <primitive object={nodes["MCH-lip_offsetTR001"]} />
          <primitive object={nodes.lipTR001_1} />
        </group>
        <skinnedMesh name="Eyel" geometry={nodes.Eyel.geometry} material={materials["eye."]} skeleton={nodes.Eyel.skeleton} position={[0, -0.86104661, 0]} />
        <skinnedMesh name="Eyer" geometry={nodes.Eyer.geometry} material={materials["eye."]} skeleton={nodes.Eyer.skeleton} position={[0, -0.86104661, 0]} />
        <skinnedMesh name="Eyebrows" geometry={nodes.Eyebrows.geometry} material={materials.head} skeleton={nodes.Eyebrows.skeleton} position={[0, -0.86104661, 0]} />
        <skinnedMesh name="Hair" geometry={nodes.Hair.geometry} material={materials.HairTop} skeleton={nodes.Hair.skeleton} position={[0, -0.86104661, 0]} />
        <group name="Head" position={[0, -0.86104661, 0]}>
          <skinnedMesh name="Plane" geometry={nodes.Plane.geometry} material={materials.head} skeleton={nodes.Plane.skeleton} />
          <skinnedMesh name="Plane_1" geometry={nodes.Plane_1.geometry} material={materials.Beard} skeleton={nodes.Plane_1.skeleton} />
        </group>
        <skinnedMesh name="SideHair" geometry={nodes.SideHair.geometry} material={materials.Hair} skeleton={nodes.SideHair.skeleton} position={[0, -0.86104661, 0]} />
        <skinnedMesh name="Teethb" geometry={nodes.Teethb.geometry} material={materials.head} skeleton={nodes.Teethb.skeleton} position={[0, -0.86104661, 0]} />
        <skinnedMesh name="Teetht" geometry={nodes.Teetht.geometry} material={materials.head} skeleton={nodes.Teetht.skeleton} position={[0, -0.86104661, 0]}>
          <Outlines thickness={0.0005} color="#424242" />
        </skinnedMesh>
        <skinnedMesh name="Tongue" geometry={nodes.Tongue.geometry} material={materials.head} skeleton={nodes.Tongue.skeleton} position={[0, -0.86104661, 0]} />
      </group>
    </group>
  );
}

type GLTFResult = GLTF & {
  nodes: {
    glasses: THREE.Mesh;
    Eyel: THREE.SkinnedMesh;
    Eyer: THREE.SkinnedMesh;
    Eyebrows: THREE.SkinnedMesh;
    Hair: THREE.SkinnedMesh;
    Plane: THREE.SkinnedMesh;
    Plane_1: THREE.SkinnedMesh;
    SideHair: THREE.SkinnedMesh;
    Teethb: THREE.SkinnedMesh;
    Teetht: THREE.SkinnedMesh;
    Tongue: THREE.SkinnedMesh;
    root: THREE.Bone;
    ["MCH-torsoparent"]: THREE.Bone;
    ["MCH-hand_ikparentL"]: THREE.Bone;
    ["MCH-upper_arm_ik_targetparentL"]: THREE.Bone;
    ["MCH-hand_ikparentR"]: THREE.Bone;
    ["MCH-upper_arm_ik_targetparentR"]: THREE.Bone;
    ["MCH-eye_commonparent"]: THREE.Bone;
    ["MCH-foot_ikparentL"]: THREE.Bone;
    ["MCH-thigh_ik_targetparentL"]: THREE.Bone;
    ["MCH-foot_ikparentR"]: THREE.Bone;
    ["MCH-thigh_ik_targetparentR"]: THREE.Bone;
    ["MCH-lip_armBL001"]: THREE.Bone;
    ["MCH-lip_armBR001"]: THREE.Bone;
    ["MCH-lip_armTL001"]: THREE.Bone;
    ["MCH-lip_armTR001"]: THREE.Bone;
    ["DEF-spine"]: THREE.Bone;
    ["DEF-spine001"]: THREE.Bone;
    ["DEF-spine002"]: THREE.Bone;
    ["DEF-spine003"]: THREE.Bone;
    ["DEF-spine004"]: THREE.Bone;
    ["DEF-spine005"]: THREE.Bone;
    ["DEF-spine006"]: THREE.Bone;
    VIS_upper_arm_ik_poleL: THREE.Bone;
    VIS_upper_arm_ik_poleR: THREE.Bone;
    VIS_thigh_ik_poleL: THREE.Bone;
    VIS_thigh_ik_poleR: THREE.Bone;
    torso: THREE.Bone;
    hips: THREE.Bone;
    chest: THREE.Bone;
    ["MCH-spine001"]: THREE.Bone;
    spine_fk001: THREE.Bone;
    ["MCH-spine"]: THREE.Bone;
    spine_fk: THREE.Bone;
    tweak_spine: THREE.Bone;
    ["ORG-spine"]: THREE.Bone;
    ["ORG-pelvisL"]: THREE.Bone;
    ["DEF-pelvisL"]: THREE.Bone;
    ["ORG-pelvisR"]: THREE.Bone;
    ["DEF-pelvisR"]: THREE.Bone;
    ["ORG-thighL"]: THREE.Bone;
    ["ORG-shinL"]: THREE.Bone;
    ["ORG-footL"]: THREE.Bone;
    ["ORG-toeL"]: THREE.Bone;
    ["ORG-heel02L"]: THREE.Bone;
    ["MCH-foot_tweakL"]: THREE.Bone;
    foot_tweakL: THREE.Bone;
    ["MCH-shin_tweakL"]: THREE.Bone;
    shin_tweakL: THREE.Bone;
    ["MCH-shin_tweakL001"]: THREE.Bone;
    shin_tweakL001: THREE.Bone;
    ["MCH-thigh_parent_widgetL"]: THREE.Bone;
    ["MCH-thigh_tweakL001"]: THREE.Bone;
    thigh_tweakL001: THREE.Bone;
    ["ORG-thighR"]: THREE.Bone;
    ["ORG-shinR"]: THREE.Bone;
    ["ORG-footR"]: THREE.Bone;
    ["ORG-toeR"]: THREE.Bone;
    ["ORG-heel02R"]: THREE.Bone;
    ["MCH-foot_tweakR"]: THREE.Bone;
    foot_tweakR: THREE.Bone;
    ["MCH-shin_tweakR"]: THREE.Bone;
    shin_tweakR: THREE.Bone;
    ["MCH-shin_tweakR001"]: THREE.Bone;
    shin_tweakR001: THREE.Bone;
    ["MCH-thigh_parent_widgetR"]: THREE.Bone;
    ["MCH-thigh_tweakR001"]: THREE.Bone;
    thigh_tweakR001: THREE.Bone;
    thigh_parentL: THREE.Bone;
    ["MCH-thigh_parentL"]: THREE.Bone;
    thigh_fkL: THREE.Bone;
    shin_fkL: THREE.Bone;
    ["MCH-foot_fkL"]: THREE.Bone;
    foot_fkL: THREE.Bone;
    ["MCH-toe_fkL"]: THREE.Bone;
    toe_fkL: THREE.Bone;
    ["MCH-thigh_ik_swingL"]: THREE.Bone;
    thigh_ikL: THREE.Bone;
    ["MCH-shin_ikL"]: THREE.Bone;
    ["MCH-thigh_tweakL"]: THREE.Bone;
    thigh_tweakL: THREE.Bone;
    ["DEF-thighL"]: THREE.Bone;
    ["DEF-thighL001"]: THREE.Bone;
    ["DEF-shinL"]: THREE.Bone;
    ["DEF-shinL001"]: THREE.Bone;
    ["DEF-footL"]: THREE.Bone;
    ["DEF-toeL"]: THREE.Bone;
    thigh_parentR: THREE.Bone;
    ["MCH-thigh_parentR"]: THREE.Bone;
    thigh_fkR: THREE.Bone;
    shin_fkR: THREE.Bone;
    ["MCH-foot_fkR"]: THREE.Bone;
    foot_fkR: THREE.Bone;
    ["MCH-toe_fkR"]: THREE.Bone;
    toe_fkR: THREE.Bone;
    ["MCH-thigh_ik_swingR"]: THREE.Bone;
    thigh_ikR: THREE.Bone;
    ["MCH-shin_ikR"]: THREE.Bone;
    ["MCH-thigh_tweakR"]: THREE.Bone;
    thigh_tweakR: THREE.Bone;
    ["DEF-thighR"]: THREE.Bone;
    ["DEF-thighR001"]: THREE.Bone;
    ["DEF-shinR"]: THREE.Bone;
    ["DEF-shinR001"]: THREE.Bone;
    ["DEF-footR"]: THREE.Bone;
    ["DEF-toeR"]: THREE.Bone;
    tweak_spine001: THREE.Bone;
    ["ORG-spine001"]: THREE.Bone;
    ["MCH-WGT-hips"]: THREE.Bone;
    ["MCH-spine002"]: THREE.Bone;
    spine_fk002: THREE.Bone;
    ["MCH-pivot"]: THREE.Bone;
    tweak_spine002: THREE.Bone;
    ["ORG-spine002"]: THREE.Bone;
    ["MCH-spine003"]: THREE.Bone;
    spine_fk003: THREE.Bone;
    ["ORG-spine004"]: THREE.Bone;
    ["ORG-spine005"]: THREE.Bone;
    ["ORG-spine006"]: THREE.Bone;
    ["ORG-face"]: THREE.Bone;
    ["ORG-nose"]: THREE.Bone;
    ["ORG-nose001"]: THREE.Bone;
    ["ORG-nose004"]: THREE.Bone;
    ["ORG-earL"]: THREE.Bone;
    ["ORG-earL001"]: THREE.Bone;
    ["ORG-earL002"]: THREE.Bone;
    ["ORG-earL003"]: THREE.Bone;
    ["ORG-earL004"]: THREE.Bone;
    ["DEF-earL"]: THREE.Bone;
    ["MCH-ear_handleL001"]: THREE.Bone;
    ["DEF-earL001"]: THREE.Bone;
    ["MCH-ear_handleL002"]: THREE.Bone;
    ["MCH-ear_handleL003"]: THREE.Bone;
    ["DEF-earL002"]: THREE.Bone;
    ["DEF-earL003"]: THREE.Bone;
    ["MCH-ear_handleL004"]: THREE.Bone;
    ["MCH-ear_end_handleL004"]: THREE.Bone;
    ["DEF-earL004"]: THREE.Bone;
    earL001_1: THREE.Bone;
    earL002_1: THREE.Bone;
    ["MCH-ear_offsetL003"]: THREE.Bone;
    earL003_1: THREE.Bone;
    earL004_1: THREE.Bone;
    ear_endL004: THREE.Bone;
    ["ORG-earR"]: THREE.Bone;
    ["ORG-earR001"]: THREE.Bone;
    ["ORG-earR002"]: THREE.Bone;
    ["ORG-earR003"]: THREE.Bone;
    ["ORG-earR004"]: THREE.Bone;
    ["DEF-earR"]: THREE.Bone;
    ["MCH-ear_handleR001"]: THREE.Bone;
    ["DEF-earR001"]: THREE.Bone;
    ["MCH-ear_handleR002"]: THREE.Bone;
    ["MCH-ear_handleR003"]: THREE.Bone;
    ["DEF-earR002"]: THREE.Bone;
    ["DEF-earR003"]: THREE.Bone;
    ["MCH-ear_handleR004"]: THREE.Bone;
    ["MCH-ear_end_handleR004"]: THREE.Bone;
    ["DEF-earR004"]: THREE.Bone;
    earR001_1: THREE.Bone;
    earR002_1: THREE.Bone;
    ["MCH-ear_offsetR003"]: THREE.Bone;
    earR003_1: THREE.Bone;
    earR004_1: THREE.Bone;
    ear_endR004: THREE.Bone;
    ["ORG-browBL"]: THREE.Bone;
    ["ORG-browBL001"]: THREE.Bone;
    ["ORG-browBL002"]: THREE.Bone;
    ["ORG-browBL003"]: THREE.Bone;
    ["ORG-browBR"]: THREE.Bone;
    ["ORG-browBR001"]: THREE.Bone;
    ["ORG-browBR002"]: THREE.Bone;
    ["ORG-browBR003"]: THREE.Bone;
    ["ORG-foreheadL"]: THREE.Bone;
    ["ORG-foreheadL001"]: THREE.Bone;
    ["ORG-foreheadL002"]: THREE.Bone;
    ["ORG-templeL"]: THREE.Bone;
    ["ORG-cheekBL"]: THREE.Bone;
    ["ORG-cheekBL001"]: THREE.Bone;
    ["ORG-browTL"]: THREE.Bone;
    ["ORG-browTL001"]: THREE.Bone;
    ["ORG-browTL002"]: THREE.Bone;
    ["ORG-browTL003"]: THREE.Bone;
    ["ORG-foreheadR"]: THREE.Bone;
    ["ORG-foreheadR001"]: THREE.Bone;
    ["ORG-foreheadR002"]: THREE.Bone;
    ["ORG-templeR"]: THREE.Bone;
    ["ORG-cheekBR"]: THREE.Bone;
    ["ORG-cheekBR001"]: THREE.Bone;
    ["ORG-browTR"]: THREE.Bone;
    ["ORG-browTR001"]: THREE.Bone;
    ["ORG-browTR002"]: THREE.Bone;
    ["ORG-browTR003"]: THREE.Bone;
    ["ORG-cheekTL"]: THREE.Bone;
    ["ORG-cheekTL001"]: THREE.Bone;
    ["ORG-cheekTR"]: THREE.Bone;
    ["ORG-cheekTR001"]: THREE.Bone;
    ["ORG-teethT"]: THREE.Bone;
    ["DEF-teethT"]: THREE.Bone;
    ["ORG-nose_master"]: THREE.Bone;
    ["ORG-nose002"]: THREE.Bone;
    ["ORG-nose003"]: THREE.Bone;
    ["ORG-noseL001"]: THREE.Bone;
    ["ORG-noseR001"]: THREE.Bone;
    ["MCH-nose_handle002"]: THREE.Bone;
    ["MCH-nose_handle003"]: THREE.Bone;
    ["DEF-nose002"]: THREE.Bone;
    ["DEF-nose003"]: THREE.Bone;
    ["MCH-nose_handleL001"]: THREE.Bone;
    ["MCH-nose_end_handleL001"]: THREE.Bone;
    ["DEF-noseL001"]: THREE.Bone;
    ["MCH-nose_handleR001"]: THREE.Bone;
    ["MCH-nose_end_handleR001"]: THREE.Bone;
    ["DEF-noseR001"]: THREE.Bone;
    noseL001_1: THREE.Bone;
    ["ORG-nose_glueL001"]: THREE.Bone;
    noseR001_1: THREE.Bone;
    ["ORG-nose_glueR001"]: THREE.Bone;
    nose002_1: THREE.Bone;
    nose004_1: THREE.Bone;
    ["ORG-nose_glue004"]: THREE.Bone;
    ["MCH-nose_offset003"]: THREE.Bone;
    nose003_1: THREE.Bone;
    ["ORG-browBL004"]: THREE.Bone;
    ["ORG-noseL"]: THREE.Bone;
    ["ORG-browBR004"]: THREE.Bone;
    ["ORG-noseR"]: THREE.Bone;
    earL_1: THREE.Bone;
    earR_1: THREE.Bone;
    eye_masterL: THREE.Bone;
    ["ORG-eyeL"]: THREE.Bone;
    ["ORG-lidTL"]: THREE.Bone;
    ["ORG-lidTL001"]: THREE.Bone;
    ["ORG-lidTL002"]: THREE.Bone;
    ["ORG-lidTL003"]: THREE.Bone;
    ["ORG-lidBL"]: THREE.Bone;
    ["ORG-lidBL001"]: THREE.Bone;
    ["ORG-lidBL002"]: THREE.Bone;
    ["ORG-lidBL003"]: THREE.Bone;
    ["DEF-eye_masterL"]: THREE.Bone;
    ["MCH-lid_handleBL"]: THREE.Bone;
    ["MCH-lid_handleBL001"]: THREE.Bone;
    ["MCH-lid_handleBL002"]: THREE.Bone;
    ["MCH-lid_handleBL003"]: THREE.Bone;
    ["MCH-lid_end_handleBL003"]: THREE.Bone;
    ["MCH-lid_handle_preBL"]: THREE.Bone;
    ["MCH-lid_handle_preBL001"]: THREE.Bone;
    ["MCH-lid_handle_preBL002"]: THREE.Bone;
    ["MCH-lid_handle_preBL003"]: THREE.Bone;
    ["MCH-lid_end_handle_preBL003"]: THREE.Bone;
    ["DEF-lidBL"]: THREE.Bone;
    ["DEF-lidBL001"]: THREE.Bone;
    ["DEF-lidBL002"]: THREE.Bone;
    ["DEF-lidBL003"]: THREE.Bone;
    ["MCH-lid_handleTL"]: THREE.Bone;
    ["MCH-lid_handleTL001"]: THREE.Bone;
    ["MCH-lid_handleTL002"]: THREE.Bone;
    ["MCH-lid_handleTL003"]: THREE.Bone;
    ["MCH-lid_end_handleTL003"]: THREE.Bone;
    ["MCH-lid_handle_preTL"]: THREE.Bone;
    ["MCH-lid_handle_preTL001"]: THREE.Bone;
    ["MCH-lid_handle_preTL002"]: THREE.Bone;
    ["MCH-lid_handle_preTL003"]: THREE.Bone;
    ["MCH-lid_end_handle_preTL003"]: THREE.Bone;
    ["DEF-lidTL"]: THREE.Bone;
    ["DEF-lidTL001"]: THREE.Bone;
    ["DEF-lidTL002"]: THREE.Bone;
    ["DEF-lidTL003"]: THREE.Bone;
    lidBL_1: THREE.Bone;
    ["MCH-lid_offsetBL001"]: THREE.Bone;
    lidBL001_1: THREE.Bone;
    ["MCH-lid_offsetBL002"]: THREE.Bone;
    lidBL002_1: THREE.Bone;
    ["ORG-lid_glueBL002"]: THREE.Bone;
    ["MCH-lid_offsetBL003"]: THREE.Bone;
    lidBL003_1: THREE.Bone;
    lidTL_1: THREE.Bone;
    ["MCH-lid_offsetTL001"]: THREE.Bone;
    lidTL001_1: THREE.Bone;
    ["MCH-lid_offsetTL002"]: THREE.Bone;
    lidTL002_1: THREE.Bone;
    ["MCH-lid_offsetTL003"]: THREE.Bone;
    lidTL003_1: THREE.Bone;
    ["MCH-eyeL"]: THREE.Bone;
    ["DEF-eyeL"]: THREE.Bone;
    ["DEF-eye_irisL"]: THREE.Bone;
    ["MCH-eye_trackL"]: THREE.Bone;
    eye_masterR: THREE.Bone;
    ["ORG-eyeR"]: THREE.Bone;
    ["ORG-lidTR"]: THREE.Bone;
    ["ORG-lidTR001"]: THREE.Bone;
    ["ORG-lidTR002"]: THREE.Bone;
    ["ORG-lidTR003"]: THREE.Bone;
    ["ORG-lidBR"]: THREE.Bone;
    ["ORG-lidBR001"]: THREE.Bone;
    ["ORG-lidBR002"]: THREE.Bone;
    ["ORG-lidBR003"]: THREE.Bone;
    ["DEF-eye_masterR"]: THREE.Bone;
    ["MCH-lid_handleBR"]: THREE.Bone;
    ["MCH-lid_handleBR001"]: THREE.Bone;
    ["MCH-lid_handleBR002"]: THREE.Bone;
    ["MCH-lid_handleBR003"]: THREE.Bone;
    ["MCH-lid_end_handleBR003"]: THREE.Bone;
    ["MCH-lid_handle_preBR"]: THREE.Bone;
    ["MCH-lid_handle_preBR001"]: THREE.Bone;
    ["MCH-lid_handle_preBR002"]: THREE.Bone;
    ["MCH-lid_handle_preBR003"]: THREE.Bone;
    ["MCH-lid_end_handle_preBR003"]: THREE.Bone;
    ["DEF-lidBR"]: THREE.Bone;
    ["DEF-lidBR001"]: THREE.Bone;
    ["DEF-lidBR002"]: THREE.Bone;
    ["DEF-lidBR003"]: THREE.Bone;
    ["MCH-lid_handleTR"]: THREE.Bone;
    ["MCH-lid_handleTR001"]: THREE.Bone;
    ["MCH-lid_handleTR002"]: THREE.Bone;
    ["MCH-lid_handleTR003"]: THREE.Bone;
    ["MCH-lid_end_handleTR003"]: THREE.Bone;
    ["MCH-lid_handle_preTR"]: THREE.Bone;
    ["MCH-lid_handle_preTR001"]: THREE.Bone;
    ["MCH-lid_handle_preTR002"]: THREE.Bone;
    ["MCH-lid_handle_preTR003"]: THREE.Bone;
    ["MCH-lid_end_handle_preTR003"]: THREE.Bone;
    ["DEF-lidTR"]: THREE.Bone;
    ["DEF-lidTR001"]: THREE.Bone;
    ["DEF-lidTR002"]: THREE.Bone;
    ["DEF-lidTR003"]: THREE.Bone;
    lidBR_1: THREE.Bone;
    ["MCH-lid_offsetBR001"]: THREE.Bone;
    lidBR001_1: THREE.Bone;
    ["MCH-lid_offsetBR002"]: THREE.Bone;
    lidBR002_1: THREE.Bone;
    ["ORG-lid_glueBR002"]: THREE.Bone;
    ["MCH-lid_offsetBR003"]: THREE.Bone;
    lidBR003_1: THREE.Bone;
    lidTR_1: THREE.Bone;
    ["MCH-lid_offsetTR001"]: THREE.Bone;
    lidTR001_1: THREE.Bone;
    ["MCH-lid_offsetTR002"]: THREE.Bone;
    lidTR002_1: THREE.Bone;
    ["MCH-lid_offsetTR003"]: THREE.Bone;
    lidTR003_1: THREE.Bone;
    ["MCH-eyeR"]: THREE.Bone;
    ["DEF-eyeR"]: THREE.Bone;
    ["DEF-eye_irisR"]: THREE.Bone;
    ["MCH-eye_trackR"]: THREE.Bone;
    jaw_master_1: THREE.Bone;
    ["ORG-jaw_master"]: THREE.Bone;
    ["ORG-jaw"]: THREE.Bone;
    ["ORG-chin"]: THREE.Bone;
    ["ORG-chin001"]: THREE.Bone;
    ["ORG-jawL"]: THREE.Bone;
    ["ORG-jawL001"]: THREE.Bone;
    ["ORG-chinL"]: THREE.Bone;
    ["ORG-jawR"]: THREE.Bone;
    ["ORG-jawR001"]: THREE.Bone;
    ["ORG-chinR"]: THREE.Bone;
    ["ORG-teethB"]: THREE.Bone;
    ["DEF-teethB"]: THREE.Bone;
    ["ORG-tongue"]: THREE.Bone;
    ["ORG-tongue001"]: THREE.Bone;
    ["ORG-tongue002"]: THREE.Bone;
    teethB_1: THREE.Bone;
    tongue_1: THREE.Bone;
    tweak_tongue: THREE.Bone;
    ["DEF-tongue"]: THREE.Bone;
    ["DEF-tongue001"]: THREE.Bone;
    ["DEF-tongue002"]: THREE.Bone;
    ["DEF-jaw_master"]: THREE.Bone;
    ["MCH-chin_handle"]: THREE.Bone;
    ["MCH-chin_handle001"]: THREE.Bone;
    ["MCH-chin_end_handle001"]: THREE.Bone;
    ["DEF-chin"]: THREE.Bone;
    ["DEF-chin001"]: THREE.Bone;
    ["MCH-jaw_handle"]: THREE.Bone;
    ["DEF-jaw"]: THREE.Bone;
    ["MCH-jaw_handleL"]: THREE.Bone;
    ["MCH-jaw_handleL001"]: THREE.Bone;
    ["MCH-chin_handleL"]: THREE.Bone;
    ["MCH-chin_end_handleL"]: THREE.Bone;
    ["DEF-jawL"]: THREE.Bone;
    ["DEF-jawL001"]: THREE.Bone;
    ["DEF-chinL"]: THREE.Bone;
    ["MCH-jaw_handleR"]: THREE.Bone;
    ["MCH-jaw_handleR001"]: THREE.Bone;
    ["MCH-chin_handleR"]: THREE.Bone;
    ["MCH-chin_end_handleR"]: THREE.Bone;
    ["DEF-jawR"]: THREE.Bone;
    ["DEF-jawR001"]: THREE.Bone;
    ["DEF-chinR"]: THREE.Bone;
    tweak_tongue003: THREE.Bone;
    ["MCH-tongue001"]: THREE.Bone;
    tweak_tongue001: THREE.Bone;
    ["MCH-tongue002"]: THREE.Bone;
    tweak_tongue002: THREE.Bone;
    chin_1: THREE.Bone;
    ["MCH-chin_offset001"]: THREE.Bone;
    chin001_1: THREE.Bone;
    chin_end001: THREE.Bone;
    ["ORG-chin_end_glue001"]: THREE.Bone;
    ["MCH-chin_end_glue_reparent001"]: THREE.Bone;
    jaw_1: THREE.Bone;
    jawL001_1: THREE.Bone;
    chinL_1: THREE.Bone;
    jawR001_1: THREE.Bone;
    chinR_1: THREE.Bone;
    ["MCH-jaw_master_lock"]: THREE.Bone;
    ["MCH-jaw_master_top"]: THREE.Bone;
    ["ORG-lipTL"]: THREE.Bone;
    ["ORG-lipTL001"]: THREE.Bone;
    ["ORG-lipTR"]: THREE.Bone;
    ["ORG-lipTR001"]: THREE.Bone;
    ["MCH-jaw_master_middle"]: THREE.Bone;
    jaw_master_mouth: THREE.Bone;
    ["MCH-jaw_master_top_out"]: THREE.Bone;
    ["MCH-lip_armTL"]: THREE.Bone;
    lipT: THREE.Bone;
    ["MCH-jaw_master_bottom_out"]: THREE.Bone;
    ["MCH-lip_armBL"]: THREE.Bone;
    lipB: THREE.Bone;
    ["MCH-jaw_master_middle_out"]: THREE.Bone;
    ["MCH-lip_end_armBL001"]: THREE.Bone;
    lip_endL001: THREE.Bone;
    ["MCH-lip_end_armBR001"]: THREE.Bone;
    lip_endR001: THREE.Bone;
    ["MCH-lip_handleTL"]: THREE.Bone;
    ["MCH-lip_handleTL001"]: THREE.Bone;
    ["MCH-lip_end_handleTL001"]: THREE.Bone;
    ["DEF-lipTL"]: THREE.Bone;
    ["DEF-lipTL001"]: THREE.Bone;
    ["MCH-lip_handleTR"]: THREE.Bone;
    ["MCH-lip_handleTR001"]: THREE.Bone;
    ["MCH-lip_end_handleTR001"]: THREE.Bone;
    ["DEF-lipTR"]: THREE.Bone;
    ["DEF-lipTR001"]: THREE.Bone;
    ["MCH-jaw_master_bottom"]: THREE.Bone;
    ["ORG-lipBL"]: THREE.Bone;
    ["ORG-lipBL001"]: THREE.Bone;
    ["ORG-lipBR"]: THREE.Bone;
    ["ORG-lipBR001"]: THREE.Bone;
    ["MCH-lip_handleBL"]: THREE.Bone;
    ["MCH-lip_handleBL001"]: THREE.Bone;
    ["MCH-lip_end_handleBL001"]: THREE.Bone;
    ["DEF-lipBL"]: THREE.Bone;
    ["DEF-lipBL001"]: THREE.Bone;
    ["MCH-lip_handleBR"]: THREE.Bone;
    ["MCH-lip_handleBR001"]: THREE.Bone;
    ["MCH-lip_end_handleBR001"]: THREE.Bone;
    ["DEF-lipBR"]: THREE.Bone;
    ["DEF-lipBR001"]: THREE.Bone;
    nose_master_1: THREE.Bone;
    teethT_1: THREE.Bone;
    ["MCH-brow_handleBL"]: THREE.Bone;
    ["MCH-brow_handleBL001"]: THREE.Bone;
    ["MCH-brow_handleBL002"]: THREE.Bone;
    ["MCH-brow_handleBL003"]: THREE.Bone;
    ["DEF-browBL"]: THREE.Bone;
    ["DEF-browBL001"]: THREE.Bone;
    ["DEF-browBL002"]: THREE.Bone;
    ["DEF-browBL003"]: THREE.Bone;
    ["MCH-brow_handleBL004"]: THREE.Bone;
    ["MCH-nose_handleL"]: THREE.Bone;
    ["MCH-nose_end_handleL"]: THREE.Bone;
    ["DEF-browBL004"]: THREE.Bone;
    ["DEF-noseL"]: THREE.Bone;
    ["MCH-brow_handleBR"]: THREE.Bone;
    ["MCH-brow_handleBR001"]: THREE.Bone;
    ["MCH-brow_handleBR002"]: THREE.Bone;
    ["MCH-brow_handleBR003"]: THREE.Bone;
    ["DEF-browBR"]: THREE.Bone;
    ["DEF-browBR001"]: THREE.Bone;
    ["DEF-browBR002"]: THREE.Bone;
    ["DEF-browBR003"]: THREE.Bone;
    ["MCH-brow_handleBR004"]: THREE.Bone;
    ["MCH-nose_handleR"]: THREE.Bone;
    ["MCH-nose_end_handleR"]: THREE.Bone;
    ["DEF-browBR004"]: THREE.Bone;
    ["DEF-noseR"]: THREE.Bone;
    ["MCH-brow_handleTL"]: THREE.Bone;
    ["DEF-browTL"]: THREE.Bone;
    ["MCH-brow_handleTL001"]: THREE.Bone;
    ["MCH-brow_handleTL002"]: THREE.Bone;
    ["DEF-browTL001"]: THREE.Bone;
    ["DEF-browTL002"]: THREE.Bone;
    ["MCH-brow_handleTL003"]: THREE.Bone;
    ["MCH-brow_end_handleTL003"]: THREE.Bone;
    ["DEF-browTL003"]: THREE.Bone;
    ["MCH-brow_handleTR"]: THREE.Bone;
    ["DEF-browTR"]: THREE.Bone;
    ["MCH-brow_handleTR001"]: THREE.Bone;
    ["MCH-brow_handleTR002"]: THREE.Bone;
    ["DEF-browTR001"]: THREE.Bone;
    ["DEF-browTR002"]: THREE.Bone;
    ["MCH-brow_handleTR003"]: THREE.Bone;
    ["MCH-brow_end_handleTR003"]: THREE.Bone;
    ["DEF-browTR003"]: THREE.Bone;
    ["MCH-cheek_handleBL"]: THREE.Bone;
    ["MCH-cheek_handleBL001"]: THREE.Bone;
    ["DEF-cheekBL"]: THREE.Bone;
    ["DEF-cheekBL001"]: THREE.Bone;
    ["MCH-cheek_handleBR"]: THREE.Bone;
    ["MCH-cheek_handleBR001"]: THREE.Bone;
    ["DEF-cheekBR"]: THREE.Bone;
    ["DEF-cheekBR001"]: THREE.Bone;
    ["MCH-cheek_handleTL"]: THREE.Bone;
    ["MCH-cheek_handleTL001"]: THREE.Bone;
    ["MCH-cheek_end_handleTL001"]: THREE.Bone;
    ["DEF-cheekTL"]: THREE.Bone;
    ["DEF-cheekTL001"]: THREE.Bone;
    ["MCH-cheek_handleTR"]: THREE.Bone;
    ["MCH-cheek_handleTR001"]: THREE.Bone;
    ["MCH-cheek_end_handleTR001"]: THREE.Bone;
    ["DEF-cheekTR"]: THREE.Bone;
    ["DEF-cheekTR001"]: THREE.Bone;
    ["MCH-forehead_handleL"]: THREE.Bone;
    ["MCH-forehead_end_handleL"]: THREE.Bone;
    ["DEF-foreheadL"]: THREE.Bone;
    ["MCH-forehead_handleL001"]: THREE.Bone;
    ["MCH-forehead_end_handleL001"]: THREE.Bone;
    ["DEF-foreheadL001"]: THREE.Bone;
    ["MCH-forehead_handleL002"]: THREE.Bone;
    ["MCH-forehead_end_handleL002"]: THREE.Bone;
    ["DEF-foreheadL002"]: THREE.Bone;
    ["MCH-forehead_handleR"]: THREE.Bone;
    ["MCH-forehead_end_handleR"]: THREE.Bone;
    ["DEF-foreheadR"]: THREE.Bone;
    ["MCH-forehead_handleR001"]: THREE.Bone;
    ["MCH-forehead_end_handleR001"]: THREE.Bone;
    ["DEF-foreheadR001"]: THREE.Bone;
    ["MCH-forehead_handleR002"]: THREE.Bone;
    ["MCH-forehead_end_handleR002"]: THREE.Bone;
    ["DEF-foreheadR002"]: THREE.Bone;
    ["MCH-nose_handle"]: THREE.Bone;
    ["MCH-nose_handle001"]: THREE.Bone;
    ["DEF-nose"]: THREE.Bone;
    ["DEF-nose001"]: THREE.Bone;
    ["MCH-nose_handle004"]: THREE.Bone;
    ["MCH-nose_end_handle004"]: THREE.Bone;
    ["DEF-nose004"]: THREE.Bone;
    ["MCH-temple_handleL"]: THREE.Bone;
    ["MCH-temple_end_handleL"]: THREE.Bone;
    ["DEF-templeL"]: THREE.Bone;
    ["MCH-temple_handleR"]: THREE.Bone;
    ["MCH-temple_end_handleR"]: THREE.Bone;
    ["DEF-templeR"]: THREE.Bone;
    browBL_1: THREE.Bone;
    ["MCH-brow_offsetBL001"]: THREE.Bone;
    browBL001_1: THREE.Bone;
    ["MCH-brow_offsetBL002"]: THREE.Bone;
    browBL002_1: THREE.Bone;
    ["ORG-brow_glueBL002"]: THREE.Bone;
    ["MCH-brow_offsetBL003"]: THREE.Bone;
    browBL003_1: THREE.Bone;
    browBL004_1: THREE.Bone;
    ["MCH-nose_offsetL"]: THREE.Bone;
    noseL_1: THREE.Bone;
    ["MCH-nose_end_reparentL"]: THREE.Bone;
    browBR_1: THREE.Bone;
    ["MCH-brow_offsetBR001"]: THREE.Bone;
    browBR001_1: THREE.Bone;
    ["MCH-brow_offsetBR002"]: THREE.Bone;
    browBR002_1: THREE.Bone;
    ["ORG-brow_glueBR002"]: THREE.Bone;
    ["MCH-brow_offsetBR003"]: THREE.Bone;
    browBR003_1: THREE.Bone;
    browBR004_1: THREE.Bone;
    ["MCH-nose_offsetR"]: THREE.Bone;
    noseR_1: THREE.Bone;
    ["MCH-nose_end_reparentR"]: THREE.Bone;
    browTL_1: THREE.Bone;
    browTL001_1: THREE.Bone;
    ["MCH-brow_reparentTL002"]: THREE.Bone;
    ["MCH-brow_offsetTL002"]: THREE.Bone;
    browTL002_1: THREE.Bone;
    browTL003_1: THREE.Bone;
    nose_1: THREE.Bone;
    browTR_1: THREE.Bone;
    browTR001_1: THREE.Bone;
    ["MCH-brow_reparentTR002"]: THREE.Bone;
    ["MCH-brow_offsetTR002"]: THREE.Bone;
    browTR002_1: THREE.Bone;
    browTR003_1: THREE.Bone;
    ["MCH-cheek_reparentBL"]: THREE.Bone;
    ["MCH-cheek_reparentBL001"]: THREE.Bone;
    ["MCH-cheek_offsetBL001"]: THREE.Bone;
    cheekBL001_1: THREE.Bone;
    ["MCH-cheek_reparentBR"]: THREE.Bone;
    ["MCH-cheek_reparentBR001"]: THREE.Bone;
    ["MCH-cheek_offsetBR001"]: THREE.Bone;
    cheekBR001_1: THREE.Bone;
    cheekTL001_1: THREE.Bone;
    ["ORG-cheek_glueTL001"]: THREE.Bone;
    cheekTR001_1: THREE.Bone;
    ["ORG-cheek_glueTR001"]: THREE.Bone;
    foreheadL_1: THREE.Bone;
    foreheadL001_1: THREE.Bone;
    foreheadL002_1: THREE.Bone;
    foreheadR_1: THREE.Bone;
    foreheadR001_1: THREE.Bone;
    foreheadR002_1: THREE.Bone;
    jawL_1: THREE.Bone;
    jawR_1: THREE.Bone;
    ["MCH-nose_end_glue_reparent004"]: THREE.Bone;
    ["MCH-nose_glue_reparentL001"]: THREE.Bone;
    ["MCH-nose_glue_reparentR001"]: THREE.Bone;
    ["MCH-nose_offset001"]: THREE.Bone;
    nose001_1: THREE.Bone;
    ["MCH-nose_end_reparent001"]: THREE.Bone;
    nose_end004: THREE.Bone;
    ["ORG-nose_end_glue004"]: THREE.Bone;
    templeL_1: THREE.Bone;
    templeR_1: THREE.Bone;
    ["MCH-ROT-neck"]: THREE.Bone;
    neck: THREE.Bone;
    ["MCH-ROT-head"]: THREE.Bone;
    head: THREE.Bone;
    tweak_spine004: THREE.Bone;
    ["MCH-STR-neck"]: THREE.Bone;
    ["MCH-spine005"]: THREE.Bone;
    tweak_spine005: THREE.Bone;
    tweak_spine003: THREE.Bone;
    ["ORG-spine003"]: THREE.Bone;
    ["ORG-shoulderL"]: THREE.Bone;
    ["ORG-upper_armL"]: THREE.Bone;
    ["ORG-forearmL"]: THREE.Bone;
    ["ORG-handL"]: THREE.Bone;
    ["MCH-hand_tweakL"]: THREE.Bone;
    hand_tweakL: THREE.Bone;
    ["MCH-forearm_tweakL"]: THREE.Bone;
    forearm_tweakL: THREE.Bone;
    ["MCH-forearm_tweakL001"]: THREE.Bone;
    forearm_tweakL001: THREE.Bone;
    ["MCH-upper_arm_parent_widgetL"]: THREE.Bone;
    ["MCH-upper_arm_tweakL001"]: THREE.Bone;
    upper_arm_tweakL001: THREE.Bone;
    ["DEF-shoulderL"]: THREE.Bone;
    upper_arm_parentL: THREE.Bone;
    ["MCH-upper_arm_parentL"]: THREE.Bone;
    upper_arm_fkL: THREE.Bone;
    forearm_fkL: THREE.Bone;
    ["MCH-hand_fkL"]: THREE.Bone;
    hand_fkL: THREE.Bone;
    ["MCH-upper_arm_ik_swingL"]: THREE.Bone;
    upper_arm_ikL: THREE.Bone;
    ["MCH-forearm_ikL"]: THREE.Bone;
    ["MCH-upper_arm_tweakL"]: THREE.Bone;
    upper_arm_tweakL: THREE.Bone;
    ["DEF-upper_armL"]: THREE.Bone;
    ["DEF-upper_armL001"]: THREE.Bone;
    ["DEF-forearmL"]: THREE.Bone;
    ["DEF-forearmL001"]: THREE.Bone;
    ["DEF-handL"]: THREE.Bone;
    ["ORG-palm01L"]: THREE.Bone;
    ["ORG-f_index01L"]: THREE.Bone;
    ["ORG-f_index02L"]: THREE.Bone;
    ["ORG-f_index03L"]: THREE.Bone;
    ["ORG-thumb01L"]: THREE.Bone;
    ["ORG-thumb02L"]: THREE.Bone;
    ["ORG-thumb03L"]: THREE.Bone;
    ["DEF-f_index01L"]: THREE.Bone;
    ["DEF-f_index02L"]: THREE.Bone;
    ["DEF-f_index03L"]: THREE.Bone;
    f_index01_masterL: THREE.Bone;
    ["DEF-thumb01L"]: THREE.Bone;
    ["DEF-thumb02L"]: THREE.Bone;
    ["DEF-thumb03L"]: THREE.Bone;
    thumb01_masterL: THREE.Bone;
    ["DEF-palm01L"]: THREE.Bone;
    ["MCH-f_index01_drvL"]: THREE.Bone;
    f_index01L_1: THREE.Bone;
    ["MCH-f_index02_drvL"]: THREE.Bone;
    f_index02L_1: THREE.Bone;
    ["MCH-f_index03_drvL"]: THREE.Bone;
    f_index03L_1: THREE.Bone;
    f_index01L001: THREE.Bone;
    ["MCH-f_index03L"]: THREE.Bone;
    ["MCH-f_index02L"]: THREE.Bone;
    ["MCH-f_index01L"]: THREE.Bone;
    ["MCH-thumb01_drvL"]: THREE.Bone;
    thumb01L_1: THREE.Bone;
    ["MCH-thumb02_drvL"]: THREE.Bone;
    thumb02L_1: THREE.Bone;
    ["MCH-thumb03_drvL"]: THREE.Bone;
    thumb03L_1: THREE.Bone;
    thumb01L001: THREE.Bone;
    ["MCH-thumb03L"]: THREE.Bone;
    ["MCH-thumb02L"]: THREE.Bone;
    ["MCH-thumb01L"]: THREE.Bone;
    ["ORG-palm02L"]: THREE.Bone;
    ["ORG-f_middle01L"]: THREE.Bone;
    ["ORG-f_middle02L"]: THREE.Bone;
    ["ORG-f_middle03L"]: THREE.Bone;
    ["DEF-f_middle01L"]: THREE.Bone;
    ["DEF-f_middle02L"]: THREE.Bone;
    ["DEF-f_middle03L"]: THREE.Bone;
    f_middle01_masterL: THREE.Bone;
    ["DEF-palm02L"]: THREE.Bone;
    ["MCH-f_middle01_drvL"]: THREE.Bone;
    f_middle01L_1: THREE.Bone;
    ["MCH-f_middle02_drvL"]: THREE.Bone;
    f_middle02L_1: THREE.Bone;
    ["MCH-f_middle03_drvL"]: THREE.Bone;
    f_middle03L_1: THREE.Bone;
    f_middle01L001: THREE.Bone;
    ["MCH-f_middle03L"]: THREE.Bone;
    ["MCH-f_middle02L"]: THREE.Bone;
    ["MCH-f_middle01L"]: THREE.Bone;
    ["ORG-palm03L"]: THREE.Bone;
    ["ORG-f_ring01L"]: THREE.Bone;
    ["ORG-f_ring02L"]: THREE.Bone;
    ["ORG-f_ring03L"]: THREE.Bone;
    ["DEF-f_ring01L"]: THREE.Bone;
    ["DEF-f_ring02L"]: THREE.Bone;
    ["DEF-f_ring03L"]: THREE.Bone;
    f_ring01_masterL: THREE.Bone;
    ["DEF-palm03L"]: THREE.Bone;
    ["MCH-f_ring01_drvL"]: THREE.Bone;
    f_ring01L_1: THREE.Bone;
    ["MCH-f_ring02_drvL"]: THREE.Bone;
    f_ring02L_1: THREE.Bone;
    ["MCH-f_ring03_drvL"]: THREE.Bone;
    f_ring03L_1: THREE.Bone;
    f_ring01L001: THREE.Bone;
    ["MCH-f_ring03L"]: THREE.Bone;
    ["MCH-f_ring02L"]: THREE.Bone;
    ["MCH-f_ring01L"]: THREE.Bone;
    ["ORG-palm04L"]: THREE.Bone;
    ["ORG-f_pinky01L"]: THREE.Bone;
    ["ORG-f_pinky02L"]: THREE.Bone;
    ["ORG-f_pinky03L"]: THREE.Bone;
    ["DEF-f_pinky01L"]: THREE.Bone;
    ["DEF-f_pinky02L"]: THREE.Bone;
    ["DEF-f_pinky03L"]: THREE.Bone;
    f_pinky01_masterL: THREE.Bone;
    ["DEF-palm04L"]: THREE.Bone;
    ["MCH-f_pinky01_drvL"]: THREE.Bone;
    f_pinky01L_1: THREE.Bone;
    ["MCH-f_pinky02_drvL"]: THREE.Bone;
    f_pinky02L_1: THREE.Bone;
    ["MCH-f_pinky03_drvL"]: THREE.Bone;
    f_pinky03L_1: THREE.Bone;
    f_pinky01L001: THREE.Bone;
    ["MCH-f_pinky03L"]: THREE.Bone;
    ["MCH-f_pinky02L"]: THREE.Bone;
    ["MCH-f_pinky01L"]: THREE.Bone;
    palmL: THREE.Bone;
    ["ORG-shoulderR"]: THREE.Bone;
    ["ORG-upper_armR"]: THREE.Bone;
    ["ORG-forearmR"]: THREE.Bone;
    ["ORG-handR"]: THREE.Bone;
    ["MCH-hand_tweakR"]: THREE.Bone;
    hand_tweakR: THREE.Bone;
    ["MCH-forearm_tweakR"]: THREE.Bone;
    forearm_tweakR: THREE.Bone;
    ["MCH-forearm_tweakR001"]: THREE.Bone;
    forearm_tweakR001: THREE.Bone;
    ["MCH-upper_arm_parent_widgetR"]: THREE.Bone;
    ["MCH-upper_arm_tweakR001"]: THREE.Bone;
    upper_arm_tweakR001: THREE.Bone;
    ["DEF-shoulderR"]: THREE.Bone;
    upper_arm_parentR: THREE.Bone;
    ["MCH-upper_arm_parentR"]: THREE.Bone;
    upper_arm_fkR: THREE.Bone;
    forearm_fkR: THREE.Bone;
    ["MCH-hand_fkR"]: THREE.Bone;
    hand_fkR: THREE.Bone;
    ["MCH-upper_arm_ik_swingR"]: THREE.Bone;
    upper_arm_ikR: THREE.Bone;
    ["MCH-forearm_ikR"]: THREE.Bone;
    ["MCH-upper_arm_tweakR"]: THREE.Bone;
    upper_arm_tweakR: THREE.Bone;
    ["DEF-upper_armR"]: THREE.Bone;
    ["DEF-upper_armR001"]: THREE.Bone;
    ["DEF-forearmR"]: THREE.Bone;
    ["DEF-forearmR001"]: THREE.Bone;
    ["DEF-handR"]: THREE.Bone;
    ["ORG-palm01R"]: THREE.Bone;
    ["ORG-f_index01R"]: THREE.Bone;
    ["ORG-f_index02R"]: THREE.Bone;
    ["ORG-f_index03R"]: THREE.Bone;
    ["ORG-thumb01R"]: THREE.Bone;
    ["ORG-thumb02R"]: THREE.Bone;
    ["ORG-thumb03R"]: THREE.Bone;
    ["DEF-f_index01R"]: THREE.Bone;
    ["DEF-f_index02R"]: THREE.Bone;
    ["DEF-f_index03R"]: THREE.Bone;
    f_index01_masterR: THREE.Bone;
    ["DEF-thumb01R"]: THREE.Bone;
    ["DEF-thumb02R"]: THREE.Bone;
    ["DEF-thumb03R"]: THREE.Bone;
    thumb01_masterR: THREE.Bone;
    ["DEF-palm01R"]: THREE.Bone;
    ["MCH-f_index01_drvR"]: THREE.Bone;
    f_index01R_1: THREE.Bone;
    ["MCH-f_index02_drvR"]: THREE.Bone;
    f_index02R_1: THREE.Bone;
    ["MCH-f_index03_drvR"]: THREE.Bone;
    f_index03R_1: THREE.Bone;
    f_index01R001: THREE.Bone;
    ["MCH-f_index03R"]: THREE.Bone;
    ["MCH-f_index02R"]: THREE.Bone;
    ["MCH-f_index01R"]: THREE.Bone;
    ["MCH-thumb01_drvR"]: THREE.Bone;
    thumb01R_1: THREE.Bone;
    ["MCH-thumb02_drvR"]: THREE.Bone;
    thumb02R_1: THREE.Bone;
    ["MCH-thumb03_drvR"]: THREE.Bone;
    thumb03R_1: THREE.Bone;
    thumb01R001: THREE.Bone;
    ["MCH-thumb03R"]: THREE.Bone;
    ["MCH-thumb02R"]: THREE.Bone;
    ["MCH-thumb01R"]: THREE.Bone;
    ["ORG-palm02R"]: THREE.Bone;
    ["ORG-f_middle01R"]: THREE.Bone;
    ["ORG-f_middle02R"]: THREE.Bone;
    ["ORG-f_middle03R"]: THREE.Bone;
    ["DEF-f_middle01R"]: THREE.Bone;
    ["DEF-f_middle02R"]: THREE.Bone;
    ["DEF-f_middle03R"]: THREE.Bone;
    f_middle01_masterR: THREE.Bone;
    ["DEF-palm02R"]: THREE.Bone;
    ["MCH-f_middle01_drvR"]: THREE.Bone;
    f_middle01R_1: THREE.Bone;
    ["MCH-f_middle02_drvR"]: THREE.Bone;
    f_middle02R_1: THREE.Bone;
    ["MCH-f_middle03_drvR"]: THREE.Bone;
    f_middle03R_1: THREE.Bone;
    f_middle01R001: THREE.Bone;
    ["MCH-f_middle03R"]: THREE.Bone;
    ["MCH-f_middle02R"]: THREE.Bone;
    ["MCH-f_middle01R"]: THREE.Bone;
    ["ORG-palm03R"]: THREE.Bone;
    ["ORG-f_ring01R"]: THREE.Bone;
    ["ORG-f_ring02R"]: THREE.Bone;
    ["ORG-f_ring03R"]: THREE.Bone;
    ["DEF-f_ring01R"]: THREE.Bone;
    ["DEF-f_ring02R"]: THREE.Bone;
    ["DEF-f_ring03R"]: THREE.Bone;
    f_ring01_masterR: THREE.Bone;
    ["DEF-palm03R"]: THREE.Bone;
    ["MCH-f_ring01_drvR"]: THREE.Bone;
    f_ring01R_1: THREE.Bone;
    ["MCH-f_ring02_drvR"]: THREE.Bone;
    f_ring02R_1: THREE.Bone;
    ["MCH-f_ring03_drvR"]: THREE.Bone;
    f_ring03R_1: THREE.Bone;
    f_ring01R001: THREE.Bone;
    ["MCH-f_ring03R"]: THREE.Bone;
    ["MCH-f_ring02R"]: THREE.Bone;
    ["MCH-f_ring01R"]: THREE.Bone;
    ["ORG-palm04R"]: THREE.Bone;
    ["ORG-f_pinky01R"]: THREE.Bone;
    ["ORG-f_pinky02R"]: THREE.Bone;
    ["ORG-f_pinky03R"]: THREE.Bone;
    ["DEF-f_pinky01R"]: THREE.Bone;
    ["DEF-f_pinky02R"]: THREE.Bone;
    ["DEF-f_pinky03R"]: THREE.Bone;
    f_pinky01_masterR: THREE.Bone;
    ["DEF-palm04R"]: THREE.Bone;
    ["MCH-f_pinky01_drvR"]: THREE.Bone;
    f_pinky01R_1: THREE.Bone;
    ["MCH-f_pinky02_drvR"]: THREE.Bone;
    f_pinky02R_1: THREE.Bone;
    ["MCH-f_pinky03_drvR"]: THREE.Bone;
    f_pinky03R_1: THREE.Bone;
    f_pinky01R001: THREE.Bone;
    ["MCH-f_pinky03R"]: THREE.Bone;
    ["MCH-f_pinky02R"]: THREE.Bone;
    ["MCH-f_pinky01R"]: THREE.Bone;
    palmR: THREE.Bone;
    ["ORG-breastL"]: THREE.Bone;
    ["DEF-breastL"]: THREE.Bone;
    ["ORG-breastR"]: THREE.Bone;
    ["DEF-breastR"]: THREE.Bone;
    breastL_1: THREE.Bone;
    breastR_1: THREE.Bone;
    shoulderL_1: THREE.Bone;
    shoulderR_1: THREE.Bone;
    ["MCH-WGT-chest"]: THREE.Bone;
    hand_ikL: THREE.Bone;
    ["MCH-upper_arm_ik_targetL"]: THREE.Bone;
    upper_arm_ik_targetL: THREE.Bone;
    hand_ikR: THREE.Bone;
    ["MCH-upper_arm_ik_targetR"]: THREE.Bone;
    upper_arm_ik_targetR: THREE.Bone;
    eye_common: THREE.Bone;
    eyeL_1: THREE.Bone;
    eyeR_1: THREE.Bone;
    foot_ikL: THREE.Bone;
    foot_spin_ikL: THREE.Bone;
    foot_heel_ikL: THREE.Bone;
    ["MCH-heel02_rock2L"]: THREE.Bone;
    ["MCH-heel02_rock1L"]: THREE.Bone;
    ["MCH-heel02_roll2L"]: THREE.Bone;
    ["MCH-heel02_roll1L"]: THREE.Bone;
    ["MCH-foot_rollL"]: THREE.Bone;
    ["MCH-thigh_ik_targetL"]: THREE.Bone;
    ["MCH-toe_ik_parentL"]: THREE.Bone;
    toe_ikL: THREE.Bone;
    thigh_ik_targetL: THREE.Bone;
    foot_ikR: THREE.Bone;
    foot_spin_ikR: THREE.Bone;
    foot_heel_ikR: THREE.Bone;
    ["MCH-heel02_rock2R"]: THREE.Bone;
    ["MCH-heel02_rock1R"]: THREE.Bone;
    ["MCH-heel02_roll2R"]: THREE.Bone;
    ["MCH-heel02_roll1R"]: THREE.Bone;
    ["MCH-foot_rollR"]: THREE.Bone;
    ["MCH-thigh_ik_targetR"]: THREE.Bone;
    ["MCH-toe_ik_parentR"]: THREE.Bone;
    toe_ikR: THREE.Bone;
    thigh_ik_targetR: THREE.Bone;
    ["MCH-lip_offsetBL001"]: THREE.Bone;
    lipBL001_1: THREE.Bone;
    ["MCH-lip_offsetBR001"]: THREE.Bone;
    lipBR001_1: THREE.Bone;
    ["MCH-lip_offsetTL001"]: THREE.Bone;
    lipTL001_1: THREE.Bone;
    ["MCH-lip_offsetTR001"]: THREE.Bone;
    lipTR001_1: THREE.Bone;
  };
  materials: {
    Glasses: THREE.MeshPhysicalMaterial;
    ["eye."]: THREE.MeshPhysicalMaterial;
    head: THREE.MeshPhysicalMaterial;
    HairTop: THREE.MeshPhysicalMaterial;
    Beard: THREE.MeshPhysicalMaterial;
    Hair: THREE.MeshPhysicalMaterial;
  };
  animations: GLTFActions[];
};

type ActionName = "Idle" | "Sleeping" | "Smile";

interface GLTFActions extends THREE.AnimationClip {
  name: ActionName;
}
