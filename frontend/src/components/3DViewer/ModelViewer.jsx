import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ModelViewer = ({ onModelLoad, onMorphTargetsUpdate, xrayMode }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fa); // Set background to a lighter, soft color
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Brighter ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Softer directional light
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2); // Softer fill light
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Grid helper
    // const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    // scene.add(gridHelper);

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      '/assets/3DModel/ShapeKey Testing.glb',
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        modelRef.current = model;

        // Find all meshes with morph targets
        const meshesWithMorphTargets = [];
        model.traverse((child) => {
          if (child.isMesh && child.morphTargetInfluences) {
            meshesWithMorphTargets.push(child);
            console.log('Mesh with morph targets:', child.name);
            console.log('Morph targets:', child.morphTargetDictionary);
          }
        });

        // Setup animation mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model);
        }

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        
        model.scale.multiplyScalar(scale);
        
        // Recalculate box after scaling
        box.setFromObject(model);
        const scaledCenter = box.getCenter(new THREE.Vector3());
        model.position.x -= scaledCenter.x;
        model.position.y -= scaledCenter.y;
        model.position.z -= scaledCenter.z;

        console.log('Model loaded successfully');
        console.log('Model bounds:', box);
        console.log('Model size:', size);

        setLoadingProgress(100);
        if (onModelLoad) {
          onModelLoad(meshesWithMorphTargets);
        }
      },
      (xhr) => {
        const percent = (xhr.loaded / xhr.total * 100);
        setLoadingProgress(percent);
      },
      (error) => {
        console.error('Error loading model:', error);
        setLoadingError('Error loading model! Make sure ShapeKeyTesting.glb is in the public folder.');
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = clockRef.current.getDelta();
      
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onModelLoad]);

  // X-ray mode effect
  useEffect(() => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone material if it's shared to avoid affecting other objects
        if (!child.material.userData.isCloned) {
          child.material = child.material.clone();
          child.material.userData.isCloned = true;
        }

        if (xrayMode) {
          // Enable X-ray view
          child.material.transparent = true;
          child.material.opacity = 0.3;
          child.material.depthWrite = false;
          child.material.side = THREE.DoubleSide;
        } else {
          // Restore normal view
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
          child.material.side = THREE.FrontSide;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [xrayMode]);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      {loadingProgress < 100 && (
        <div className="absolute bottom-6 left-6 bg-dark-surface/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg border border-dark-border">
          <div className="flex items-center gap-3">
            {loadingError ? (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-400">{loadingError}</span>
              </div>
            ) : (
              <>
                <div className="w-32 h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{loadingProgress.toFixed(0)}%</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Instructions overlay */}
      <div className="absolute top-6 left-6 bg-blue-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg border border-dark-border max-w-xs">
        <h4 className="text-sm font-semibold mb-2 text-blue-400">Controls</h4>
        <ul className="text-xs space-y-1 text-gray-300">
          <li>• <span className="font-medium">Left Click + Drag:</span> Rotate</li>
          <li>• <span className="font-medium">Right Click + Drag:</span> Pan</li>
          <li>• <span className="font-medium">Scroll:</span> Zoom</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelViewer;
