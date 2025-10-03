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

function selectMesh(meshIdx) {
  const { selectedMeshIdx, setSelectedMesh, highlightedMeshIdx, setHighlightedMesh,  meshs} = meshUseStore.getState();
  const highlightedMesh = meshs[highlightedMeshIdx];
  const selectedMesh = meshs[selectedMeshIdx];
  const mesh = meshs[meshIdx];
  // 이전 선택 초기화
  if (selectedMesh && selectedMesh !== mesh) {
    selectedMesh.material.emissive.setHex(selectedMesh.currentHex);
  }
  if (mesh) {
    mesh.material.emissive.setHex(mixGreenAndBrighten(mesh.material.emissive.getHex).toString(16)); // 초록색 선택
    setSelectedMesh(meshIdx);

    // 클릭 후 하이라이트 초기화
    if (highlightedMesh === mesh) setHighlightedMesh(null);
  } else {
    setSelectedMesh(null);
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
