import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from "zustand/middleware";

export const meshUseStore =  createStore(subscribeWithSelector((set) => ({
  meshs: {},           
  selectedMeshIdx: null,
  highlightedMeshIdx: null,
  hoveredMeshIdx: null,

  // 상태 업데이트 함수
  setSelectedMesh: (mesh) => set((state) => ({ ...state, selectedMeshIdx: mesh })),
  setHighlightedMesh: (mesh) => set((state) => ({ ...state, highlightedMeshIdx: mesh })),
  setHoveredMesh: (mesh) => set((state) => ({ ...state, hoveredMeshIdx: mesh })),

      addMesh: (mesh) => {
      set((state) => ({
        meshs: {
          ...state.meshs,
          [mesh.uuid]: mesh,  // uuid를 key로 Mesh 저장
        },
      }));
    },
  removeMesh: (mesh) => set(state => ({ meshs: state.meshs.filter(m => m !== mesh) })),
  
})));


