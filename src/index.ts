// Importing necessary modules and components
import * as THREE from 'three';
import { GaussianSplatMesh } from '@zappar/three-gaussian-splat';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

const { innerWidth, innerHeight } = window;
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.0001, 100000);
const scene = new THREE.Scene();

// Create a group for all rendered content for easier XR manipulation.
const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
// Enable WebXR capability
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
document.body.appendChild(renderer.domElement);

// Handling window resize events
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const controls = new OrbitControls(camera, renderer.domElement);

// Global variables to store the current splat mesh, text/marker meshes, and font
let splat;
let textMeshes = [];
let currentSplatUrl = null;     // Stores the current splat file URL
let currentSplatFileName = null; // Stores the splat file's name (e.g. "example.splat")
let loadedFont = null;          // Will store the loaded font

// Container for the list of available .splat files
const splatListContainer = document.createElement('div');
splatListContainer.style.position = 'absolute';
splatListContainer.style.top = '10px';
splatListContainer.style.right = '10px';
splatListContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
splatListContainer.style.padding = '10px';
splatListContainer.style.borderRadius = '5px';
splatListContainer.style.maxHeight = '300px';
splatListContainer.style.overflowY = 'auto';
splatListContainer.style.fontFamily = 'Arial, sans-serif';
splatListContainer.style.fontSize = '14px';
splatListContainer.style.color = '#333';
splatListContainer.innerHTML = "<strong>Available .splat Files</strong><br/>";
document.body.appendChild(splatListContainer);

// Function to update the list of available .splat files from the server
async function updateSplatList() {
  try {
    // Assumes an API endpoint that returns a JSON object with an array of file names.
    // Example response: { "files": ["example1.splat", "example2.splat"] }
    const res = await fetch('/splats/list.json');
    if (!res.ok) throw new Error("Failed to fetch splat list");
    const data = await res.json();
    renderSplatList(data.files || []);
  } catch (err) {
    console.error("Error fetching splat list:", err);
  }
}

// Render the list into the splatListContainer element.
function renderSplatList(files) {
  splatListContainer.innerHTML = "<strong>Available .splat Files</strong><br/>";
  if (files.length === 0) {
    splatListContainer.innerHTML += "<em>No files found</em>";
    return;
  }
  const ul = document.createElement('ul');
  ul.style.listStyleType = "none";
  ul.style.paddingLeft = "0";
  files.forEach(file => {
    const li = document.createElement('li');
    li.style.padding = "5px 0";
    li.style.cursor = "pointer";
    li.textContent = file;
    li.onclick = () => {
      // Set the global current splat file name and load the file from the /splats folder.
      currentSplatFileName = file;
      const fileUrl = `/splats/${file}`;
      loadSplat(fileUrl);
    };
    ul.appendChild(li);
  });
  splatListContainer.appendChild(ul);
}

// Periodically refresh the file list every 10 seconds.
setInterval(updateSplatList, 10000);
updateSplatList();

// Function to clear text and marker meshes
function clearMeshes() {
  textMeshes.forEach(({ textMesh, markerMesh }) => {
    if (textMesh) sceneGroup.remove(textMesh);
    if (markerMesh) sceneGroup.remove(markerMesh);
  });
  textMeshes = [];
}

// Function to handle loading and adding the Gaussian Splat Mesh
function loadSplat(fileUrl) {
  clearMeshes();
  if (splat) {
    sceneGroup.remove(splat);
  }
  currentSplatUrl = fileUrl; // Update the current splat URL
  splat = new GaussianSplatMesh(camera, renderer, fileUrl, Infinity);
  splat.load();
  splat.position.set(0, 0, 0);
  splat.scale.setScalar(1);
  sceneGroup.add(splat);
  reattachEventListeners();

  // --- Automatic JSON loading for markers ---
  if (currentSplatFileName) {
    const baseName = currentSplatFileName.split('.').slice(0, -1).join('.') || currentSplatFileName;
    let jsonUrl = "";
    // If loaded from a blob, assume same directory as page, else replace file name in the URL.
    if (currentSplatUrl.startsWith("blob:")) {
      let pageUrl = window.location.href.split("?")[0].split("#")[0];
      const lastSlash = pageUrl.lastIndexOf('/');
      if (lastSlash !== -1) {
        pageUrl = pageUrl.substring(0, lastSlash + 1);
      }
      jsonUrl = pageUrl + baseName + ".json";
    } else {
      jsonUrl = currentSplatUrl.replace(currentSplatFileName, baseName + ".json");
    }
    fetch(jsonUrl)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("JSON file not found");
      })
      .then(jsonData => {
        console.log("Automatically loaded markers from:", jsonUrl);
        loadMarkersFromJson(jsonData);
      })
      .catch(err => console.log("No markers JSON file found automatically", err));
  }
}

// Grid helper floor (invisible)
const grid = new THREE.GridHelper(100, 100);
grid.visible = false;
sceneGroup.add(grid);

// Create a ground plane for marker placement
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xcccccc,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.01
});
const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -0.1;
sceneGroup.add(groundPlane);

// Position the camera at a 45-degree angle with a slight zoom-out
camera.position.set(15, 15, 15);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.position.multiplyScalar(1.1);

// Variables for non-XR mouse marker controls
let selectedMarker = null;
let offset = new THREE.Vector3();
let targetPosition = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const fontLoader = new FontLoader();

// Variables for mouse click counting (for refreshing splat on triple click)
let clickCount = 0;
let clickTimeout;

function handleThreeClicks(event) {
  clickCount++;
  clearTimeout(clickTimeout);
  if (clickCount === 3) {
    clickCount = 0;
    refresh();
  } else {
    clickTimeout = setTimeout(() => {
      clickCount = 0;
    }, 500);
  }
}

function refresh() {
  if (currentSplatUrl) {
    loadSplat(currentSplatUrl);
  }
}

// Load the font and store it globally for markers.
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
  loadedFont = font;
  // --- Non-XR Double-click for manual marker placement ---
  window.addEventListener('dblclick', function (event) {
    if (!splat) return;
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
      document.body.appendChild(cancelButton);
      okButton.addEventListener('click', function () {
        const text = inputBox.value.trim();
        if (text !== '') {
          const textGeometry = new TextGeometry(text, {
            font: loadedFont,
            size: 0.1875, // 0.125 * 1.5
            height: 0.075   // 0.05  * 1.5
          });
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.scale.set(3, 3, 0.75);
          const markerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20, 32);
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
          markerMesh.position.copy(point);
          markerMesh.position.y = groundPlane.position.y + 10;
          markerMesh.userData.initialY = markerMesh.position.y;
          markerMesh.userData.markerName = text;
          positionTextAboveMarker(textMesh, markerMesh);
          sceneGroup.add(markerMesh);
          sceneGroup.add(textMesh);
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

// Mouse events for dragging markers
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
      selectedMarker.position.y = selectedMarker.userData.initialY;
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
    markerMesh.position.y + 11,
    markerMesh.position.z
  );
}

// --- XR Gesture Controls ---
// Manage XR gestures to translate and rotate the sceneGroup in the XR environment.
// Variables for XR gestures
let isGrabbing = false;
let initialControllerPosition = new THREE.Vector3();
let initialSceneGroupPosition = new THREE.Vector3();
let isRotating = false;
let initialControllerQuaternion = new THREE.Quaternion();
let initialSceneGroupQuaternion = new THREE.Quaternion();

// Variables for XR click detection
let xrSelectStartTime = 0;
let xrStartPosition = new THREE.Vector3();
let lastXRClickTime = 0;
const MAX_CLICK_DURATION = 200;      // Maximum duration (ms) to consider as a click
const MAX_CLICK_DISTANCE = 0.03;     // Maximum movement to consider as a stationary click (world units)
const DOUBLE_CLICK_INTERVAL = 300;   // Interval (ms) for double-click detection

// Retrieve the XR controller and add event listeners
const xrController = renderer.xr.getController(0);
xrController.addEventListener('selectstart', onXRGrabStart);
xrController.addEventListener('selectend', onXRGrabEnd);
xrController.addEventListener('squeezestart', onXRSqueezeStart);
xrController.addEventListener('squeezeend', onXRSqueezeEnd);
sceneGroup.add(xrController);

function onXRGrabStart() {
  isGrabbing = true;
  xrSelectStartTime = performance.now();
  xrController.matrixWorld.decompose(xrStartPosition, new THREE.Quaternion(), new THREE.Vector3());
  // Store initial positions for translation
  xrController.matrixWorld.decompose(initialControllerPosition, new THREE.Quaternion(), new THREE.Vector3());
  initialSceneGroupPosition.copy(sceneGroup.position);
}

function onXRGrabEnd() {
  isGrabbing = false;
  const xrSelectEndTime = performance.now();
  const duration = xrSelectEndTime - xrSelectStartTime;
  let currentPos = new THREE.Vector3();
  xrController.matrixWorld.decompose(currentPos, new THREE.Quaternion(), new THREE.Vector3());
  const movementDistance = currentPos.distanceTo(xrStartPosition);
  // If the select was a quick tap with minimal movement, treat it as a click/double-click.
  if (duration < MAX_CLICK_DURATION && movementDistance < MAX_CLICK_DISTANCE) {
    const now = performance.now();
    if (now - lastXRClickTime < DOUBLE_CLICK_INTERVAL) {
      lastXRClickTime = 0; // Reset double click detection
      handleXRDoubleClick();
    } else {
      handleXRClick();
      lastXRClickTime = now;
    }
  }
}

function onXRSqueezeStart() {
  isRotating = true;
  xrController.matrixWorld.decompose(new THREE.Vector3(), initialControllerQuaternion, new THREE.Vector3());
  initialSceneGroupQuaternion.copy(sceneGroup.quaternion);
}

function onXRSqueezeEnd() {
  isRotating = false;
}

function updateXRGestures() {
  if (isGrabbing) {
    const currentControllerPos = new THREE.Vector3();
    xrController.matrixWorld.decompose(currentControllerPos, new THREE.Quaternion(), new THREE.Vector3());
    const delta = new THREE.Vector3().subVectors(currentControllerPos, initialControllerPosition);
    // Translate the sceneGroup based on controller movement
    sceneGroup.position.copy(initialSceneGroupPosition).add(delta);
  }
  if (isRotating) {
    const currentControllerQuat = new THREE.Quaternion();
    xrController.matrixWorld.decompose(new THREE.Vector3(), currentControllerQuat, new THREE.Vector3());
    const deltaQuat = currentControllerQuat.multiply(initialControllerQuaternion.clone().invert());
    sceneGroup.quaternion.copy(deltaQuat.multiply(initialSceneGroupQuaternion));
  }
}

// XR click handlers using raycasting from controller to the groundPlane
function handleXRClick() {
  const controllerPosition = new THREE.Vector3();
  const controllerQuaternion = new THREE.Quaternion();
  xrController.matrixWorld.decompose(controllerPosition, controllerQuaternion, new THREE.Vector3());
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(controllerQuaternion);
  raycaster.set(controllerPosition, direction);
  const intersects = raycaster.intersectObject(groundPlane);
  if (intersects.length > 0) {
    const point = intersects[0].point;
    createXRMarker(point, "XR Marker (click)");
  }
}

function handleXRDoubleClick() {
  const controllerPosition = new THREE.Vector3();
  const controllerQuaternion = new THREE.Quaternion();
  xrController.matrixWorld.decompose(controllerPosition, controllerQuaternion, new THREE.Vector3());
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(controllerQuaternion);
  raycaster.set(controllerPosition, direction);
  const intersects = raycaster.intersectObject(groundPlane);
  if (intersects.length > 0) {
    const point = intersects[0].point;
    createXRMarker(point, "XR Marker (double-click)");
  }
}

function createXRMarker(point, label) {
  if (!loadedFont) return;
  const textGeometry = new TextGeometry(label, {
    font: loadedFont,
    size: 0.1875,
    height: 0.075
  });
  const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  const markerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20, 32);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
  markerMesh.position.copy(point);
  markerMesh.position.y = groundPlane.position.y + 10;
  markerMesh.userData.initialY = markerMesh.position.y;
  markerMesh.userData.markerName = label;
  positionTextAboveMarker(textMesh, markerMesh);
  sceneGroup.add(markerMesh);
  sceneGroup.add(textMesh);
  textMeshes.push({ textMesh, markerMesh });
}

// Animation loop
renderer.setAnimationLoop(animation);
function animation() {
  updateXRGestures();
  textMeshes.forEach(item => {
    item.textMesh.lookAt(camera.position);
  });
  if (splat) {
    splat.update();
  }
  renderer.render(scene, camera);
  controls.update();
}

// Event listeners for keyboard controls
window.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    openFileDialog();
  }
  if (event.key === 'r' && event.ctrlKey) {
    refresh();
  }
});
window.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveMarkers();
  }
});

// Function to open file dialog for loading a .splat file
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
  dialogBox.appendChild(cancelButton);
  loadButton.addEventListener('click', function() {
    const file = fileInput.files[0];
    if (file) {
      currentSplatFileName = file.name;
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
reattachEventListeners();
openFileDialog();

// --- Save Markers Function ---
function saveMarkers() {
  if (!currentSplatFileName) {
    alert("No splat file loaded!");
    return;
  }
  const baseName = currentSplatFileName.split('.').slice(0, -1).join('.') || currentSplatFileName;
  const markerData = textMeshes.map(item => {
    return {
      name: item.markerMesh.userData.markerName,
      coordinates: {
        x: item.markerMesh.position.x,
        y: item.markerMesh.position.y,
        z: item.markerMesh.position.z
      }
    };
  });
  const json = JSON.stringify({ markers: markerData }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Loading Markers from JSON ---
function loadMarkersFromJson(jsonData) {
  if (!jsonData.markers || !Array.isArray(jsonData.markers)) {
    console.error("Invalid JSON file structure. Expected an object with a 'markers' array.");
    return;
  }
  clearMeshes();
  jsonData.markers.forEach(marker => {
    addMarkerFromJson(marker);
  });
}

function addMarkerFromJson(markerData) {
  if (!loadedFont) {
    console.error("Font not loaded yet!");
    return;
  }
  const textGeometry = new TextGeometry(markerData.name, {
    font: loadedFont,
    size: 0.1875, // 0.125 * 1.5
    height: 0.075   // 0.05  * 1.5
  });
  const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.scale.set(3, 3, 0.75);
  const markerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20, 32);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
  if (markerData.coordinates) {
    markerMesh.position.set(markerData.coordinates.x, markerData.coordinates.y, markerData.coordinates.z);
  } else {
    markerMesh.position.set(0, groundPlane.position.y + 10, 0);
  }
  markerMesh.userData.initialY = markerMesh.position.y;
  markerMesh.userData.markerName = markerData.name;
  positionTextAboveMarker(textMesh, markerMesh);
  sceneGroup.add(markerMesh);
  sceneGroup.add(textMesh);
  textMeshes.push({ textMesh, markerMesh });
}

// --- Drag-and-Drop for JSON Marker Files ---
window.addEventListener('dragover', function(event) {
  event.preventDefault();
}, false);
window.addEventListener('drop', function(event) {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.name.toLowerCase().endsWith('.json')) {
      if (!currentSplatFileName) {
        alert("Please load a .splat file first.");
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonData = JSON.parse(e.target.result);
          loadMarkersFromJson(jsonData);
        } catch (error) {
          console.error("Error parsing dropped JSON file:", error);
        }
      }
      reader.readAsText(file);
    }
  }
}, false);
