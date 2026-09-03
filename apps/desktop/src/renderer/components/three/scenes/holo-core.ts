/**
 * 全息核心(S-VFX-2):指挥台首页中央 Three.js 场景。
 *
 * 构成:二十面体线框外骨架 + fresnel 内发光核(紫↔橙缓慢色相漂移)+
 * 双环环绕粒子(异向对转);整体慢速自转 + 指针倾斜联动。
 * 装饰层,零外部资产;颜色常量与 tokens.css 品牌色同步。
 */
import * as THREE from "three";
import type { SceneFactory } from "../SceneCanvas.tsx";
import { smoothDamp } from "../scene-mode.ts";
import { makeRadialTexture } from "../textures.ts";

const PURPLE = new THREE.Color("#a78bfa");
const ORANGE = new THREE.Color("#ff7a45");
const CORE_DEEP = new THREE.Color("#241f3d");

const FRESNEL_VERTEX = `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRESNEL_FRAGMENT = `
uniform vec3 uInner;
uniform vec3 uRimA;
uniform vec3 uRimB;
uniform float uMix;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
  vec3 rim = mix(uRimA, uRimB, uMix);
  vec3 color = mix(uInner, rim, fresnel);
  gl_FragColor = vec4(color, 0.12 + fresnel * 0.85);
}
`;

/** 环绕粒子环:circle 布局 + 轻微抖动,顶点色紫→橙沿角度渐变 */
function buildOrbitRing(
  radius: number,
  count: number,
  size: number,
  tilt: number,
  texture: THREE.Texture,
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius + (Math.random() * 2 - 1) * 0.08;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * 0.05;
    positions[i * 3 + 2] = Math.sin(angle) * r;
    color.copy(PURPLE).lerp(ORANGE, i / count);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const ring = new THREE.Points(geometry, material);
  ring.rotation.x = tilt;
  return ring;
}

export const holoCoreScene: SceneFactory = ({ scene, camera }) => {
  camera.position.set(0, 0, 4.4);

  const dotTexture = makeRadialTexture(64, 0.25);
  const group = new THREE.Group();
  scene.add(group);

  /* 外骨架:二十面体线框 */
  const wireGeometry = new THREE.IcosahedronGeometry(1.5, 1);
  const wireframeGeometry = new THREE.WireframeGeometry(wireGeometry);
  const wire = new THREE.LineSegments(
    wireframeGeometry,
    new THREE.LineBasicMaterial({
      color: PURPLE,
      transparent: true,
      opacity: 0.45,
    }),
  );
  group.add(wire);

  /* 内核:fresnel 发光球,紫↔橙色相漂移 */
  const coreMaterial = new THREE.ShaderMaterial({
    vertexShader: FRESNEL_VERTEX,
    fragmentShader: FRESNEL_FRAGMENT,
    uniforms: {
      uInner: { value: CORE_DEEP },
      uRimA: { value: PURPLE },
      uRimB: { value: ORANGE },
      uMix: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, 3), coreMaterial);
  group.add(core);

  /* 双环:异向对转 */
  const ringA = buildOrbitRing(2.1, 160, 0.05, Math.PI * 0.42, dotTexture);
  const ringB = buildOrbitRing(2.55, 200, 0.04, Math.PI * 0.55, dotTexture);
  scene.add(ringA, ringB);

  return {
    update(dt, elapsed, pointer) {
      group.rotation.y += dt * 0.25;
      group.rotation.x = smoothDamp(group.rotation.x, pointer.y * 0.3, 4, dt);
      group.rotation.z = smoothDamp(group.rotation.z, pointer.x * 0.12, 4, dt);
      ringA.rotation.y += dt * 0.3;
      ringB.rotation.y -= dt * 0.22;
      coreMaterial.uniforms.uMix!.value = 0.5 + 0.5 * Math.sin(elapsed * 0.35);
      const pulse = 1 + 0.03 * Math.sin(elapsed * 1.2);
      core.scale.setScalar(pulse);
    },
    dispose() {
      wireGeometry.dispose();
      wireframeGeometry.dispose();
      (wire.material as THREE.Material).dispose();
      core.geometry.dispose();
      coreMaterial.dispose();
      for (const ring of [ringA, ringB]) {
        ring.geometry.dispose();
        (ring.material as THREE.PointsMaterial).dispose();
      }
      dotTexture.dispose();
    },
  };
};
