import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { threeUseStore } from "./stores/threeStore.js";
import { meshUseStore } from "./stores/meshStore.js";
import * as THREE from 'three';
import gsap from "gsap";

export default function createViewController() {
  const { scene, camera, renderer, transformControls } = threeUseStore.getState();
  const direction = new THREE.Vector3()
  const controls = new OrbitControls(camera, renderer.domElement);

  // OrbitControls 기본 세팅
  function setupControl() {
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.zoomToCursor = true;
    controls.screenSpacePanning = true;
    
    transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value; // 드래그 중이면 orbit 비활성화, 끝나면 다시 활성화
  });

  }

  setupControl();

  // 툴바 UI 생성
function createToolbar() {
  const toolbar = document.createElement("div");
  toolbar.id = "toolbar";
  toolbar.innerHTML = `
    <div class="group">
      <span>이동</span>
      <div class="axis">
        <label>X:</label><input id="moveXValue" type="number" value="2" step="0.1">
        <button data-action="moveX+">+</button>
        <button data-action="moveX-">−</button>
      </div>
      <div class="axis">
        <label>Y:</label><input id="moveYValue" type="number" value="2" step="0.1">
        <button data-action="moveY+">+</button>
        <button data-action="moveY-">−</button>
      </div>
      <div class="axis">
        <label>Z:</label><input id="moveZValue" type="number" value="2" step="0.1">
        <button data-action="moveZ+">+</button>
        <button data-action="moveZ-">−</button>
      </div>
    </div>

    <div class="group">
      <span>회전</span>
      <div class="axis">
        <label>X:</label><input id="rotateXValue" type="number" value="90" step="5">
        <button data-action="rotateX+">+</button>
        <button data-action="rotateX-">−</button>
      </div>
      <div class="axis">
        <label>Y:</label><input id="rotateYValue" type="number" value="90" step="5">
        <button data-action="rotateY+">+</button>
        <button data-action="rotateY-">−</button>
      </div>
      <div class="axis">
        <label>Z:</label><input id="rotateZValue" type="number" value="90" step="5">
        <button data-action="rotateZ+">+</button>
        <button data-action="rotateZ-">−</button>
      </div>
    </div>
  `;
  document.body.appendChild(toolbar);

  // ✨ 스타일
  const style = document.createElement("style");
  style.textContent = `
    #toolbar {
      position: absolute;
      bottom: 20px;
      left: 20px;
      display: flex;
      gap: 20px;
      padding: 10px 15px;
      background: rgba(30, 30, 30, 0.9);
      border-radius: 10px;
      color: white;
      font-size: 13px;
      user-select: none;
    }
    #toolbar .group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #toolbar .axis {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #toolbar input {
      width: 50px;
      text-align: right;
      padding: 3px 5px;
      background: #222;
      color: white;
      border: 1px solid #444;
      border-radius: 4px;
    }
    #toolbar button {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      background: #3a3a3a;
      color: white;
      cursor: pointer;
      font-weight: bold;
    }
    #toolbar button:hover {
      background: #555;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);

  // 🧠 이벤트 로직
  toolbar.addEventListener("click", (e) => {
    if (!e.target.matches("button")) return;
    const action = e.target.dataset.action;
    const { meshs, selectedMeshIdxs } = meshUseStore.getState();

    // 각 축 이동/회전 값 가져오기
    const getValue = (id) => parseFloat(document.getElementById(id).value || 0);

    selectedMeshIdxs.forEach((key) => {
      const mesh = meshs[key];
      if (!mesh) return;

      switch (action) {
        // === 이동 ===
        case "moveX+":
          gsap.to(mesh.position, { x: mesh.position.x + getValue("moveXValue"), duration: 0.6 });
          break;
        case "moveX-":
          gsap.to(mesh.position, { x: mesh.position.x - getValue("moveXValue"), duration: 0.6 });
          break;
        case "moveY+":
          gsap.to(mesh.position, { y: mesh.position.y + getValue("moveYValue"), duration: 0.6 });
          break;
        case "moveY-":
          gsap.to(mesh.position, { y: mesh.position.y - getValue("moveYValue"), duration: 0.6 });
          break;
        case "moveZ+":
          gsap.to(mesh.position, { z: mesh.position.z + getValue("moveZValue"), duration: 0.6 });
          break;
        case "moveZ-":
          gsap.to(mesh.position, { z: mesh.position.z - getValue("moveZValue"), duration: 0.6 });
          break;

        // === 회전 ===
        case "rotateX+":
          gsap.to(mesh.rotation, { x: mesh.rotation.x + (getValue("rotateXValue") * Math.PI) / 180, duration: 0.6 });
          break;
        case "rotateX-":
          gsap.to(mesh.rotation, { x: mesh.rotation.x - (getValue("rotateXValue") * Math.PI) / 180, duration: 0.6 });
          break;
        case "rotateY+":
          gsap.to(mesh.rotation, { y: mesh.rotation.y + (getValue("rotateYValue") * Math.PI) / 180, duration: 0.6 });
          break;
        case "rotateY-":
          gsap.to(mesh.rotation, { y: mesh.rotation.y - (getValue("rotateYValue") * Math.PI) / 180, duration: 0.6 });
          break;
        case "rotateZ+":
          gsap.to(mesh.rotation, { z: mesh.rotation.z + (getValue("rotateZValue") * Math.PI) / 180, duration: 0.6 });
          break;
        case "rotateZ-":
          gsap.to(mesh.rotation, { z: mesh.rotation.z - (getValue("rotateZValue") * Math.PI) / 180, duration: 0.6 });
          break;
      }
    });
  });
}


  // 툴바 실행
  createToolbar();

  // 외부 API 노출
  return {
    controlUpdate: () => {
      const {meshs, selectedMeshIdxs} = meshUseStore.getState();
        //console.log(selectedMeshIdxs);
            if (selectedMeshIdxs.size) {
                // 중심점 계산용 Vector3
                // const center = new THREE.Vector3();

                // // 모든 선택된 mesh들의 월드 좌표를 더함
                // selectedMeshIdxs.forEach(idx => {
                //   console.log(meshs[idx]);
                //   const worldPos = new THREE.Vector3();
                //   meshs[idx].getWorldPosition(worldPos);
                //   center.add(worldPos);
                //   console.log(worldPos);
                // });

                // // 평균을 내서 중심점 계산
                // center.divideScalar(selectedMeshIdxs);

                // // OrbitControls의 타겟을 이 중심점으로 설정
                // controls.target.copy(center);

                // // 컨트롤러 갱신
                // controls.update();
                // console.log(center);
              }
              else{
                camera.getWorldDirection(direction);

                // 카메라 위치 + 바라보는 방향 * 거리
                const distance = 10; // 원하는 거리 (예: 카메라 앞쪽 10단위)
                const targetPosition = camera.position.clone().add(direction.multiplyScalar(distance));

                // 화면의 중앙을 회전 중심으로
                controls.target.copy(targetPosition);
                
                controls.update()
                //console.log(targetPosition);
                // console.log(targetPosition);
              }
      
    
    
    },

  
    getControls: () => controls,
  };
}
