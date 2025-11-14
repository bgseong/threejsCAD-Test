import opencascade from "opencascade.js/dist/opencascade.full.js";
import wasm from "opencascade.js/dist/opencascade.full.wasm?url";

//import { init, readIgesFile, readStepFile, triangulate, writeObjFile, writeGltfFile, writeGlbFile } from 'opencascade-tools'

import {
    ConstNode
} from "three/webgpu";
import {
    threeUseStore
} from '../stores/threeStore.js';

import {
    meshUseStore
} from '../stores/meshStore.js';

import { shapeUseStore } from '../stores/shapeStore.js';

import openCascadeHelper from './openCascadeHelper';
import * as THREE from 'three';




export default async function occFileUtil() {

   // const occ = await init()

    const oc = await new Promise(async (resolve) => {
        const oc = await opencascade({
            locateFile: (file) => wasm,
        });
        resolve(oc);
    });
    const { init } = shapeUseStore.getState();
    init(oc);

    var shapeGroup = null;

    function stringToHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // 32-bit integer
        }
        return hash;
    }


    const appHandle = new oc.Handle_TDocStd_Application_2(new oc.TDocStd_Application());
    const app = appHandle.get();
    //oc.BinXCAFDrivers.DefineFormat(appHandle);


    const doc = new oc.TDocStd_Document(new oc.TCollection_ExtendedString_2("MDTV-XCAF", true));
    const aDoc = new oc.Handle_TDocStd_Document_2(doc);


    const main = doc.Main();
    if (!main) {
        throw new Error("❌ doc.Main()이 null입니다. 도큐먼트가 올바르지 않습니다.");
    }

    const shapeTool = oc.XCAFDoc_DocumentTool.ShapeTool(main).get();
    const colorTool = oc.XCAFDoc_DocumentTool.ColorTool(main).get();


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
            //console.table(fileType, fileText);


            var reader = null;
            if (fileType === "step") {
                reader = new oc.STEPCAFControl_Reader_1();
            } else if (fileType === "iges") {
                reader = new oc.IGESCAFControl_Reader_1();
            } else {
                console.error("opencascade.js can't parse this extension! (yet)");
            }
            console.log("aaa");

            reader.SetColorMode(true);
            reader.SetNameMode(true);

            const readResult = reader.ReadFile(`file.${fileType}`); // Read the file
            console.log(readResult);
            try {
                if (readResult === oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
                    openCascadeHelper.setOpenCascade(oc);

                    reader.Transfer_1(aDoc,new oc.Message_ProgressRange_1());

                    const aRootLabels = new oc.TDF_LabelSequence_1();
                    shapeTool.GetFreeShapes(aRootLabels);
                    shapeGroup = new THREE.Object3D();
                    shapeGroup.name = inputFile.name;
                    //console.log(aRootLabels);
                    for (let i = aRootLabels.Lower(); i <= aRootLabels.Upper(); i++) {
                        console.log(i);
                        const label = aRootLabels.Value(i);

                        traverse(label);
                    }
                } else {
                    console.error("Something in OCCT went wrong trying to read " + inputFile.name);
                }
            } 
            catch (e)
            {
                console.log(e);
            }
            finally {
                oc.FS.unlink("/"+`file.${fileType}`);
            }

        });
    };
    
    function shapeToScene(aShape, name){
        const solid = oc.TopoDS.Solid_1(aShape);
        const facelist = openCascadeHelper.tessellate(solid);
        const [vertexArray, normalArray, indexArray] = openCascadeHelper.joinPrimitives(facelist);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexArray), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normalArray), 3));
        geometry.setIndex(indexArray);

        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        //mesh.name = getShapeName(solid,shapeTool);
        shapeGroup.add(mesh); // Shape 그룹에 Solid Mesh 추가
        
        const {
            scene
        } = threeUseStore.getState();


        scene.add(shapeGroup); // Scene에 Shape Group 추가
        var currentModel = shapeGroup;
        scaleStepModelToMeter(currentModel)
        currentModel.traverse((children) => {
            if (children.isMesh) {
                meshUseStore.getState().addMesh(children);
            }
        });

        
    }
    

    function saveShapeSTEP(filename = "CascadeStudioPart.step") {


        // STEP Writer 생성
        let writer = new oc.STEPCAFControl_Writer_1();


        
        let transferResult = writer.Perform_2(aDoc,filename , new oc.Message_ProgressRange_1());
        console.log(transferResult);

        const { shapes} = shapeUseStore.getState();
        const trsf = new oc.gp_Trsf_1();

        const center = new oc.gp_Pnt_3(0, 0, 0);
        const axis = new oc.gp_Ax1_2(center, new oc.gp_Dir_4(0, 0, 1));
        trsf.SetRotation_1(axis, Math.PI / 4);
        const loc = new oc.TopLoc_Location_2(trsf);

        Object.keys(shapes).forEach((k) => {
            const label = shapes[k];
            const shape = oc.XCAFDoc_ShapeTool.GetShape_2(label);

            // 기존 위치 가져오기
            const currentLoc = shape.Location_1();
            // 기존 위치에 회전 누적
            const newLoc = currentLoc.Multiplied(loc);

            // 적용
            shape.Location_2(newLoc, false);

            // 문서에 반영
            shapeTool.SetShape(label, shape);
        });
   
           
        


        // 파일 내용을 읽고 임시 파일 삭제
        let stepFileText = oc.FS.readFile("/" + 
            filename
            , {encoding: "utf8"
        });
        console.log(stepFileText);
        oc.FS.unlink("/" + filename);

        // STEP 파일 내용 반환
        return stepFileText;
    }
    
    // function traverse(label, depth = 0) {
    //     const indent = '  '.repeat(depth); // 깊이만큼 들여쓰기
    //     const shape = oc.XCAFDoc_ShapeTool.GetShape_2(label);
        
    //     console.log(`${indent}> traverse (depth=${depth})`);

    //     switch (shape.ShapeType()) {
    //         case oc.TopAbs_ShapeEnum.TopAbs_COMPOUND:
    //             console.log(`${indent}  > compound`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_COMPSOLID:
    //             console.log(`${indent}  > compsolid`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_EDGE:
    //             console.log(`${indent}  > edge`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_FACE:
    //             console.log(`${indent}  > face`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_SHAPE:
    //             console.log(`${indent}  > shape`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_SHELL:
    //             console.log(`${indent}  > shell`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_SOLID:
    //             console.log(`${indent}  > solid`);

    //             var nameHandle = new oc.Handle_TDF_Attribute_1();
    //             label.FindAttribute_1(oc.TDataStd_Name.GetID(), nameHandle);
    //             var extStr = nameHandle.get().Get();
    //             const nameString = new oc.TCollection_AsciiString_13(extStr, 0);

    //             const { shapes, addShape } = shapeUseStore.getState();
    //             addShape(nameString.ToCString(), label);
    //             console.table(shapes);

    //             shapeToScene(shape, nameString.ToCString());

    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_VERTEX:
    //             console.log(`${indent}  > vertex`);
    //             break;
    //         case oc.TopAbs_ShapeEnum.TopAbs_WIRE:
    //             console.log(`${indent}  > wire`);
    //             break;
    //         default:
    //             console.log(`${indent}  > default`);
    //     }

    //     const iterator = new oc.TDF_AttributeIterator_2(label, true);
    //     console.log(iterator.More());
    //     while (iterator.More()) {
    //         console.log(iterator.More());
    //         const childLabel = iterator.Value();
    //         const childShape = oc.XCAFDoc_ShapeTool.GetShape_2(childLabel);
    //         const childType = childShape.ShapeType();

    //         console.log(`${indent}  childType=${childType} (depth=${depth + 1})`);

    //         if (
    //             childType === oc.TopAbs_ShapeEnum.TopAbs_SOLID
    //         ) {
    //             traverse(childLabel, depth + 1);
    //         }

    //         iterator.Next();
    //     }
    // }
    function check(label) {
            const shape = oc.XCAFDoc_ShapeTool.GetShape_2(label);
            const type = shape.ShapeType();
            console.log(type);
    }

    function traverse(label, depth = 0) {
        const shape = oc.XCAFDoc_ShapeTool.GetShape_2(label);
        const ex = new oc.TopExp_Explorer_1();
        ex.Init(shape,  oc.TopAbs_ShapeEnum.TopAbs_SOLID, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
        while (ex.More()) {
            const currentShape = ex.Current();
            const currentLabel = shapeTool.FindShape_2(currentShape,false);

            var nameHandle = new oc.Handle_TDF_Attribute_1();
            currentLabel.FindAttribute_1(oc.TDataStd_Name.GetID(), nameHandle);
            var extStr = nameHandle.get().Get();
            const nameString = new oc.TCollection_AsciiString_13(extStr, 0);

            const { shapes, addShape } = shapeUseStore.getState();
            addShape(nameString.ToCString(), currentLabel);
            //console.table(shapes);

            shapeToScene(currentShape, nameString.ToCString());

            ex.Next();
        }
    }
    function scaleStepModelToMeter(model) {
        const mmToMeterScale = 0.001; // 1mm → 0.001m
        model.scale.setScalar(mmToMeterScale);

        console.log(`📐 STEP 모델 스케일 적용: x${mmToMeterScale}`);
    }


    return {
        loadSTEPorIGES,
        saveShapeSTEP
    };
}


                    // 각 shape 반복
                    // for (let i = 1; i <= nbs; i++) {
                    //     const aShape = reader.Shape(i);
                    //     const shapeGroup = new THREE.Object3D(); // Shape 단위 Group
                    //     shapeGroup.name = inputFile.name;
                    //     addShape(aShape);
                    //     console.log(shapes);
                    //     // --- SOLID 처리 ---
                    //     let ex = new oc.TopExp_Explorer_2(
                    //         aShape,
                    //         oc.TopAbs_ShapeEnum.TopAbs_SOLID,
                    //         oc.TopAbs_ShapeEnum.TopAbs_SHAPE
                    //     );

                    //     while (ex.More()) {
                    //         const solid = oc.TopoDS.Solid_1(ex.Current());

                    //         // OpenCascade Solid → Three.js Mesh 변환
                    //         const facelist = await openCascadeHelper.tessellate(solid);
                    //         const [vertexArray, normalArray, indexArray] = await openCascadeHelper.joinPrimitives(facelist);

                    //         const geometry = new THREE.BufferGeometry();
                    //         geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexArray), 3));
                    //         geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normalArray), 3));
                    //         geometry.setIndex(indexArray);

                    //         const material = new THREE.MeshStandardMaterial({
                    //             color: 0xcccccc
                    //         });
                    //         const mesh = new THREE.Mesh(geometry, material);

                    //         //mesh.name = getShapeName(solid,shapeTool);
                    //         shapeGroup.add(mesh); // Shape 그룹에 Solid Mesh 추가

                    //         ex.Next();
                    //     }
                    //     scene.add(shapeGroup); // Scene에 Shape Group 추가
                    //     var currentModel = shapeGroup;
                    //     currentModel.traverse((children) => {
                    //         if (children.isMesh) {
                    //             meshUseStore.getState().addMesh(children);
                    //         }
                    //     });

                    // }