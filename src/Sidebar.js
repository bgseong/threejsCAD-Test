import { meshUseStore } from './stores/meshStore';
import { threeUseStore } from './stores/threeStore.js';
import createModel from './Model.js';

export default function createSidebar(containerId = "sidebar") {
  const { scene } = threeUseStore.getState();
  const sidebar = document.getElementById(containerId);
  const model = createModel();

  let previousHighlightedId = null;
  // 스타일 초기화
  function initStyle() {
    sidebar.style.position = "absolute";
    sidebar.style.top = "0";
    sidebar.style.right = "0";
    sidebar.style.width = "250px";
    sidebar.style.height = "100%";
    sidebar.style.background = "rgba(30,30,30,0.95)";
    sidebar.style.color = "white";
    sidebar.style.overflowY = "auto";
    sidebar.style.padding = "10px";
    sidebar.style.boxShadow = "-2px 0 8px rgba(0,0,0,0.5)";
    sidebar.style.zIndex = "10"; // canvas 위
  }

  // 자식 요소 제거
  function clear() {
    Array.from(sidebar.children).forEach((child) => {
      sidebar.removeChild(child);
    });
  }

  // 요소 업데이트
  function update() {
    clear();

const ul = document.createElement("ul");

// 씬 내 Object3D(그룹) 순회
scene.traverse((child) => {
  // Object3D이고 Mesh가 하나 이상 있으면 그룹 처리
  if (child.isObject3D && child.children.some(c => c.isMesh)) {
    const groupLi = document.createElement("li");
    groupLi.style.padding = "4px 0";

    // 화살표 + 그룹 이름
    const toggleBtn = document.createElement("span");
    toggleBtn.textContent = "▶"; // 기본 닫힘
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.marginRight = "6px";

    const groupName = document.createElement("span");
    groupName.textContent = child.name || "Unnamed Group";
    groupName.style.fontWeight = "bold";

    groupLi.appendChild(toggleBtn);
    groupLi.appendChild(groupName);

    // 그룹 안의 Mesh 리스트
    const childUl = document.createElement("ul");
    childUl.style.display = "none";
    childUl.style.paddingLeft = "16px";

    child.children.forEach((mesh) => {
      if (mesh.isMesh) {
        const li = document.createElement("li");
        li.setAttribute("id", mesh.uuid);
        li.textContent = mesh.name || "Unnamed";
        li.style.padding = "4px 0";
        li.style.cursor = "pointer";

        // 체크박스
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.style.marginRight = "8px";
        checkbox.addEventListener("change", () => {
          mesh.visible = checkbox.checked;
        });

        // 색상 선택기
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = `#${mesh.material.color.getHexString()}`;
        colorInput.style.marginLeft = "8px";
        colorInput.addEventListener("input", () => {
          if (mesh.material) mesh.material.color.set(colorInput.value);
        });

        // 체크박스 + 색상 div
        const rightContainer = document.createElement("div");
        rightContainer.style.display = "flex";
        rightContainer.style.alignItems = "center";
        rightContainer.appendChild(checkbox);
        rightContainer.appendChild(colorInput);
        li.appendChild(rightContainer);

        // Hover 이벤트
        li.addEventListener("mousemove", () => {
          meshUseStore.getState().setHoveredMesh(mesh.uuid);
        });

        // Click 이벤트
        li.addEventListener("click", () => {
          model.selectMesh(mesh.uuid);
        });

        childUl.appendChild(li);
      }
    });

    // 토글 버튼 이벤트
    toggleBtn.addEventListener("click", () => {
      if (childUl.style.display === "none") {
        childUl.style.display = "block";
        toggleBtn.textContent = "▼";
      } else {
        childUl.style.display = "none";
        toggleBtn.textContent = "▶";
      }
    });

    groupLi.appendChild(childUl);
    ul.appendChild(groupLi);
  }
});

sidebar.appendChild(ul);

  }

  initStyle();

  function highlightLiColor() {
    const { highlightedMeshIdx, selectedMeshIdx } = meshUseStore.getState();

    // 1️⃣ 이전 hover li 복원 (단, 선택된 li는 건드리지 않음)
    if (previousHighlightedId && previousHighlightedId !== highlightedMeshIdx) {
      if (previousHighlightedId !== selectedMeshIdx) {
        const prevLi = document.getElementById(previousHighlightedId);
        if (prevLi) prevLi.style.backgroundColor = "transparent";
      }
    }

    // 2️⃣ 현재 hover li 색상 적용 (선택된 li는 무시)
    if (highlightedMeshIdx != null && highlightedMeshIdx !== selectedMeshIdx) {
      const li = document.getElementById(highlightedMeshIdx);
      if (li) li.style.backgroundColor = "rgba(109, 109, 109, 0.5)"; // hover 색
    }

    // 3️⃣ 이전 hover id 저장
    previousHighlightedId = highlightedMeshIdx;
  }

  function selectLiMesh(current) {
      const {
        setSelectedMesh,
        addSelectedMeshIdx,
        selectedMeshIdxs,
        setHighlightedMesh,
      } = meshUseStore.getState();
    const currentLi = document.getElementById(current);

    if (currentLi){
      currentLi.style.backgroundColor = "lightgreen";
      setSelectedMesh(current);
    }
     else{
      Object.keys(selectedMeshIdxs).forEach((id) => {
        const lis = document.getElementById(id);
      lis.style.backgroundColor = "transparent";

    });
    }
    
  }


  return {
    update,
    clear,
    highlightLiColor,
    selectLiMesh,
    element: sidebar,
  };
}
