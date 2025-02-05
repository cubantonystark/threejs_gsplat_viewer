// Importing necessary modules and components
import * as THREE from 'three';
import { GaussianSplatMesh } from '@zappar/three-gaussian-splat';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const { innerWidth, innerHeight } = window;
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.0001, 100000);
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Handling window resize events
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const controls = new OrbitControls(camera, renderer.domElement);

// Global variables to store the current splat mesh and text meshes
let splat;
let textMeshes = [];
let currentSplatUrl = null; // To store the current splat file URL

// Function to clear text and marker meshes
function clearMeshes() {
  textMeshes.forEach(({ textMesh, markerMesh }) => {
    if (textMesh) scene.remove(textMesh);
    if (markerMesh) scene.remove(markerMesh);
  });
  textMeshes = [];
}

// Function to handle loading and adding the Gaussian Splat Mesh
function loadSplat(fileUrl) {
  clearMeshes();
  if (splat) {
    scene.remove(splat);
  }
  currentSplatUrl = fileUrl; // Update the current splat URL
  splat = new GaussianSplatMesh(camera, renderer, fileUrl, Infinity);
  splat.load();

  splat.position.set(0, 0, 0);
  splat.scale.setScalar(1);
  scene.add(splat);

  reattachEventListeners();
}

// Grid helper floor (invisible)
const grid = new THREE.GridHelper(100, 100);
grid.visible = false;
scene.add(grid);

// Create a ground plane
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide, transparent: true, opacity: 0.01 });
const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
groundPlane.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
groundPlane.position.y = -0.1; // Position slightly below the Gaussian Splat
scene.add(groundPlane);

// Position the camera at a 45-degree angle with a slight zoom-out
camera.position.set(15, 15, 15);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.position.multiplyScalar(1.1);

let selectedMarker = null;
let offset = new THREE.Vector3();
let targetPosition = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const fontLoader = new FontLoader();

// Variables for mouse click counting
let clickCount = 0;
let clickTimeout;

// Function to handle three consecutive clicks
function handleThreeClicks(event) {
  clickCount++;
  clearTimeout(clickTimeout);

  if (clickCount === 3) {
    clickCount = 0;
    refresh();
  } else {
    clickTimeout = setTimeout(() => {
      clickCount = 0;
    }, 500); // Reset click count if not clicked three times within 500ms
  }
}

// Function to refresh the current splat file
function refresh() {
  if (currentSplatUrl) {
    loadSplat(currentSplatUrl);
  }
}

fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  window.addEventListener('dblclick', function (event) {
    if (!splat) return; // Do nothing if no splat file is loaded or displayed

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;

      const inputBox = document.createElement('input');
      inputBox.style.position = 'absolute';
      inputBox.style.left = `${event.clientX + 10}px`;
      inputBox.style.top = `${event.clientY + 10}px`;
      inputBox.style.padding = '10px';
      inputBox.style.fontSize = '16px';
      inputBox.style.border = '1px solid #ccc';
      inputBox.style.borderRadius = '10px';
      inputBox.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.1)';
      inputBox.style.outline = 'none';
      inputBox.style.transition = 'box-shadow 0.3s ease';
      inputBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      inputBox.placeholder = 'Enter text here...';
      document.body.appendChild(inputBox);

      const okButton = document.createElement('button');
      okButton.textContent = 'OK';
      okButton.style.position = 'absolute';
      okButton.style.left = `${event.clientX + 10 + inputBox.offsetWidth + 5}px`;
      okButton.style.top = `${event.clientY + 10}px`;
      okButton.style.padding = '10px 20px';
      okButton.style.fontSize = '16px';
      okButton.style.border = 'none';
      okButton.style.borderRadius = '10px';
      okButton.style.cursor = 'pointer';
      okButton.style.backgroundColor = '#4CAF50';
      okButton.style.color = 'white';
      okButton.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.1)';
      okButton.style.transition = 'background-color 0.3s ease';
      okButton.onmouseenter = () => okButton.style.backgroundColor = '#45a049';
      okButton.onmouseleave = () => okButton.style.backgroundColor = '#4CAF50';
      document.body.appendChild(okButton);

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.position = 'absolute';
      cancelButton.style.left = `${event.clientX + 10 + inputBox.offsetWidth + okButton.offsetWidth + 10}px`;
      cancelButton.style.top = `${event.clientY + 10}px`;
      cancelButton.style.padding = '10px 20px';
      cancelButton.style.fontSize = '16px';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '10px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.backgroundColor = '#f44336';
      cancelButton.style.color = 'white';
      cancelButton.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.1)';
      cancelButton.style.transition = 'background-color 0.3s ease';
      cancelButton.onmouseenter = () => cancelButton.style.backgroundColor = '#e53935';
      cancelButton.onmouseleave = () => cancelButton.style.backgroundColor = '#f44336';
      document.body.appendChild(cancelButton);

      okButton.addEventListener('click', function () {
        const text = inputBox.value.trim();
        if (text !== '') {
          const textGeometry = new TextGeometry(text, {
            font: font,
            size: 0.125 * 1.5, // 50% larger
            height: 0.05 * 1.5, // 50% larger
          });

          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);

          textMesh.scale.set(3, 3, 0.5 * 1.5); // 50% larger

          // Create the marker as a vertical line (cylinder) 10 pixels in length
          const markerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20, 32); // Small radius, 10 pixels height
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

          markerMesh.position.copy(point);
          markerMesh.position.y = groundPlane.position.y + 10; // Position the marker slightly above the ground plane
          markerMesh.rotation.x = Math.PI * 2; // Rotate the cylinder to be vertical
          markerMesh.userData.initialY = markerMesh.position.y; // Store the initial Y position
          positionTextAboveMarker(textMesh, markerMesh);

          scene.add(markerMesh);
          scene.add(textMesh);

          textMeshes.push({ textMesh, markerMesh });
        }

        inputBox.remove();
        okButton.remove();
        cancelButton.remove();
      });

      cancelButton.addEventListener('click', function () {
        inputBox.remove();
        okButton.remove();
        cancelButton.remove();
      });
    }
  });
});

// Mouse events for dragging
function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(textMeshes.map(item => item.markerMesh), true);

  if (intersects.length > 0) {
    selectedMarker = intersects[0].object;
    const intersectPoint = intersects[0].point;
    offset.copy(intersectPoint).sub(selectedMarker.position);
    controls.enabled = false;
  }
}

function onMouseMove(event) {
  if (selectedMarker) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundPlane);

    if (intersects.length > 0) {
      targetPosition.copy(intersects[0].point.sub(offset));
      selectedMarker.position.copy(targetPosition);
      selectedMarker.position.y = selectedMarker.userData.initialY; // Keep the initial Y position
      const textItem = textMeshes.find(item => item.markerMesh === selectedMarker);
      if (textItem) {
        positionTextAboveMarker(textItem.textMesh, selectedMarker);
      }
    }
  }
}

function onMouseUp() {
  selectedMarker = null;
  controls.enabled = true;
}

// Function to correctly position the text above the marker
function positionTextAboveMarker(textMesh, markerMesh) {
  if (!textMesh.geometry.boundingBox) {
    textMesh.geometry.computeBoundingBox();
  }
  const textSize = textMesh.geometry.boundingBox.getSize(new THREE.Vector3());

  textMesh.position.set(
    markerMesh.position.x - textSize.x / 2,
    markerMesh.position.y + 11, // Adjust height to be above the marker
    markerMesh.position.z
  );
}

// Animation loop for smoother dragging and text rotation
renderer.setAnimationLoop(animation);
controls.update();

function animation() {
  // Make all text meshes face the camera
  textMeshes.forEach(item => {
    item.textMesh.lookAt(camera.position);
  });

  if (splat) {
    splat.update();
  }
  renderer.render(scene, camera);
}

// Event listener for Esc key to open file dialog and Ctrl+R to refresh
window.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    openFileDialog();
  }
  if (event.key === 'r' && event.ctrlKey) {
    refresh();
  }
});

// Function to open file dialog
function openFileDialog() {
  const dialogContainer = document.createElement('div');
  dialogContainer.style.position = 'fixed';
  dialogContainer.style.top = '0';
  dialogContainer.style.left = '0';
  dialogContainer.style.width = '100vw';
  dialogContainer.style.height = '100vh';
  dialogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
  dialogContainer.style.display = 'flex';
  dialogContainer.style.justifyContent = 'center';
  dialogContainer.style.alignItems = 'center';
  document.body.appendChild(dialogContainer);

  const dialogBox = document.createElement('div');
  dialogBox.style.backgroundColor = 'white';
  dialogBox.style.padding = '20px';
  dialogBox.style.borderRadius = '10px';
  dialogBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  dialogContainer.appendChild(dialogBox);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.splat';
  dialogBox.appendChild(fileInput);

  const loadButton = document.createElement('button');
  loadButton.textContent = 'Load';
  loadButton.style.marginRight = '10px';
  loadButton.style.padding = '10px 20px';
  loadButton.style.fontSize = '16px';
  loadButton.style.border = 'none';
  loadButton.style.borderRadius = '10px';
  loadButton.style.cursor = 'pointer';
  loadButton.style.backgroundColor = '#4CAF50';
  loadButton.style.color = 'white';
  loadButton.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.1)';
  loadButton.style.transition = 'background-color 0.3s ease';
  loadButton.onmouseenter = () => loadButton.style.backgroundColor = '#45a049';
  loadButton.onmouseleave = () => loadButton.style.backgroundColor = '#4CAF50';
  dialogBox.appendChild(loadButton);

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.padding = '10px 20px';
  cancelButton.style.fontSize = '16px';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '10px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.backgroundColor = '#f44336';
  cancelButton.style.color = 'white';
  cancelButton.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.1)';
  cancelButton.style.transition = 'background-color 0.3s ease';
  cancelButton.onmouseenter = () => cancelButton.style.backgroundColor = '#e53935';
  cancelButton.onmouseleave = () => cancelButton.style.backgroundColor = '#f44336';
  dialogBox.appendChild(cancelButton);

  loadButton.addEventListener('click', function() {
    const file = fileInput.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      loadSplat(fileUrl);
      document.body.removeChild(dialogContainer);
    }
  });

  cancelButton.addEventListener('click', function() {
    document.body.removeChild(dialogContainer);
  });
}

// Function to reattach event listeners
function reattachEventListeners() {
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('click', handleThreeClicks, false);
}

// Attach initial event listeners
reattachEventListeners();

// Open file dialog immediately on script execution
openFileDialog();