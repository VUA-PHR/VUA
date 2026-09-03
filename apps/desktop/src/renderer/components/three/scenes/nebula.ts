/**
 * 星云云幕(S-VFX-1):全应用 WebGL 背景场景。
 *
 * 构成:双深度层粒子星尘(软圆点纹理,顶点色白→紫随机)+ 紫/橙星云雾精灵
 * (加色混合大光斑);相机随指针视差漂移并叠加自主慢漂。
 * 辖区联动:监听壳层 data-module,模型生产(橙)时雾色向橙平滑偏移。
 *
 * 纹理全部离屏 canvas 生成,零外部资产;装饰层,aria-hidden,不读业务状态。
 * 颜色常量与 tokens.css 品牌色同步(#a78bfa / #ff7a45 / #f5f3ff)。
 */
import * as THREE from "three";
import type { SceneFactory } from "../SceneCanvas.tsx";
import { smoothDamp } from "../scene-mode.ts";
import { makeRadialTexture } from "../textures.ts";

const PURPLE = new THREE.Color("#a78bfa");
const ORANGE = new THREE.Color("#ff7a45");
const STAR_TINT = new THREE.Color("#f5f3ff");

/* 密度/景深常量:调参只动这里 */
const FAR_STAR_COUNT = 900;
const NEAR_STAR_COUNT = 320;
const FOG_COUNT = 7;
const CAMERA_Z = 7;

interface StarSpread {
  x: number;
  y: number;
  zMin: number;
  zMax: number;
}

function buildStarLayer(
  count: number,
  spread: StarSpread,
  size: number,
  opacity: number,
  texture: THREE.Texture,
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() * 2 - 1) * spread.x;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * spread.y;
    positions[i * 3 + 2] =
      spread.zMin + Math.random() * (spread.zMax - spread.zMin);
    color.copy(STAR_TINT).lerp(PURPLE, Math.random() * 0.65);
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
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

interface FogSprite {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  baseX: number;
  baseY: number;
  phase: number;
  /** 辖区联动权重:0 = 恒紫,1 = 生产辖区全橙 */
  orangeWeight: number;
}

export const nebulaScene: SceneFactory = ({ scene, camera, renderer }) => {
  const dotTexture = makeRadialTexture(64, 0.25);
  const fogTexture = makeRadialTexture(256, 0.1);

  const stars = new THREE.Group();
  const farStars = buildStarLayer(
    FAR_STAR_COUNT,
    { x: 14, y: 8, zMin: -10, zMax: -2 },
    0.05,
    0.75,
    dotTexture,
  );
  const nearStars = buildStarLayer(
    NEAR_STAR_COUNT,
    { x: 12, y: 7, zMin: -2, zMax: 3 },
    0.1,
    0.9,
    dotTexture,
  );
  stars.add(farStars, nearStars);
  scene.add(stars);

  const fogSprites: FogSprite[] = [];
  for (let i = 0; i < FOG_COUNT; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      transparent: true,
      opacity: 0.06 + Math.random() * 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(material);
    const scale = 7 + Math.random() * 7;
    sprite.scale.set(scale, scale, 1);
    const baseX = (Math.random() * 2 - 1) * 10;
    const baseY = (Math.random() * 2 - 1) * 5;
    sprite.position.set(baseX, baseY, -4 - Math.random() * 4);
    scene.add(sprite);
    fogSprites.push({
      sprite,
      material,
      baseX,
      baseY,
      phase: Math.random() * Math.PI * 2,
      orangeWeight: i % 3 === 2 ? 1 : 0.25,
    });
  }

  /* 辖区联动:壳层 data-module="production" 时雾色向橙偏移 */
  const moduleHost = renderer.domElement.closest("[data-module]");
  let tintTarget = moduleHost?.getAttribute("data-module") === "production" ? 1 : 0;
  let tint = tintTarget;
  const moduleObserver = new MutationObserver(() => {
    tintTarget = moduleHost?.getAttribute("data-module") === "production" ? 1 : 0;
  });
  if (moduleHost) {
    moduleObserver.observe(moduleHost, {
      attributes: true,
      attributeFilter: ["data-module"],
    });
  }

  camera.position.set(0, 0, CAMERA_Z);

  const scratchColor = new THREE.Color();

  return {
    update(dt, elapsed, pointer) {
      camera.position.x = pointer.x * 0.9 + Math.sin(elapsed * 0.03) * 0.4;
      camera.position.y = pointer.y * 0.5 + Math.cos(elapsed * 0.021) * 0.25;
      camera.lookAt(0, 0, 0);
      stars.rotation.y = elapsed * 0.004;

      tint = smoothDamp(tint, tintTarget, 2, dt);
      for (const fog of fogSprites) {
        scratchColor.copy(PURPLE).lerp(ORANGE, tint * fog.orangeWeight);
        fog.material.color.copy(scratchColor);
        fog.sprite.position.x =
          fog.baseX + Math.sin(elapsed * 0.05 + fog.phase) * 0.6;
        fog.sprite.position.y =
          fog.baseY + Math.cos(elapsed * 0.04 + fog.phase) * 0.4;
      }
    },
    dispose() {
      moduleObserver.disconnect();
      for (const fog of fogSprites) fog.material.dispose();
      for (const layer of [farStars, nearStars]) {
        layer.geometry.dispose();
        (layer.material as THREE.PointsMaterial).dispose();
      }
      dotTexture.dispose();
      fogTexture.dispose();
    },
  };
};
