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

        scene.traverse((child) => {
      if (child.isMesh) {
        const li = document.createElement("li");
        li.setAttribute("id", child.uuid);
        li.textContent = child.name || "Unnamed";
        li.style.padding = "4px 0";
        li.style.cursor = "pointer";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.style.marginRight = "8px";

        checkbox.addEventListener("change", () => {
          child.visible = checkbox.checked;
        });

        // 색상 선택기 생성
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = `#${child.material.color.getHexString()}`;
        colorInput.style.marginLeft = "8px";

        colorInput.addEventListener("input", () => {
          if (child.material) {
            child.material.color.set(colorInput.value);
          }
        });

        // 체크박스와 색상 선택기 li에 추가
        const rightContainer = document.createElement("div");
        rightContainer.style.display = "flex";
        rightContainer.style.alignItems = "center";
        rightContainer.appendChild(checkbox);
        rightContainer.appendChild(colorInput);
        li.appendChild(rightContainer);
        // Hover 이벤트
        li.addEventListener("mousemove", () => {
          meshUseStore.getState().setHoveredMesh(child.uuid);
          // model.highlightObjects();
          // highlightLiColor();
        });

        // li.addEventListener("mouseleave", () => {
        //   const { selectedMeshIdx } = meshUseStore.getState();
        //   if (child.uuid !== selectedMeshIdx) meshUseStore.getState().setHoveredMesh(null);
        // });

        // Click 이벤트
        li.addEventListener("click", () => {
          model.selectMesh(child.uuid);
        });
        ul.appendChild(li);
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

  function selectLiMesh(current, previous) {
  const { setSelectedMesh } = meshUseStore.getState();

  const currentLi = document.getElementById(current);
  const previousLi = previous != null ? document.getElementById(previous) : null;

  // 1️⃣ 같은 것을 클릭했으면 선택 해제
  if (current === previous) {
    if (currentLi) currentLi.style.backgroundColor = "transparent";
    setSelectedMesh(null);
    return;
  }

  // 2️⃣ 이전 선택 초기화
  if (previousLi) previousLi.style.backgroundColor = "transparent";

  // 3️⃣ 현재 선택 적용
  if (currentLi) currentLi.style.backgroundColor = "lightgreen";
  setSelectedMesh(current);
}


  return {
    update,
    clear,
    highlightLiColor,
    selectLiMesh,
    element: sidebar,
  };
}
