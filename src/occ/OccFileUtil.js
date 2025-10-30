import opencascade from "opencascade.js/dist/opencascade.full.js";
import wasm from "opencascade.js/dist/opencascade.full.wasm?url";
import {
    ConstNode
} from "three/webgpu";
import {
    threeUseStore
} from '../stores/threeStore.js';

import {
    meshUseStore
} from '../stores/meshStore.js';

import openCascadeHelper from './openCascadeHelper';
import * as THREE from 'three';




export default async function occFileUtil() {


    

    const oc = await new Promise(async (resolve) => {
        const oc = await opencascade({
            locateFile: (file) => wasm,
        });
        resolve(oc);
    });
    const shapeTool = new oc.XCAFDoc_ShapeTool();

    var shapes = new oc.TopoDS_Compound();  

    let sceneBuilder = new oc.BRep_Builder();
    sceneBuilder.MakeCompound(shapes);

    function stringToHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // 32-bit integer
        }
        return hash;
    }




    let sceneShapes = {};



    const loadFileAsync = (file) => {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        })
    }

    const loadSTEPorIGES = async (inputFile) => {
        const {
            scene
        } = threeUseStore.getState();

        await loadFileAsync(inputFile).then(async (fileText) => {
            const fileType = (() => {
                switch (inputFile.name.toLowerCase().split(".").pop()) {
                    case "step":
                    case "stp":
                        return "step";
                    case "iges":
                    case "igs":
                        return "iges";
                    default:
                        return undefined;
                }
            })();
            // Writes the uploaded file to Emscripten's Virtual Filesystem
            oc.FS.createDataFile("/", `file.${fileType}`, fileText, true, true);
            console.table(fileType, fileText);




            var reader = null;
            if (fileType === "step") {
                reader = new oc.STEPControl_Reader_1();
            } else if (fileType === "iges") {
                reader = new oc.IGESControl_Reader_1();
            } else {
                console.error("opencascade.js can't parse this extension! (yet)");
            }
            const readResult = reader.ReadFile(`file.${fileType}`); // Read the file

            try {
                if (readResult === oc.IFSelect_ReturnStatus.IFSelect_RetDone) {

                    // const shapeTool = new oc.XCAFDoc_ShapeTool();
                    // const colorTool = new oc.XCAFDoc_ColorTool();

                    openCascadeHelper.setOpenCascade(oc);
                    const nbr = reader.NbRootsForTransfer();
                    console.log('루트 개수:', nbr);
                    for (let n = 1; n <= nbr; n++) {
                        console.log(`STEP: Transferring Root ${n}`);
                        reader.TransferRoot(n, new oc.Message_ProgressRange_1());
                    }

                    // 변환된 shape 수
                    const nbs = reader.NbShapes();
                    if (nbs === 0) {
                        console.error('No shapes found in file');
                        return;
                    }

                    console.log('변환된 shape 수:', nbs);


                    

                    // 각 shape 반복
                    for (let i = 1; i <= nbs; i++) {
                        const aShape = reader.Shape(i);
                        const shapeGroup = new THREE.Object3D(); // Shape 단위 Group
                        shapeGroup.name = inputFile.name;
                        sceneBuilder.Add(shapes, aShape);
                        console.log(shapes);
                        // --- SOLID 처리 ---
                        let ex = new oc.TopExp_Explorer_2(
                            aShape,
                            oc.TopAbs_ShapeEnum.TopAbs_SOLID,
                            oc.TopAbs_ShapeEnum.TopAbs_SHAPE
                        );

                        while (ex.More()) {
                            const solid = oc.TopoDS.Solid_1(ex.Current());

                            // OpenCascade Solid → Three.js Mesh 변환
                            const facelist = await openCascadeHelper.tessellate(solid);
                            const [vertexArray, normalArray, indexArray] = await openCascadeHelper.joinPrimitives(facelist);

                            const geometry = new THREE.BufferGeometry();
                            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexArray), 3));
                            geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normalArray), 3));
                            geometry.setIndex(indexArray);

                            const material = new THREE.MeshStandardMaterial({
                                color: 0xcccccc
                            });
                            const mesh = new THREE.Mesh(geometry, material);

                            //mesh.name = getShapeName(solid,shapeTool);
                            shapeGroup.add(mesh); // Shape 그룹에 Solid Mesh 추가

                            ex.Next();
                        }
                        scene.add(shapeGroup); // Scene에 Shape Group 추가
                        var currentModel = shapeGroup;
                        currentModel.traverse((children) => {
                            if (children.isMesh) {
                                meshUseStore.getState().addMesh(children);
                            }
                        });

                    }
                } else {
                    console.error("Something in OCCT went wrong trying to read " + inputFile.name);
                }
            } finally {
                oc.FS.unlink("/"+`file.${fileType}`);
            }

        });
    };

    // function saveFile(){
    //   var writer = new openCascade.STEPControl_Writer_1();
    //   writer.Transfer(, oc.STEPControl_AsIs);
    //   writer.Write("test.step");
    // }

    function getShapeName(solid, shapeTool) {
        // --- 1. C++ 객체 생성 ---
        // TDF_Label()이 아니라 TDF_Label_1() 일 가능성이 높습니다.
        const shapeLabel = new oc.TDF_Label();

        // [!!] 오류의 원인: 이 줄의 주석을 해제해야 합니다.
        const nameAttributeHandle = new oc.Handle_TDataStd_Name_1();

        try {
            // --- 2. Shape에 해당하는 Label 찾기 ---
            if (!shapeTool.FindShape_1(solid, shapeLabel, true)) {
                console.warn("Shape에 해당하는 Label을 찾을 수 없습니다.");
                return null; // 여기서 return해도 finally가 실행됩니다.
            }

            // --- 3. Label에서 Name 속성 찾기 ---
            // (GetID()는 oc.TDataStd_Name.GetID()의 반환값을 미리 변수에 저장해둬도 됩니다)
            if (shapeLabel.FindAttribute_1(oc.TDataStd_Name.GetID(), nameAttributeHandle)) {

                // 4. 속성에서 이름 문자열 변환
                const nameStr = nameAttributeHandle.Access().Get().ToCString();
                return nameStr; // 여기서 return해도 finally가 실행됩니다.
            }

            // 속성을 찾지 못한 경우
            return null;

        } finally {
            // --- 5. [매우 중요] 메모리 해제 ---
            // 함수가 성공하든, 실패하든(return), 에러가 나든
            // 'finally' 블록은 항상 실행되어 생성된 C++ 객체를 해제합니다.ㄴ
            if (shapeLabel) {
                shapeLabel.delete();
            }
            if (nameAttributeHandle) {
                nameAttributeHandle.delete();
            }
        }
    }


    function saveShapeSTEP(filename = "CascadeStudioPart.step") {
        if (!shapes || shapes.IsNull?.()) {
            console.error("❌ currentShape가 비어있습니다.");
            return null;
        }


        let axis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0,0,0), new oc.gp_Dir_4(0,0,1));
        let angle = Math.PI / 4; // 45도

        let rotation = new oc.gp_Trsf_1();
        rotation.SetRotation_1(axis, angle);

        let transformer = new oc.BRepBuilderAPI_Transform_2(shapes, rotation, false);
        shapes = transformer.Shape();
        // STEP Writer 생성
        let writer = new oc.STEPControl_Writer_1();

        // currentShape → STEP Writer로 전달
        const mode = oc.STEPControl_StepModelType.STEPControl_AsIs;
        const compgraph = false; // 컴포넌트 그래프 저장 안 함
        const progress = new oc.Message_ProgressRange_1(); // 진행률 객체

        // Shape → STEP writer로 전달
        let transferResult = writer.Transfer(shapes, oc.STEPControl_StepModelType.STEPControl_ManifoldSolidBrep, true, progress);
        console.log(transferResult);
        if (transferResult !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
            console.error("❌ STEP Writer로 Shape 전달 실패 (Transfer Error)");
            return null;
        }

        // STEP 파일을 가상 파일 시스템에 쓰기
        let writeResult = writer.Write(filename);
        console.log(writeResult);
        if (writeResult !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
            console.error("❌ STEP 파일 쓰기 실패 (Write Error)");
            return null;
        }

        // 파일 내용을 읽고 임시 파일 삭제
        let stepFileText = oc.FS.readFile("/" + filename, {
            encoding: "utf8"
        });
        oc.FS.unlink("/" + filename);

        // STEP 파일 내용 반환
        return stepFileText;
    }



    // const addShapeToScene = async (shape) => {
    //     const {
    //         scene
    //     } = threeUseStore.getState();


    //     openCascadeHelper.setOpenCascade(oc);


    //     const facelist = await openCascadeHelper.tessellate(shape);
    //     console.log(facelist);
    //     const [locVertexcoord, locNormalcoord, locTriIndices] = await openCascadeHelper.joinPrimitives(facelist);
    //     const tot_triangle_count = facelist.reduce((a, b) => a + b.number_of_triangles, 0);
    //     const geometry = await openCascadeHelper.generateGeometry(
    //         tot_triangle_count,
    //         locVertexcoord,
    //         locNormalcoord,
    //         locTriIndices
    //     );
    //     const objectMat = new THREE.MeshStandardMaterial({
    //         color: new THREE.Color(0.9, 0.9, 0.9),
    //         flatShading: false // 필요 시 true로 바꾸면 면 단위 음영
    //     });

    //     // Mesh 생성
    //     const object = new THREE.Mesh(geometry, objectMat);
    //     object.name = "shape";

    //     // 기존 코드 동일하게 회전
    //     object.rotation.x = -Math.PI / 2;

    //     // 장면에 추가
    //     scene.add(object);
    //     var currentModel = object;
    //     console.log(currentModel);


    //     //console.log("✅ 모델 로드 완료:", fileUrl);
    //     // meshStore에 추가
    //     currentModel.traverse((children) => {
    //         if (children.isMesh) {
    //             meshUseStore.getState().addMesh(children);
    //         }
    //     });
    // }
    return {
        loadSTEPorIGES,
        saveShapeSTEP
    };
}