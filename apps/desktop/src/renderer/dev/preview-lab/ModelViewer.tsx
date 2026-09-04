import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SceneCanvas, type SceneFactory } from "../../components/three/SceneCanvas.tsx";

/**
 * 素材级模型查看器(预览实验室 T1,DEV):FBX 走 FBXLoader、VRM/glTF 走
 * GLTFLoader;Unity 自定义 shader 以既有材质 + 主贴图近似,UI 有明示文案。
 * 贴图绑定:textures 键按"网格名 材质名"小写包含匹配(长键优先),
 * default 为兜底;FBX 内嵌贴图(已有 map)不覆盖。
 */

export interface DemoAssetEntry {
  id: string;
  kind: "fbx" | "vrm";
  label: string;
  path: string;
  textures?: Record<string, string>;
}

export type ModelLoadStatus = "loading" | "ready" | "failed";

/** 统一缩放到目标高度、脚底落原点,便于不同尺度素材共用同一取景 */
function normalizeIntoView(obj: THREE.Object3D, targetHeight: number): void {
  const initial = new THREE.Box3().setFromObject(obj);
  const size = initial.getSize(new THREE.Vector3());
  if (size.y > 1e-6) obj.scale.setScalar(targetHeight / size.y);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
}

function applyTextureHeuristics(
  root: THREE.Object3D,
  textures: Record<string, string> | undefined,
  urlFor: (rel: string) => string,
): void {
  if (!textures) return;
  const entries = Object.entries(textures)
    .filter(([key]) => key !== "default")
    .sort((a, b) => b[0].length - a[0].length);
  const fallback = textures.default;
  const loader = new THREE.TextureLoader();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const patched = materials.map((material) => {
      const withMap = material as THREE.MeshPhongMaterial;
      if (withMap.map) return material;
      const haystack = `${mesh.name} ${material.name}`.toLowerCase();
      const hit = entries.find(([key]) => haystack.includes(key.toLowerCase()));
      const rel = hit?.[1] ?? fallback;
      if (!rel) return material;
      const texture = loader.load(urlFor(rel));
      texture.colorSpace = THREE.SRGBColorSpace;
      const clone = withMap.clone() as THREE.MeshPhongMaterial;
      clone.map = texture;
      clone.color = new THREE.Color(0xffffff);
      clone.needsUpdate = true;
      return clone;
    });
    mesh.material = Array.isArray(mesh.material) ? patched : patched[0]!;
  });
}

function disposeTree(root: THREE.Object3D): void {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const withMap = material as THREE.MeshPhongMaterial;
      withMap.map?.dispose();
      material.dispose();
    }
  });
}

async function loadAsset(
  asset: DemoAssetEntry,
  urlFor: (rel: string) => string,
): Promise<THREE.Object3D> {
  const response = await fetch(urlFor(asset.path));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  let obj: THREE.Object3D;
  if (asset.kind === "vrm") {
    const gltf = await new GLTFLoader().parseAsync(buffer, "");
    obj = gltf.scene;
  } else {
    obj = new FBXLoader().parse(buffer, "");
    applyTextureHeuristics(obj, asset.textures, urlFor);
  }
  obj.traverse((node) => {
    const skinned = node as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh) skinned.frustumCulled = false;
  });
  normalizeIntoView(obj, 1.6);
  return obj;
}

export function ModelViewer({
  asset,
  urlFor,
  onStatus,
}: {
  asset: DemoAssetEntry;
  urlFor: (rel: string) => string;
  onStatus: (status: ModelLoadStatus) => void;
}) {
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  const factory: SceneFactory = useCallback(
    ({ scene, camera }) => {
      camera.position.set(0, 1.3, 2.9);
      camera.lookAt(0, 0.8, 0);
      scene.add(new THREE.HemisphereLight(0xd8dcff, 0x30283a, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.35);
      key.position.set(2, 3, 2.5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffe8d0, 0.5);
      fill.position.set(-2.5, 1.2, -2);
      scene.add(fill);

      const group = new THREE.Group();
      scene.add(group);
      let disposed = false;
      statusRef.current("loading");
      loadAsset(asset, urlFor)
        .then((obj) => {
          if (disposed) return;
          group.add(obj);
          statusRef.current("ready");
        })
        .catch(() => statusRef.current("failed"));

      let yaw = 0;
      return {
        update(dt) {
          yaw += dt * 0.45;
          group.rotation.y = yaw;
        },
        dispose() {
          disposed = true;
          disposeTree(group);
        },
      };
    },
    [asset, urlFor],
  );

  return (
    <div className="preview-lab__viewer">
      <SceneCanvas factory={factory} className="preview-lab__canvas" />
    </div>
  );
}
