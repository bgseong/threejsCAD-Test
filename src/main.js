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
    meshUseStore.getState().setHoveredMesh(intersects.length > 0 ? intersects[0].object.uuid : null);
    // model.highlightObjects();
    // sidebar.highlightLiColor();
    
  });

  renderer.domElement.addEventListener("click", () => {
  const { highlightedMeshIdx } = meshUseStore.getState();
  if (highlightedMeshIdx) {
    model.selectMesh(highlightedMeshIdx);
    
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
    model.selectMesh(current,previous);
    sidebar.selectLiMesh(current,previous);
  });



}



function initContextMenu() {
  const contextMenu = document.createElement('div');
  const renderMenu = () => {
    const { meshs } = meshUseStore.getState(); // 현재 meshs 가져오기
    const hasMeshes = Object.keys(meshs).length > 0; // 하나라도 있으면 true

    contextMenu.innerHTML = `
      <ul style="list-style:none;margin:0;padding:4px;">
        <li id="openFile" style="padding:8px;cursor:pointer;">📂 파일 불러오기</li>
        ${hasMeshes ? `<li id="saveFile" style="padding:8px;cursor:pointer;">💾 저장하기</li>` : ""}
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
  fileInput.accept = ".glb,.gltf";
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
  });

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      await modelLoader.load(file);
      sidebar.update();
    }
  });
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

