export default function createToolbar() {
  // 중복 생성 방지
  if (document.getElementById("topbar")) return;

  // 1️⃣ 툴바 컨테이너 생성
  const toolbar = document.createElement("div");
  toolbar.id = "topbar";
Object.assign(toolbar.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    height: "48px",
    background: "rgba(25, 25, 25, 0.95)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0 12px",
    gap: "10px",
    zIndex: "9999",
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
    userSelect: "none",
  });

  document.body.appendChild(toolbar);

  // 2️⃣ 버튼 생성 헬퍼
  function createButton(label, onClick) {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      background: "#444",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background 0.2s",
    });
    btn.addEventListener("mouseenter", () => (btn.style.background = "#666"));
    btn.addEventListener("mouseleave", () => (btn.style.background = "#444"));
    btn.addEventListener("click", onClick);
    return btn;
  }

  // 5️⃣ body에 삽입
  document.body.appendChild(toolbar);

  // 6️⃣ 필요 시 외부에서 접근할 수 있도록 반환
  return {
    element: toolbar,
    addButton: (label, onClick) => {
      const newBtn = createButton(label, onClick);
      toolbar.appendChild(newBtn);
      return newBtn;
    },
  };
}
