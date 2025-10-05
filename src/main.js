import * as THREE from 'three';

import createModelLoader from './File.js';
import createSidebar from './Sidebar.js';
import createViewController from './ViewController.js';
import createModel from './Model.js';
import { meshUseStore } from './stores/meshStore.js';
import { threeUseStore } from './stores/threeStore.js';


threeUseStore.getState().init();

const {scene, camera, renderer, mouse } = threeUseStore.getState();

let modelLoader;
let view, model;

let sidebar;


const raycaster = new THREE.Raycaster();


init();
animate();

function init() {
  // ModelLoader 생성
  modelLoader = createModelLoader();

  view = createViewController();
  model = createModel();

  window.addEventListener('resize', onWindowResize);
sidebar = createSidebar();
  renderer.domElement.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    //console.log(intersects.length > 0 ? intersects[0].object.uuid : null);
    meshUseStore.getState().setHoveredMesh(intersects.length > 0 ? intersects[0].object.uuid : null);
    // model.highlightObjects();
    // sidebar.highlightLiColor();

    
  });

  renderer.domElement.addEventListener("click", () => {
  const {selectedMeshIdx, hoveredMeshIdx, clearSelectedMeshIdxs,selectedMeshIdxs} = meshUseStore.getState();
  if (hoveredMeshIdx) {
    meshUseStore.getState().setSelectedMesh(hoveredMeshIdx);
    console.log(hoveredMeshIdx);
  }
  else{
        meshUseStore.getState().setSelectedMesh(null);
        meshUseStore.getState().clearSelectedMeshIdxs();
  }
  

      

  });
  // 우클릭 메뉴
  initContextMenu();

  initSub();

}

function initSub(){
  meshUseStore.subscribe(
  (state) => state.hoveredMeshIdx,  // 관찰할 상태
  (hoveredMeshIdx) => {
    model.highlightObjects();
    sidebar.highlightLiColor();
  });

    meshUseStore.subscribe(
  (state) => state.selectedMeshIdx,  // 관찰할 상태
  (current, previous) => {
    model.selectMesh(current);
    sidebar.selectLiMesh(current,previous);
  });



}



function initContextMenu() {
  const contextMenu = document.createElement('div');
  const renderMenu = () => {
    const { meshs, selectedMeshIdxs} = meshUseStore.getState(); // 현재 meshs 가져오기
    const hasMeshes = Object.keys(meshs).length > 0; // 하나라도 있으면 true
    const hasSelected = Object.keys(selectedMeshIdxs).length > 0; // 하나라도 있으면 true

    contextMenu.innerHTML = `
      <ul style="list-style:none;margin:0;padding:4px;">
        <li id="openFile" style="padding:8px;cursor:pointer;">📂 파일 불러오기</li>
        ${hasMeshes ? `<li id="saveFile" style="padding:8px;cursor:pointer;">💾 저장하기</li>` : ""}
        ${hasSelected ? `<li id="duplicateMesh" style="padding:8px;cursor:pointer;">💾 복사하기</li>` : ""}

      </ul>
    `;
  };

  Object.assign(contextMenu.style, {
    position: "absolute",
    display: "none",
    background: "white",
    border: "1px solid #aaa",
    borderRadius: "6px",
    boxShadow: "2px 2px 6px rgba(0,0,0,0.2)",
    zIndex: 1000,
    minWidth: "120px"
  });
  document.body.appendChild(contextMenu);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  // fileInput.accept = ".glb,.gltf";
  fileInput.multiple = true; // 여러 파일 선택 가능
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    renderMenu(); // 메뉴 렌더링
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.display = "block";
  });

  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  contextMenu.addEventListener("click", (e) => {
    if (e.target.id === "openFile") {
      fileInput.click();
    } else if (e.target.id === "saveFile") {
      modelLoader.saveGLB(); // GLB 저장 함수
    }
    else if(e.target.id === "duplicateMesh"){
      showDuplicatePopup();
    }
  });

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      await modelLoader.load(file);
      sidebar.update();
    }
  });
}

function showDuplicatePopup() {
    const popup = document.createElement("div");
    Object.assign(popup.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "white",
      border: "1px solid #aaa",
      borderRadius: "8px",
      boxShadow: "2px 2px 10px rgba(0,0,0,0.2)",
      padding: "16px",
      zIndex: 2000,
      textAlign: "center",
    });

    popup.innerHTML = `
      <h4 style="margin-top:0;">복사할 위치 지정</h4>
      <div style="margin-bottom:8px;">
        <label>X: <input id="dupX" type="number" value="1" style="width:60px;"></label>
        <label>Y: <input id="dupY" type="number" value="0" style="width:60px;"></label>
        <label>Z: <input id="dupZ" type="number" value="0" style="width:60px;"></label>
      </div>
      <button id="confirmDup" style="margin-right:8px;">확인</button>
      <button id="cancelDup">취소</button>
    `;
    document.body.appendChild(popup);

    popup.querySelector("#cancelDup").onclick = () => popup.remove();
    popup.querySelector("#confirmDup").onclick = async () => {
      const dx = parseFloat(document.getElementById("dupX").value) || 0;
      const dy = parseFloat(document.getElementById("dupY").value) || 0;
      const dz = parseFloat(document.getElementById("dupZ").value) || 0;
      
      model.duplicateMesh(dx,dy,dz);
      sidebar.update();
      popup.remove();
    };
  }


function animate() {
  requestAnimationFrame(animate);
  view.controlUpdate();


  renderer.render(scene, camera);
}





function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

