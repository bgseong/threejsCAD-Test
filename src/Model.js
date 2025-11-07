import * as THREE from "three";

import { threeUseStore } from './stores/threeStore.js';
import { meshUseStore } from './stores/meshStore.js';
import { generateUUID } from "three/src/math/MathUtils.js";



export default function createModel() {

  function highlightObjects() {
    const { selectedMeshIdx, highlightedMeshIdx, setHighlightedMesh, hoveredMeshIdx, meshs, selectedMeshIdxs} = meshUseStore.getState();
    const hoveredMesh =meshs[hoveredMeshIdx];
    const highlightedMesh = meshs[highlightedMeshIdx];
    const selectedMesh = meshs[selectedMeshIdx];
      // 이전 하이라이트 복원
      if (highlightedMesh && highlightedMesh !== selectedMesh && highlightedMesh !== hoveredMesh) {
        highlightedMesh.material.emissive.setHex(highlightedMesh.originalHex ?? 0x000000);
        setHighlightedMesh(null);
      }

      if (hoveredMesh && !(hoveredMeshIdx in selectedMeshIdxs)) {
        // originalHex가 없으면 저장
        if (hoveredMesh.originalHex === undefined) {
          hoveredMesh.originalHex = hoveredMesh.material.emissive.getHex();
        }
        hoveredMesh.material.emissive.setHex(brightenHex(hoveredMesh.originalHex).toString(16));
        setHighlightedMesh(hoveredMeshIdx);
      }
  }

function selectMesh(current) {
  const {
    meshs,
    setSelectedMesh,
    addSelectedMeshIdx,
    selectedMeshIdxs,
    setHighlightedMesh,
  } = meshUseStore.getState();
  const {  scene, transformControls,transformChange, transformIs } = threeUseStore.getState();

  const currentMesh = meshs[current];
  if (currentMesh) {
    if (currentMesh.material && currentMesh.material.emissive) {
      const brightGreen = mixGreenAndBrighten(currentMesh.material.emissive.getHex());
      currentMesh.material.emissive.setHex(brightGreen);

      // const moveSpeed = 5;

      // const forward = new THREE.Vector3();
      // camera.getWorldDirection(forward);

      // const right = new THREE.Vector3();
      // right.crossVectors(forward, camera.up).normalize();

      // currentMesh.position.addScaledVector(right, -moveSpeed);
      //transformControls.attach(currentMesh);
      //scene.add(transformControls.getHelper());
    }

    setSelectedMesh(current); // 현재 선택 인덱스 저장
    addSelectedMeshIdx(current);
    setHighlightedMesh(null); // 하이라이트 해제
  }
  else{
    selectedMeshIdxs.forEach((id) => {
    const mesh = meshs[id];
    if(mesh){
      transformControls.detach();
      scene.remove(transformControls.getHelper());
      if(transformIs) transformChange();
      mesh.material.emissive.setHex(mesh.originalHex ?? 0x000000);
    }
  });
}
}

function addTransformControl(current){
    const {  scene, transformControls } = threeUseStore.getState();
    transformControls.attach(current);
    scene.add(transformControls.getHelper());
}



async function duplicateMesh(dx = 0, dy = 0, dz = 0) {
  const { meshs, selectedMeshIdxs, addMesh } = meshUseStore.getState();
  const scene = threeUseStore.getState().scene;

  if (!scene) return console.warn("씬이 없습니다.");

  selectedMeshIdxs.forEach((id) => {
    const original = meshs[id];
    if (!original) return;

    // 1️⃣ 깊은 복사
    const clone = original.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        // Geometry 깊은 복사
        child.geometry = child.geometry.clone();

        // Material 깊은 복사
        if (Array.isArray(child.material)) {
          child.material = child.material.map(mat => mat.clone());
        } else if (child.material) {
          child.material = child.material.clone();
        }

        // emissive 초기화
        child.material.emissive.setHex(child.originalHex ?? 0x000000);
      }
    });

    // 2️⃣ clone 기준 중심/스케일 정규화
    //centerAndScale(clone);

    // 3️⃣ 이동 적용
    clone.position.x += dx;
    clone.position.y += dy;
    clone.position.z += dz;

    // 4️⃣ UUID와 이름 처리
    clone.uuid = THREE.MathUtils.generateUUID();
    clone.name = (clone.name || "Unnamed") + " (복사본)";
    clone.applyMatrix4(original.matrixWorld);

    // 5️⃣ 씬과 store에 추가
    scene.add(clone);
    
    addMesh(clone);
    clone.scale.set(1, 1, 1);
    
  });

  console.table(meshUseStore.getState().meshs);
}

// centerAndScale는 clone 기준 그대로 사용
function centerAndScale(model) {

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center); // 중심 원점 이동
  const maxAxis = Math.max(size.x, size.y, size.z);
  model.scale.multiplyScalar(1.0 / maxAxis); // 스케일 정규화
}


function brightenHex(hex, factor = 1.2, min = 20) {
  let r = (hex >> 16) & 0xff;
  let g = (hex >> 8) & 0xff;
  let b = hex & 0xff;

  // 최소값 적용
  r = Math.max(min, Math.min(255, Math.floor(r * factor)));
  g = Math.max(min, Math.min(255, Math.floor(g * factor)));
  b = Math.max(min, Math.min(255, Math.floor(b * factor)));

  return (r << 16) | (g << 8) | b;
}
function mixGreenAndBrighten(baseHex, factor = 1.2, greenAmount = 80, min = 20) {
  let r = (baseHex >> 16) & 0xff;
  let g = (baseHex >> 8) & 0xff;
  let b = baseHex & 0xff;

  // 초록색 섞기
  g = Math.min(255, g + greenAmount);

  // 밝기 조절
  r = Math.max(min, Math.min(255, Math.floor(r * factor)));
  g = Math.max(min, Math.min(255, Math.floor(g * factor)));
  b = Math.max(min, Math.min(255, Math.floor(b * factor)));

  return (r << 16) | (g << 8) | b;
}


  // 외부에 필요한 기능만 반환
  return {
    highlightObjects,
    selectMesh,
    duplicateMesh,
    addTransformControl,
  };
}
