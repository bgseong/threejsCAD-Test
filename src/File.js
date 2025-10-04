import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { saveAs } from 'file-saver'; // npm install file-saver
import { meshUseStore } from './stores/meshStore';
import { threeUseStore } from './stores/threeStore';

export default function createModelLoader() {
  const loader = new GLTFLoader();
  let currentModel = null;

  // 모델 로드
  async function load(fileOrUrl) {
    return new Promise((resolve, reject) => {
      const url = typeof fileOrUrl === "string"
        ? fileOrUrl
        : URL.createObjectURL(fileOrUrl);

      loader.load(
        url,
        (gltf) => {
          // 기존 모델 제거
          if (currentModel) {
            threeUseStore.getState().scene.remove(currentModel);
            currentModel.traverse((child) => {
              if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
              }
            });
          }

          currentModel = gltf.scene;
          threeUseStore.getState().scene.add(currentModel);

          // 중앙 정렬 + 스케일 맞춤
          centerAndScale(currentModel);

          console.log("✅ 모델 로드 완료:", fileOrUrl);

          // meshStore에 추가
          currentModel.traverse((child) => {
            if (child.isMesh) {
              meshUseStore.getState().addMesh(child);
            }
          });

          console.table(meshUseStore.getState().meshs);

          resolve(currentModel);
        },
        (xhr) => {
          console.log(`📦 ${(xhr.loaded / xhr.total * 100).toFixed(1)}% 로딩중`);
        },
        (err) => {
          console.error("❌ 모델 로드 실패:", err);
          reject(err);
        }
      );
    });
  }

  // 모델 중앙정렬 + 스케일
  function centerAndScale(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center); // 중심 원점 이동
    const maxAxis = Math.max(size.x, size.y, size.z);
    model.scale.multiplyScalar(1.0 / maxAxis); // 스케일 정규화
  }

  // GLB 파일로 저장
function saveGLB(filename = "model.glb") {
  if (!currentModel) return console.warn("저장할 모델이 없습니다.");

  const modifiedMeshes = [];

  // 1️⃣ emissive 색상 초기화 (currentHex 기준)
  currentModel.traverse((child) => {
    if (child.isMesh && child.material && child.material.emissive) {
      modifiedMeshes.push({
        mesh: child,
        emissiveHex: child.material.emissive.getHex() // 저장 후 복원용
      });
      child.material.emissive.setHex(child.currentHex ?? 0x000000); // 저장용 초기화
    }
  });

  // 2️⃣ GLB 저장
  const exporter = new GLTFExporter();
  exporter.parse(
    currentModel,
    (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: 'application/octet-stream' })
        : new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });

      saveAs(blob, filename);

      // 3️⃣ 원래 화면 상태로 복원
      modifiedMeshes.forEach(({ mesh, emissiveHex }) => {
        mesh.material.emissive.setHex(emissiveHex);
      });
    },
    { binary: true } // GLB 저장
  );
}


  return {
    load,
    saveGLB,
  };
}
