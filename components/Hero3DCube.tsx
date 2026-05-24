'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// --- Error Boundary for WebGL (Safety) ---
// This ensures that if the 3D crashes (Context Lost), the site doesn't break.
// It renders NOTHING (null) if there is an error, avoiding the Red Box.
class WebGLFallback extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("WebGL 3D Cube Error:", error);
    }

    render() {
        if (this.state.hasError) {
            // Return null to hide the component completely on error
            return null;
        }
        return this.props.children;
    }
}

// --- Configuration ---
const CUBE_SIZE = 0.95;
const SPACING = 1.02;
const STICKER_SIZE = 0.85;
const STICKER_OFFSET = 0.481;
const ROUNDNESS = 0.08;
const MOVE_SPEED = 2.5;
const WAIT_TIME = 1500;

// --- Colors ---
const COLORS = [
    '#2563EB', // Blue
    '#16A34A', // Green
    '#ffffff', // White
    '#3B82F6', // Light Blue
    '#0F172A', // Black/Slate
    '#F59E0B', // Orange
];

// Black plastic material for the cube core
const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: '#111111',
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.5,
});

/**
 * Sticker Mesh (Individual colored face)
 */
const Sticker = ({ color, position, rotation }: { color: string, position: [number, number, number], rotation: [number, number, number] }) => (
    <mesh position={position} rotation={rotation}>
        <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, 0.02]} />
        <meshPhysicalMaterial
            color={color}
            roughness={0.1}
            metalness={0.0}
            clearcoat={1.0}
            polygonOffset
            polygonOffsetFactor={-1}
        />
    </mesh>
);

/**
 * Single Cube Mesh (Group of Core + Stickers)
 */
const CubeMesh = ({ position, colors, meshRef }: { position: [number, number, number], colors: string[], meshRef: React.RefObject<THREE.Group> }) => {
    return (
        <group ref={meshRef} position={position}>
            <RoundedBox args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} radius={ROUNDNESS} smoothness={4}>
                <primitive object={coreMaterial} />
            </RoundedBox>

            {/* The 6 Colored Faces (Stickers) */}
            <Sticker color={colors[0]} position={[STICKER_OFFSET, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
            <Sticker color={colors[1]} position={[-STICKER_OFFSET, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
            <Sticker color={colors[2]} position={[0, STICKER_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]} />
            <Sticker color={colors[3]} position={[0, -STICKER_OFFSET, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <Sticker color={colors[4]} position={[0, 0, STICKER_OFFSET]} rotation={[0, 0, 0]} />
            <Sticker color={colors[5]} position={[0, 0, -STICKER_OFFSET]} rotation={[0, Math.PI, 0]} />
        </group>
    );
};

/**
 * The Self-Playing Rubik's Cube
 */
const RubiksCube = () => {
    const groupRef = useRef<THREE.Group>(null);
    const cubeRefs = useMemo(() => Array.from({ length: 27 }).map(() => React.createRef<THREE.Group>()), []);

    // Initialize Cube Data
    const cubeData = useMemo(() => {
        const data = [];
        let i = 0;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const faces = Array(6).fill(null).map(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
                    data.push({
                        initialPos: new THREE.Vector3(x * SPACING, y * SPACING, z * SPACING),
                        colors: faces,
                        id: i++
                    });
                }
            }
        }
        return data;
    }, []);

    // Animation State
    const state = useRef({
        isAnimating: false,
        moveAxis: 'x' as 'x' | 'y' | 'z',
        moveSlice: 0,
        rotateProgress: 0,
        targetRotationAngle: Math.PI / 2,
        lastMoveTime: 0,
        cubesInSlice: [] as number[],
        rotationDirection: 1,
    });

    const applyRotationToSlice = (indices: number[], axis: 'x' | 'y' | 'z', angle: number, snap: boolean) => {
        const rotMatrix = new THREE.Matrix4();
        if (axis === 'x') rotMatrix.makeRotationX(angle);
        if (axis === 'y') rotMatrix.makeRotationY(angle);
        if (axis === 'z') rotMatrix.makeRotationZ(angle);

        indices.forEach(idx => {
            const mesh = cubeRefs[idx].current;
            if (mesh) {
                if (snap) {
                    const remainingAngle = state.current.targetRotationAngle * state.current.rotationDirection - state.current.rotateProgress * state.current.rotationDirection;
                    const finalRotMatrix = new THREE.Matrix4();
                    if (axis === 'x') finalRotMatrix.makeRotationX(remainingAngle);
                    if (axis === 'y') finalRotMatrix.makeRotationY(remainingAngle);
                    if (axis === 'z') finalRotMatrix.makeRotationZ(remainingAngle);
                    mesh.applyMatrix4(finalRotMatrix);

                    // Snap positions
                    mesh.position.set(
                        Math.round(mesh.position.x / SPACING) * SPACING,
                        Math.round(mesh.position.y / SPACING) * SPACING,
                        Math.round(mesh.position.z / SPACING) * SPACING
                    );

                    // Snap rotations
                    const snapTo90 = (rad: number) => Math.round(rad / (Math.PI / 2)) * (Math.PI / 2);
                    mesh.rotation.set(
                        snapTo90(mesh.rotation.x),
                        snapTo90(mesh.rotation.y),
                        snapTo90(mesh.rotation.z)
                    );
                } else {
                    mesh.applyMatrix4(rotMatrix);
                }
            }
        });
    };

    useFrame((rootState, delta) => {
        if (!groupRef.current) return;
        const s = state.current;
        const now = performance.now();

        // Global Tumble
        groupRef.current.rotation.y += delta * 0.15;
        groupRef.current.rotation.x += delta * 0.1;
        groupRef.current.rotation.z = Math.sin(now * 0.0005) * 0.1;

        // Rubik's Mechanic
        if (!s.isAnimating) {
            if (now - s.lastMoveTime > WAIT_TIME) {
                s.isAnimating = true;
                s.rotateProgress = 0;
                const axes = ['x', 'y', 'z'] as const;
                s.moveAxis = axes[Math.floor(Math.random() * axes.length)];
                s.moveSlice = Math.floor(Math.random() * 3) - 1;
                s.rotationDirection = Math.random() > 0.5 ? 1 : -1;
                s.cubesInSlice = [];
                cubeRefs.forEach((ref, index) => {
                    if (ref.current) {
                        const localPos = ref.current.position;
                        const val = s.moveAxis === 'x' ? localPos.x : (s.moveAxis === 'y' ? localPos.y : localPos.z);
                        if (Math.abs(val - s.moveSlice * SPACING) < 0.1) s.cubesInSlice.push(index);
                    }
                });
            }
        } else {
            const rotationStep = delta * MOVE_SPEED;
            s.rotateProgress += rotationStep;
            if (s.rotateProgress >= s.targetRotationAngle) {
                applyRotationToSlice(s.cubesInSlice, s.moveAxis, 0, true);
                s.isAnimating = false;
                s.lastMoveTime = now;
            } else {
                applyRotationToSlice(s.cubesInSlice, s.moveAxis, rotationStep * s.rotationDirection, false);
            }
        }
    });

    return (
        <group ref={groupRef} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
            {cubeData.map((d, i) => (
                <CubeMesh
                    key={i}
                    meshRef={cubeRefs[i]}
                    position={[d.initialPos.x, d.initialPos.y, d.initialPos.z]}
                    colors={d.colors}
                />
            ))}
        </group>
    );
};

// --- Responsive Camera Controller ---
const ResponsiveCamera = () => {
    const { camera } = useThree();
    React.useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) camera.position.set(0, 0, 9.0);
            else if (width < 1024) camera.position.set(0, 0, 7.5);
            else camera.position.set(0, 0, 6.5);
            camera.updateProjectionMatrix();
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [camera]);
    return null;
}

export default function Hero3DCube() {
    return (
        <div className="w-full h-full relative z-10 fade-in-up">
            <WebGLFallback>
                <Canvas dpr={[1, 2]} shadows gl={{ preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: true }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
                    <ResponsiveCamera />

                    <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate={true} autoRotateSpeed={0.5} />

                    <ambientLight intensity={0.4} />
                    <spotLight position={[10, 10, 5]} angle={0.5} penumbra={1} intensity={2} castShadow shadow-bias={-0.0001} />
                    <pointLight position={[-10, -5, -5]} intensity={1} color="#3B82F6" />
                    <pointLight position={[5, -5, 5]} intensity={0.5} color="#16A34A" />

                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
                        <RubiksCube />
                    </Float>

                    <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4.5} />
                    <Environment preset="city" />
                </Canvas>
            </WebGLFallback>
        </div>
    );
}
