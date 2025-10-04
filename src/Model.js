import * as THREE from "three";

import { threeUseStore } from './stores/threeStore.js';
import { meshUseStore } from './stores/meshStore.js';



export default function createModel() {

  

  function highlightObjects() {
    const { scene } = threeUseStore.getState();

    const { selectedMeshIdx, highlightedMeshIdx, setHighlightedMesh, hoveredMeshIdx, meshs } = meshUseStore.getState();
    const hoveredMesh =meshs[hoveredMeshIdx];
    const highlightedMesh = meshs[highlightedMeshIdx];
    const selectedMesh = meshs[selectedMeshIdx];
      // 이전 하이라이트 복원
      if (highlightedMesh && highlightedMesh !== selectedMesh && highlightedMesh !== hoveredMesh) {
        highlightedMesh.material.emissive.setHex(highlightedMesh.originalHex ?? 0x000000);
        setHighlightedMesh(null);
      }

      if (hoveredMesh && hoveredMesh !== selectedMesh) {
        // originalHex가 없으면 저장
        if (hoveredMesh.originalHex === undefined) {
          hoveredMesh.originalHex = hoveredMesh.material.emissive.getHex();
        }
        hoveredMesh.material.emissive.setHex(brightenHex(hoveredMesh.originalHex).toString(16));
        setHighlightedMesh(hoveredMeshIdx);
      }
  }

function selectMesh(current, previous) {
  const {
    meshs,
    setSelectedMesh,
    setHighlightedMesh,
  } = meshUseStore.getState();

  const currentMesh = meshs[current];
  const previousMesh = meshs[previous];

  // 🔹 이전 선택 복원
  if (previousMesh && previousMesh !== currentMesh) {
    if (previousMesh.material && previousMesh.material.emissive) {
      previousMesh.material.emissive.setHex(previousMesh.currentHex ?? 0x000000);
    }
  }

  // 🔹 현재 선택 강조
  if (currentMesh) {
    if (currentMesh.material && currentMesh.material.emissive) {
      const brightGreen = mixGreenAndBrighten(currentMesh.material.emissive.getHex());
      currentMesh.material.emissive.setHex(brightGreen);
    }
    setSelectedMesh(current); // 현재 선택 인덱스 저장
    setHighlightedMesh(null); // 하이라이트 해제
  } else {
    setSelectedMesh(null); // 선택 없을 때 초기화
  }
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
  };
}
