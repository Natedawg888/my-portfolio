// ModelViewerModal.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import styles from "./ModelViewerModal.module.css";

export default function ModelViewerModal({ src, title, onClose }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b3a2c);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.001,
      10000
    );
    camera.position.set(3, 2, 4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(6, 10, 8);
    scene.add(dir);

    const grid = new THREE.GridHelper(10, 20, 0x577a6a, 0x1a4a3a);
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    scene.add(grid);

    const url = /^(https?:|blob:|data:)/i.test(src)
      ? src
      : src?.startsWith("/")
      ? src
      : `/${src}`;
    let root; // model root

    const fitAndCenter = (object) => {
      object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      let radius = sphere.radius || 0.001;
      let center = sphere.center.clone();

      const desired = 2.5;
      const scale = desired / (radius * 2);
      object.scale.setScalar(scale);
      object.updateMatrixWorld(true);

      new THREE.Box3().setFromObject(object).getBoundingSphere(sphere);
      radius = sphere.radius;
      center = sphere.center;

      object.position.sub(center);
      object.updateMatrixWorld(true);

      const fov = THREE.MathUtils.degToRad(camera.fov);
      const dist = (radius / Math.sin(fov / 2)) * 1.35;
      const dirVec = new THREE.Vector3(1, 0.8, 1).normalize();
      camera.position.copy(new THREE.Vector3()).addScaledVector(dirVec, dist);
      camera.near = Math.max(0.001, radius / 500);
      camera.far = Math.max(1000, radius * 500);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();

      grid.scale.setScalar(Math.max(1, radius * 0.8));
    };

    const ext = url.toLowerCase().split(".").pop();
    if (ext === "glb" || ext === "gltf") {
      new GLTFLoader().load(
        url,
        (gltf) => {
          root = gltf.scene || gltf.scenes[0];
          scene.add(root);
          fitAndCenter(root);
        },
        undefined,
        (err) => console.error("GLTF load error:", err)
      );
    } else {
      new FBXLoader().load(
        url,
        (fbx) => {
          root = fbx;
          // Only replace material if missing
          root.traverse((o) => {
            if (o.isMesh && (!o.material || !o.material.isMaterial)) {
              o.material = new THREE.MeshStandardMaterial({ color: 0xdddddd });
            }
          });
          scene.add(root);
          fitAndCenter(root);
        },
        undefined,
        (err) => console.error("FBX load error:", err)
      );
    }

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (root) scene.remove(root);
      container.removeChild(renderer.domElement);
    };
  }, [src]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title || "Model Preview"}</h3>
          <button className={styles.close} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.viewer} ref={mountRef} />
      </div>
    </div>
  );
}
