import { createStore } from 'zustand/vanilla';
import * as THREE from 'three';

const d = 5;
const aspect = window.innerWidth / window.innerHeight;

export const threeUseStore = createStore((set) => ({
    scene: null,
    camera: null,
    renderer: null,
    hemiLight: null,
    dirLight: null,
    mouse: null,


    init: () => {
    const aspect = window.innerWidth / window.innerHeight;
    const d = 10;

    const scene = new THREE.Scene();
    

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    document.body.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      0.1,
      1000000
    );
    
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);

    const axes = new THREE.AxesHelper(5);
    scene.add(axes);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    const mouse = new THREE.Vector2();



    

    set({ scene, camera, renderer, hemiLight, dirLight , mouse});
  },
  
}));


