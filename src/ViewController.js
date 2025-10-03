import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { threeUseStore } from "./stores/threeStore.js";
import { meshUseStore } from "./stores/meshStore.js";
import gsap from "gsap";

export default function createViewController() {
  const { scene, camera, renderer } = threeUseStore.getState();

  const controls = new OrbitControls(camera, renderer.domElement);

  // OrbitControls 기본 세팅
  function setupControl() {
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.zoomToCursor = true;
    controls.screenSpacePanning = true;
  }

  setupControl();

  // 툴바 UI 생성
  function createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.id = "toolbar";
    toolbar.innerHTML = `
      <div class="group">
        <span>이동</span>
        <button data-action="moveX">X</button>
        <button data-action="moveY">Y</button>
        <button data-action="moveZ">Z</button>
      </div>
      <div class="group">
        <span>회전</span>
        <button data-action="rotateX">X</button>
        <button data-action="rotateY">Y</button>
        <button data-action="rotateZ">Z</button>
      </div>
    `;
    document.body.appendChild(toolbar);

    // 스타일 추가
    const style = document.createElement("style");
    style.textContent = `
      #toolbar {
        position: absolute;
        bottom: 20px;
        left: 20px;
        display: flex;
        gap: 20px;
        padding: 10px;
        background: rgba(40, 40, 40, 0.9);
        border-radius: 10px;
        color: white;
        font-size: 14px;
      }
      #toolbar .group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      #toolbar .group span {
        font-size: 12px;
        margin-bottom: 4px;
      }
      #toolbar button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: #2d2d2d;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
      }
      #toolbar button:hover {
        background: #3d3d3d;
        transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);

    // 이벤트 바인딩
    toolbar.addEventListener("click", (e) => {
      if (!e.target.matches("button")) return;

      const action = e.target.dataset.action;
      const { meshs } = meshUseStore.getState();  // 전체 mesh 배열 가져오기

      Object.values(meshs).forEach(mesh => {
        if (!mesh) return;

        switch (action) {
          // 이동
          case "moveX":
            gsap.to(mesh.position, { x: mesh.position.x + 2, duration: 1, ease: "power2.inOut" });
            break;
          case "moveY":
            gsap.to(mesh.position, { y: mesh.position.y + 2, duration: 1, ease: "power2.inOut" });
            break;
          case "moveZ":
            gsap.to(mesh.position, { z: mesh.position.z + 2, duration: 1, ease: "power2.inOut" });
            break;

          // 회전
          case "rotateX":
            gsap.to(mesh.rotation, { x: mesh.rotation.x + Math.PI / 2, duration: 1, ease: "power2.inOut" });
            break;
          case "rotateY":
            gsap.to(mesh.rotation, { y: mesh.rotation.y + Math.PI / 2, duration: 1, ease: "power2.inOut" });
            break;
          case "rotateZ":
            gsap.to(mesh.rotation, { z: mesh.rotation.z + Math.PI / 2, duration: 1, ease: "power2.inOut" });
            break;
        }
      });
    });

  }

  // 툴바 실행
  createToolbar();

  // 외부 API 노출
  return {
    controlUpdate: () => controls.update(),
    getControls: () => controls,
  };
}
