# Three.js Gaussian Splat Viewer with Text Markers

This project demonstrates how to use Three.js to render a Gaussian Splat Mesh and interactive text markers. The application allows users to add markers with custom text to a 3D scene by double-clicking on the ground plane. The markers are represented as vertical lines, and the text is displayed above each marker. Users can also drag and drop the markers while maintaining their height.

## Features

- **Gaussian Splat Mesh**: Load and display a Gaussian Splat Mesh.
- **Interactive Text Markers**: Add, drag, and drop markers with custom text.
- **Responsive Design**: Adjusts to window resize events.
- **Styled Input Dialog**: User-friendly input dialog for entering marker text.
- **Keyboard Shortcuts**: 
  - `Esc`: Open file dialog to load a new splat file.
  - `Ctrl+R`: Refresh the current splat file.

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/cubantonystark/threejs_gsplat_viewer.git
   cd threejs_gsplat_viewer

### Install the dependencies:

```npm install
```
```javascript
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
}```
