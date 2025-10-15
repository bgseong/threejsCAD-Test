import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { saveAs } from 'file-saver'; // npm install file-saver
import { meshUseStore } from './stores/meshStore';
import { threeUseStore } from './stores/threeStore';
import occtimportjs from 'occt-import-js';

export default function createModelLoader() {
  const loader = new GLTFLoader();
  let currentModel = null;

  const wasmUrl = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.wasm';
  // 모델 로드
  async function load(fileOrUrl) {
    return new Promise((resolve, reject) => {
      const url = typeof fileOrUrl === "string"
      ? fileOrUrl
      : URL.createObjectURL(fileOrUrl);


      // STEP 파일만 처리
      if (typeof fileOrUrl !== 'string') {
        const fileName = fileOrUrl.name.toLowerCase();
        if (fileName.endsWith('.stp') || fileName.endsWith('.step')) {
          // STEP 로딩 처리
          LoadStep(fileOrUrl)
          .then((model) => {
            console.log("STEP 로딩 완료 ✅");
            resolve(model); // 성공 시 model 반환
          })
          .catch((err) => {
            console.error("STEP 로딩 실패 ❌", err);
            reject(err);
          });
        return;
        }
      }

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
          //centerAndScale(currentModel);

          console.log("✅ 모델 로드 완료:", fileOrUrl);

          // meshStore에 추가
          currentModel.traverse((child) => {
            if (child.isMesh) {
              meshUseStore.getState().addMesh(child);
            }
          });
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
  const scene = threeUseStore.getState().scene;
  if (!scene) return console.warn("씬이 없습니다.");

  // 씬에 있는 모든 mesh 수집
  const exportGroup = new THREE.Group();
  const modifiedMeshes = [];

  scene.traverse((child) => {
    if (child.isMesh) {
      // emissive 색상 초기화
      modifiedMeshes.push({
        mesh: child,
        emissiveHex: child.material?.emissive?.getHex() ?? 0x000000
      });
      if (child.material?.emissive) {
        child.material.emissive.setHex(child.currentHex ?? 0x000000);
      }

      exportGroup.add(child.clone(true)); // clone해서 export용 그룹에 추가
    }
  });

  // GLB 저장
  const exporter = new GLTFExporter();
  exporter.parse(
    exportGroup,
    (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: 'application/octet-stream' })
        : new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });

      saveAs(blob, filename);

      // 원래 색상 복원
      modifiedMeshes.forEach(({ mesh, emissiveHex }) => {
        if (mesh.material?.emissive) mesh.material.emissive.setHex(emissiveHex);
      });
    },
    { binary: true } // GLB 저장
  );
}



// STEP 파일 로드 함수
async function LoadStep(fileUrl) {
  const targetObject = new THREE.Object3D();
  console.log(fileUrl);
  targetObject.name = fileUrl.name;
  // occt-import-js 초기화
  const occt = await occtimportjs({
    locateFile: (name) => wasmUrl
  });

// FileReader로 파일 읽기
  const fileBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(fileUrl);
  });

  // STEP 파일 읽기
  const result = occt.ReadStepFile(fileBuffer);
  console.table(result);
  // 결과 메시 처리
  for (let resultMesh of result.meshes) {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3)
    );

    if (resultMesh.attributes.normal) {
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3)
      );
    }

    if (resultMesh.index) {
      const index = Uint16Array.from(resultMesh.index.array);
      geometry.setIndex(new THREE.BufferAttribute(index, 1));
    }

    let material;
    if (resultMesh.color) {
      const color = new THREE.Color(
        resultMesh.color[0],
        resultMesh.color[1],
        resultMesh.color[2]
      );
      material = new THREE.MeshPhongMaterial({ color });
    } else {
      material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name= resultMesh.name;
    targetObject.add(mesh);
  }
    const box = new THREE.Box3().setFromObject(targetObject);
    const center = box.getCenter(new THREE.Vector3());
    targetObject.position.sub(center); // 중심을 원점으로 이동


    currentModel = targetObject;
    console.log(currentModel);
    threeUseStore.getState().scene.add(currentModel);

    // 중앙 정렬 + 스케일 맞춤
    //centerAndScale(currentModel);

    console.log("✅ 모델 로드 완료:", fileUrl);
    // meshStore에 추가
    currentModel.traverse((children) => {
      if (children.isMesh) {
        meshUseStore.getState().addMesh(children);
      }
    });
}

  return {
    load,
    saveGLB,
  };
}
