import opencascade from "opencascade.js/dist/opencascade.wasm.js";
import wasm from "opencascade.js/dist/opencascade.wasm.wasm?url";
import { ConstNode } from "three/webgpu";

export default async function occFileUtil() {

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

    const oc = await new Promise(async (resolve) => {
    const oc = await opencascade({
        locateFile: (file) => wasm,
    });
    resolve(oc);
    });

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
    console.table(fileType,fileText);

    // Choose the correct OpenCascade file parsers to read the CAD file
    var reader = null;
    if (fileType === "step") {
      reader = new oc.STEPControl_Reader_1();
    } else if (fileType === "iges") {
      reader = new oc.IGESControl_Reader_1();
    } else { console.error("opencascade.js can't parse this extension! (yet)"); }
    const readResult = reader.ReadFile(`file.${fileType}`);            // Read the file
    if (readResult === oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
      console.log("file loaded successfully!     Converting to OCC now...");
      const stepShape = reader.OneShape(); 

      sceneShapes[inputFile.name] = stepShape;
      sceneShapes[inputFile.name].hash = stringToHash(inputFile.name);
      console.log(sceneShapes[inputFile.name]);
      console.log(inputFile.name + " converted successfully!  Triangulating now...");

      // Out with the old, in with the new!
      console.log(inputFile.name + " triangulated and added to the scene!");

      // Remove the file when we're done (otherwise we run into errors on reupload)
      oc.FS.unlink(`/file.${fileType}`);
    } else {
      console.error("Something in OCCT went wrong trying to read " + inputFile.name);
    }
  });
};

    return {
        loadSTEPorIGES
    };
}