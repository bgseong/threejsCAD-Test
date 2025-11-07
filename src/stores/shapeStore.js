import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from "zustand/middleware";

export const shapeUseStore =  createStore(subscribeWithSelector((set, get) => ({
  oc: null,                // OpenCascade 인스턴스
  shapes: null,            // 전역 Compound shape
  initialized: false,      // 중복 초기화 방지

  // --- 초기화 함수 ---
  init: (oc) => {
    if (get().initialized) return; // 이미 초기화된 경우 무시

    const compound = {};

    set({
      oc,
      shapes: compound,
      initialized: true,
    });

    console.log("[shapesStore] Compound 초기화 완료");
  },

  // --- shape 추가 ---
  addShape: (name,shape) => {
    const { shapes } = get();
    if (!shapes) {
      console.warn("⚠️ shapesStore가 아직 초기화되지 않았습니다.");
      return;
    }
    shapes[name] = shape;
  },

  // --- 초기화 해제 (optional) ---
  reset: () => {
    set({
      oc: null,
      shapes: null,
      initialized: false,
    });
    console.log("[shapesStore] 초기화 해제됨");
  },
})));


