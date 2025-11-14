import { createStore } from 'zustand/vanilla';
import * as THREE from 'three';

import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import CameraControls from 'camera-controls';

import {
	Vector2,
	Vector3,
	Vector4,
	Quaternion,
	Matrix4,
	Spherical,
	Box3,
	Sphere,
	Raycaster,
} from 'three';

const subsetOfTHREE = {
	Vector2   : Vector2,
	Vector3   : Vector3,
	Vector4   : Vector4,
	Quaternion: Quaternion,
	Matrix4   : Matrix4,
	Spherical : Spherical,
	Box3      : Box3,
	Sphere    : Sphere,
	Raycaster : Raycaster,
};

CameraControls.install( { THREE: subsetOfTHREE } );

const width = window.innerWidth;
const height = window.innerHeight;

export const threeUseStore = createStore((set,get) => ({
    scene: null,
    camera: null,
    renderer: null,
    hemiLight: null,
    dirLight: null,
    mouse: null,
    transformControls: null,
    transformIs: false,
    controls: null,


    init: () => {

    const scene = new THREE.Scene();
    

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // ✅ 투명도 활성화
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.background = "linear-gradient(180deg, #e0e0e0, #8c8c8c)"; 
    document.body.appendChild(renderer.domElement);




    const viewHeight = 3; // 화면에 보이는 높이 3m
    const aspect = width / height;
    const viewWidth = viewHeight * aspect;

    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      1000
    );

    camera.position.set(0, 0, 200); // 충분히 멀리
    camera.lookAt(0, 0, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);

    //const gridHelper = new THREE.GridHelper( 1000, 1000 );
    //scene.add( gridHelper );

    scene.add(hemiLight);


    // const gridHelper = new THREE.GridHelper(100, 10); 
    // scene.add(gridHelper);



    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    const mouse = new THREE.Vector2();


    const transformControls = new TransformControls(camera, renderer.domElement);


    const controls = new CameraControls(camera, renderer.domElement);
    set({ scene, camera, renderer, hemiLight, dirLight , mouse, transformControls, controls});
  },

  transformChange: () => {
    const { transformIs } = get();
    set({ transformIs: !transformIs });
    
    console.log("transform :" ,transformIs );
  },

}));


