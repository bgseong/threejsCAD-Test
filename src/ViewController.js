import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { threeUseStore } from "./stores/threeStore.js";
import { meshUseStore } from "./stores/meshStore.js";
import { statusUseStore } from "./stores/statusStore.js"
import * as THREE from 'three';
import gsap from "gsap";
import { pass } from "three/tsl";
import CameraControls from 'camera-controls';
const clock = new THREE.Clock();


export default function createViewController() {
  const { scene, camera, renderer, transformControls, controls } = threeUseStore.getState();
  
  setupControl();

  function setupControl() {
    // 커서 기준으로 줌
    controls.dollyToCursor = true;

    // dolly(줌) 속도 줄이기 (기본값은 1.0)
    controls.dollySpeed = 0.5;
    controls.maxDistance = 5000;  

    // 각도 제한 (조금 널널하게)
    controls.minPolarAngle = 0;           // 위쪽 제한 거의 없음
    controls.maxPolarAngle = Math.PI;     // 아래쪽도 넉넉하게
    controls.minAzimuthAngle = -Infinity; // 좌우 회전 제한 없음
    controls.maxAzimuthAngle = Infinity;
    controls.rotationSpeed = 0.3; 
    // 카메라 이동 허용 (truck / pan)
    controls.truckSpeed = 0.5; // 기본 속도. 줄이면 더 천천히 움직임
    // controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    // controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    // controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
    controls.mouseButtons.left = CameraControls.ACTION.NONE;
    controls.mouseButtons.middle = CameraControls.ACTION.NONE;
    controls.mouseButtons.right = CameraControls.ACTION.NONE;
    transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value; // 드래그 중이면 orbit 비활성화, 끝나면 다시 활성화
  });

    

    const keyState = {
      shift  : false,
      control: false
    };

    const mouseState = {
      middlePressed: false,
      left: false,
    };

    const updateConfig = () => {
        

        // 휠 버튼을 누른 상태일 때
      if (keyState.shift) {
        controls.mouseButtons.middle = CameraControls.ACTION.ROTATE; // Shift + 휠 = 회전
      } else {
        controls.mouseButtons.middle = CameraControls.ACTION.TRUCK;  // 그냥 휠 = 트럭
      }
     
    };

    // 키 이벤트
    document.addEventListener('keydown', (event) => {
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keyState.shift = true;
      if (event.code === 'ControlLeft' || event.code === 'ControlRight') keyState.control = true;
      updateConfig();
    });

    document.addEventListener('keyup', (event) => {
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keyState.shift = false;
      if (event.code === 'ControlLeft' || event.code === 'ControlRight') keyState.control = false;
      updateConfig();
    });

    // 마우스 이벤트
    document.addEventListener('mousedown', (event) => {
      if (event.button === 1) { // 휠 버튼
        mouseState.middlePressed = true;
        updateConfig();
      }
      if (event.button === 0) { // 휠 버튼
        mouseState.left = true;
      }
    });

    document.addEventListener('mouseup', (event) => {
      if (event.button === 1) {
        mouseState.middlePressed = false;
        updateConfig();
      }
      if (event.button === 0) {
        mouseState.left = false;
      }
    });

  }

  

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
    setControlTarget: (sets) =>{
      let length = sets.size;
      if(length !== 0){
        const {meshs} = meshUseStore.getState();
        const center = new THREE.Vector3(0,0,0);
        sets.forEach(idx => {

          var center = new THREE.Vector3();
          mesh.geometry.computeBoundingBox();
          mesh.geometry.boundingBox.getCenter(center);
          mesh.geometry.center();
          mesh.position.copy(center);

          const worldPos = new THREE.Vector3();
          meshs[idx].getWorldPosition(worldPos);
          center.add(worldPos);
        });
        center.divideScalar(length);
        console.log(center);
        controls.setOrbitPoint(center.x, center.y, center.z, false);
      }
      
    },

    controlUpdate: () => {
      const delta = clock.getDelta();
      controls.update(delta);
    },

    getControls: () => controls,
  };
}
