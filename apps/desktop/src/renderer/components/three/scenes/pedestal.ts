/**
 * 展台(S-IX-2):出厂页 Three.js 场景。
 *
 * 构成:深色圆柱台座 + 台缘辉光环 + 地面径向光晕 + 抽象"工艺品"
 * (二十面体 fresnel 发光体,悬浮自转)。工艺品随选中项目 health 染色:
 * 健康=AMF 橙,异常=错误红,无选中=中性灰;选中切换时做一次翻转 flourish。
 *
 * 诚实纪律:预览提取未接入,工艺品是示意渲染,不代表真实模型。
 * 装饰层,零外部资产;颜色常量与 tokens.css 品牌色同步。
 */
import * as THREE from "three";
import type { SceneFactory } from "../SceneCanvas.tsx";
import { smoothDamp } from "../scene-mode.ts";
import { makeRadialTexture } from "../textures.ts";

const PURPLE = new THREE.Color("#a78bfa");
const ORANGE = new THREE.Color("#ff7a45");
const ERROR = new THREE.Color("#fb7185");
const NEUTRAL = new THREE.Color("#8b88a3");
const BASE_DARK = new THREE.Color("#151322");
const CRAFT_INNER = new THREE.Color("#241f3d");

/** 展台氛围:由选中项目 health 映射(无选中=中性,健康=橙,异常=红) */
export type PedestalMood = "none" | "healthy" | "attention";

/** 外部控制通道:组件层每次渲染写入,场景 update 读取(避免重建场景) */
export interface PedestalControl {
  mood: PedestalMood;
  /** 选中项切换计数:变化时触发一次 flourish */
  flourishKey: number;
}

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
uniform vec3 uRim;
uniform float uAlpha;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
  vec3 color = mix(uInner, uRim, fresnel);
  gl_FragColor = vec4(color, uAlpha * (0.15 + fresnel * 0.85));
}
`;

function moodColor(mood: PedestalMood): THREE.Color {
  if (mood === "healthy") return ORANGE;
  if (mood === "attention") return ERROR;
  return NEUTRAL;
}

/** 工厂函数带控制通道:SceneCanvas 只在挂载时建场景,mood 经 ref 流入 */
export function createPedestalFactory(control: { current: PedestalControl }): SceneFactory {
  return ({ scene, camera }) => {
    camera.position.set(0, 1.1, 4.6);
    camera.lookAt(0, 0.6, 0);

    const group = new THREE.Group();
    scene.add(group);

    /* 台座:深色圆柱 + 顶面细边 */
    const baseGeometry = new THREE.CylinderGeometry(1.6, 1.75, 0.24, 48);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: BASE_DARK });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);

    const rimGeometry = new THREE.TorusGeometry(1.6, 0.018, 8, 64);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: PURPLE,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.12;
    group.add(rim);

    /* 地面光晕:径向渐变贴片 */
    const glowTexture = makeRadialTexture(128, 0.3);
    const glowGeometry = new THREE.PlaneGeometry(6.4, 6.4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: PURPLE,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.14;
    group.add(glow);

    /* 工艺品:线框骨架 + fresnel 内核(随 mood 染色) */
    const craft = new THREE.Group();
    craft.position.y = 1.05;
    group.add(craft);

    const wireGeometry = new THREE.IcosahedronGeometry(0.92, 1);
    const craftWireframe = new THREE.WireframeGeometry(wireGeometry);
    const craftWire = new THREE.LineSegments(
      craftWireframe,
      new THREE.LineBasicMaterial({ color: NEUTRAL, transparent: true, opacity: 0.4 }),
    );
    craft.add(craftWire);

    const craftMaterial = new THREE.ShaderMaterial({
      vertexShader: FRESNEL_VERTEX,
      fragmentShader: FRESNEL_FRAGMENT,
      uniforms: {
        uInner: { value: CRAFT_INNER },
        uRim: { value: NEUTRAL.clone() },
        uAlpha: { value: 1 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const craftCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 2), craftMaterial);
    craft.add(craftCore);

    /* flourish:flourishKey 变化时注入翻转冲量,指数衰减 */
    let lastFlourishKey = control.current.flourishKey;
    let flourishVelocity = 0;
    /* mood 颜色经平滑趋近,不硬跳 */
    const rimTarget = NEUTRAL.clone();
    const wireTarget = NEUTRAL.clone();

    return {
      update(dt, elapsed, pointer) {
        const { mood, flourishKey } = control.current;
        if (flourishKey !== lastFlourishKey) {
          lastFlourishKey = flourishKey;
          flourishVelocity += 9;
        }
        flourishVelocity = smoothDamp(flourishVelocity, 0, 4, dt);
        rimTarget.copy(moodColor(mood));
        wireTarget.copy(moodColor(mood)).lerp(PURPLE, 0.35);
        (craftMaterial.uniforms.uRim!.value as THREE.Color).lerp(rimTarget, 1 - Math.exp(-5 * dt));
        (craftWire.material as THREE.LineBasicMaterial).color.lerp(wireTarget, 1 - Math.exp(-5 * dt));

        craft.rotation.y += dt * (0.4 + flourishVelocity);
        craft.rotation.x = smoothDamp(craft.rotation.x, pointer.y * 0.25, 4, dt);
        craft.position.y = 1.05 + Math.sin(elapsed * 0.9) * 0.06;
        rimMaterial.opacity = 0.7 + 0.25 * Math.sin(elapsed * 1.4);
        glowMaterial.opacity = 0.24 + 0.06 * Math.sin(elapsed * 0.7);
        group.rotation.y = smoothDamp(group.rotation.y, pointer.x * 0.2, 4, dt);
      },
      dispose() {
        baseGeometry.dispose();
        baseMaterial.dispose();
        rimGeometry.dispose();
        rimMaterial.dispose();
        glowGeometry.dispose();
        glowMaterial.dispose();
        glowTexture.dispose();
        wireGeometry.dispose();
        craftWireframe.dispose();
        (craftWire.material as THREE.Material).dispose();
        craftCore.geometry.dispose();
        craftMaterial.dispose();
      },
    };
  };
}
