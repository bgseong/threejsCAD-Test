import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from "zustand/middleware";

export const shapeUseStore =  createStore(subscribeWithSelector((set, get) => ({
  oc: null,                // OpenCascade 인스턴스
  shapes: null,            // 전역 Compound shape
  builder: null,           // BRep_Builder 인스턴스
  initialized: false,      // 중복 초기화 방지

  // --- 초기화 함수 ---
  init: (oc) => {
    if (get().initialized) return; // 이미 초기화된 경우 무시

    const compound = new oc.TopoDS_Compound();
    const builder = new oc.BRep_Builder();
    builder.MakeCompound(compound);

    set({
      oc,
      shapes: compound,
      builder,
      initialized: true,
    });

    console.log("[shapesStore] Compound 초기화 완료");
  },

  // --- shape 추가 ---
  addShape: (shape) => {
    const { builder, shapes } = get();
    if (!builder || !shapes) {
      console.warn("⚠️ shapesStore가 아직 초기화되지 않았습니다.");
      return;
    }
    builder.Add(shapes, shape);
  },

  replaceShapes: (compound) => {
    const { initialized } = get();
    if (!initialized) {
      console.warn("⚠️ shapesStore가 아직 초기화되지 않았습니다.");
      return;
    }

    set({ shapes: compound });
    console.log("[shapesStore] 기존 Compound가 새 Compound로 교체됨");
  },

  // --- 초기화 해제 (optional) ---
  reset: () => {
    set({
      oc: null,
      shapes: null,
      builder: null,
      initialized: false,
    });
    console.log("[shapesStore] 초기화 해제됨");
  },
})));


