import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { useHomeStore } from '../store/useHomeStore';

interface HouseScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  roomLights: Record<string, THREE.PointLight>;
  roomGlows: Record<string, THREE.Mesh>;
  roomFloors: Record<string, THREE.Mesh>;
  animationId: number;
}

export default function House3D() {
  const sceneRef = useRef<HouseScene | null>(null);
  const rooms = useHomeStore((s) => s.rooms);
  const motionDetected = useHomeStore((s) => s.motionDetected);

  const onContextCreate = useCallback((gl: WebGLRenderingContext) => {
    // ── Renderer ──
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0); // transparent background
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ── Scene ──
    const scene = new THREE.Scene();

    // ── Camera (isometric orthographic) ──
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const frustum = 4;
    const camera = new THREE.OrthographicCamera(
      -frustum * aspect,
      frustum * aspect,
      frustum,
      -frustum,
      0.1,
      100
    );
    // Isometric angle: rotate 45° around Y, then tilt down ~35.264°
    const distance = 10;
    const isoAngle = Math.PI / 4; // 45°
    const isoTilt = Math.atan(1 / Math.sqrt(2)); // ~35.264°
    camera.position.set(
      distance * Math.cos(isoTilt) * Math.sin(isoAngle),
      distance * Math.sin(isoTilt),
      distance * Math.cos(isoTilt) * Math.cos(isoAngle)
    );
    camera.lookAt(0, 0.5, 0);
    camera.updateProjectionMatrix();

    // ── Ambient light ──
    const ambient = new THREE.AmbientLight(0x404060, 0.3);
    scene.add(ambient);

    // ── Directional light (sun) ──
    const sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.position.set(5, 8, 5);
    sun.castShadow = true;
    scene.add(sun);

    // ── Ground plane ──
    const groundGeo = new THREE.PlaneGeometry(12, 12);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a14,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── House dimensions ──
    const W = 3.2; // width (x)
    const D = 3.2; // depth (z)
    const H = 2.0; // wall height (y)
    const wallThickness = 0.08;

    // ── Floor ──
    const floorGeo = new THREE.BoxGeometry(W, 0.05, D);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14141e,
      roughness: 0.7,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.025;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Wall material ──
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    // ── Back wall ──
    const backWallGeo = new THREE.BoxGeometry(W, H, wallThickness);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, H / 2, -D / 2);
    backWall.castShadow = true;
    scene.add(backWall);

    // ── Left wall ──
    const leftWallGeo = new THREE.BoxGeometry(wallThickness, H, D);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.castShadow = true;
    scene.add(leftWall);

    // ── Right wall (shorter, so we can see inside) ──
    const rightWallGeo = new THREE.BoxGeometry(wallThickness, H * 0.6, D);
    const rightWallMat = wallMat.clone();
    rightWallMat.opacity = 0.5;
    const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
    rightWall.position.set(W / 2, (H * 0.6) / 2, 0);
    scene.add(rightWall);

    // ── Front wall (partial — leaves a door opening) ──
    const frontWallLeftGeo = new THREE.BoxGeometry(W * 0.35, H, wallThickness);
    const frontWallLeft = new THREE.Mesh(frontWallLeftGeo, wallMat);
    frontWallLeft.position.set(-W * 0.325, H / 2, D / 2);
    scene.add(frontWallLeft);

    const frontWallRightGeo = new THREE.BoxGeometry(W * 0.35, H, wallThickness);
    const frontWallRight = new THREE.Mesh(frontWallRightGeo, wallMat);
    frontWallRight.position.set(W * 0.325, H / 2, D / 2);
    scene.add(frontWallRight);

    // ── Door frame (top) ──
    const doorTopGeo = new THREE.BoxGeometry(W * 0.3, wallThickness, wallThickness);
    const doorTop = new THREE.Mesh(doorTopGeo, wallMat);
    doorTop.position.set(0, H * 0.85, D / 2);
    scene.add(doorTop);

    // ── Roof ──
    const roofGeo = new THREE.ConeGeometry(2.6, 1.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x252540,
      roughness: 0.4,
      metalness: 0.2,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = H + 0.6;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);

    // ── Room dividers (internal walls) ──
    const dividerMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e32,
      roughness: 0.6,
      transparent: true,
      opacity: 0.6,
    });

    // Divider between living room and bedroom (vertical, at x=0)
    const dividerGeo = new THREE.BoxGeometry(wallThickness, H * 0.7, D * 0.7);
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.position.set(0.2, H * 0.35, -0.2);
    scene.add(divider);

    // Divider between rooms and porch (horizontal, at z=0.8)
    const porchDividerGeo = new THREE.BoxGeometry(W * 0.85, H * 0.4, wallThickness);
    const porchDivider = new THREE.Mesh(porchDividerGeo, dividerMat);
    porchDivider.position.set(0, H * 0.2, 0.8);
    scene.add(porchDivider);

    // ── Room floor glow planes ──
    const makeGlowPlane = (
      width: number,
      depth: number,
      x: number,
      z: number,
      color: number
    ) => {
      const geo = new THREE.PlaneGeometry(width, depth);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.06, z);
      scene.add(mesh);
      return mesh;
    };

    const livingGlow = makeGlowPlane(1.4, 1.8, -0.7, -0.4, 0x3b82f6);
    const bedroomGlow = makeGlowPlane(1.2, 1.8, 1.0, -0.4, 0xfbbf24);
    const porchGlow = makeGlowPlane(2.6, 0.8, 0, 1.2, 0x22c55e);

    // ── Room point lights ──
    const makeRoomLight = (x: number, y: number, z: number, color: number) => {
      const light = new THREE.PointLight(color, 0, 4, 2);
      light.position.set(x, y, z);
      light.castShadow = false; // performance
      scene.add(light);
      return light;
    };

    const livingLight = makeRoomLight(-0.7, 1.2, -0.4, 0x3b82f6);
    const bedroomLight = makeRoomLight(1.0, 1.2, -0.4, 0xfbbf24);
    const porchLight = makeRoomLight(0, 0.8, 1.2, 0x22c55e);

    // ── Light fixture meshes (small spheres at light positions) ──
    const makeFixture = (x: number, y: number, z: number, color: number) => {
      const geo = new THREE.SphereGeometry(0.06, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    const livingFixture = makeFixture(-0.7, 1.5, -0.4, 0x3b82f6);
    const bedroomFixture = makeFixture(1.0, 1.5, -0.4, 0xfbbf24);
    const porchFixture = makeFixture(0, 0.6, 1.2, 0x22c55e);

    // ── Small furniture hints ──
    // Sofa in living room
    const sofaGeo = new THREE.BoxGeometry(0.8, 0.25, 0.35);
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x2a2a40, roughness: 0.8 });
    const sofa = new THREE.Mesh(sofaGeo, sofaMat);
    sofa.position.set(-0.7, 0.15, -1.0);
    scene.add(sofa);

    // Bed in bedroom
    const bedGeo = new THREE.BoxGeometry(0.7, 0.2, 0.9);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x2a2a40, roughness: 0.8 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(1.0, 0.12, -0.8);
    scene.add(bed);

    // Small table on porch
    const tableGeo = new THREE.BoxGeometry(0.3, 0.25, 0.3);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a40, roughness: 0.8 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.15, 1.2);
    scene.add(table);

    // ── Store scene references ──
    sceneRef.current = {
      renderer,
      scene,
      camera,
      roomLights: {
        living: livingLight,
        bedroom: bedroomLight,
        porch: porchLight,
      },
      roomGlows: {
        living: livingGlow,
        bedroom: bedroomGlow,
        porch: porchGlow,
      },
      roomFloors: {
        living: livingFixture,
        bedroom: bedroomFixture,
        porch: porchFixture,
      },
      animationId: 0,
    };

    // ── Render loop ──
    const clock = new THREE.Clock();

    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle camera orbit
      const orbitSpeed = 0.05;
      const currentAngle = isoAngle + elapsed * orbitSpeed;
      camera.position.x = distance * Math.cos(isoTilt) * Math.sin(currentAngle);
      camera.position.z = distance * Math.cos(isoTilt) * Math.cos(currentAngle);
      camera.lookAt(0, 0.5, 0);

      // Pulse fixtures slightly
      ['living', 'bedroom', 'porch'].forEach((id) => {
        const fixture = sceneRef.current!.roomFloors[id];
        if (fixture.material.opacity > 0) {
          const scale = 1 + Math.sin(elapsed * 3) * 0.1;
          fixture.scale.setScalar(scale);
        }
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  }, []);

  // ── Update lights when room state changes ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const targetIntensity = (isOn: boolean) => (isOn ? 2.5 : 0);
    const targetGlow = (isOn: boolean) => (isOn ? 0.25 : 0);
    const targetFixture = (isOn: boolean) => (isOn ? 0.8 : 0);

    (['living', 'bedroom', 'porch'] as const).forEach((roomId) => {
      const isOn = rooms[roomId].isOn;
      const light = scene.roomLights[roomId];
      const glow = scene.roomGlows[roomId];
      const fixture = scene.roomFloors[roomId];

      if (light) light.intensity = THREE.MathUtils.lerp(light.intensity, targetIntensity(isOn), 0.1);
      if (glow) glow.material.opacity = THREE.MathUtils.lerp(glow.material.opacity, targetGlow(isOn), 0.08);
      if (fixture) fixture.material.opacity = THREE.MathUtils.lerp(fixture.material.opacity, targetFixture(isOn), 0.1);
    });
  }, [rooms]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  glView: {
    flex: 1,
  },
});
