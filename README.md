# Three.js Gaussian Splat Viewer with Text Markers

This project demonstrates how to use Three.js to render a Gaussian Splat Mesh and interactive text markers. The application allows users to add markers with custom text to a 3D scene by double-clicking on the ground plane. The markers are represented as vertical lines, and the text is displayed above each marker. Users can also drag and drop the markers while maintaining their height. This project builds upon code from [Zappar](https://github.com/zappar-xr) and [Kevin Kwok (Antimatter15)](https://github.com/antimatter15)<br/>
## Features

- **Gaussian Splat Mesh**: Load and display a Gaussian Splat Mesh.
- **Interactive Text Markers**: Add, drag, and drop markers with custom text.
- **Responsive Design**: Adjusts to window resize events.
- **Styled Input Dialog**: User-friendly input dialog for entering marker text.

- **Keyboard Shortcuts**: 
  - `Esc`: Open file dialog to load a new splat file.
  - `Ctrl+R`: Refresh the current splat file.
    
- **Mouse Buttons**:
  - `Double click` to add a marker and name it.
  - `Right click and press` to drag and drop a created marker around the scene.  

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Installation

The project has been set up to use parcel for bundling assets and code. To get started, install the project's dependencies by running the following command:

```bash
npm install
```

During development, you can use the following command to run a `parcel` server for testing on your computer or a device on your local network:

```bash
npm run start
```

And when you're ready to publish your site, run the following command. The resulting `dist` folder can be uploaded for publishing.

```bash
npm run build
```
### Viewing

- **The Viewer assumes the Gaussian Splat is aligned to the ground plane. In case it is not, you can use [SuperSplat](https://playcanvas.com/supersplat/editor/) to align both position and rotation. For better results, scale the Gaussina Splat to between 3-5.**
- **Save the Gaussian Splat as a .splat file. I will include the ability to ingest .ply files and do the conversion in the viewer as time allows.**

### Viewer in Action

<table bordert="0">
<tbody>
  <tr>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/load_splat_front_page.png" height="35%" width="35%"></td>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/loaded_splat.png" height="35%" width="35%"></td>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/adding_marker.png" height="35%" width="35%"></td>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/adding_marker_1.png" height="35%" width="35%"></td>
  </tr>
  <tr>
    <td>Front page</td>
    <td>Loaded Splat</td>
    <td>Adding a marker</td>
    <td>Adding a marker</td>
  </tr>
  <tr>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/added_marker.png" alt="Added marker" height="35%" width="35%"></td>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/dragged_and_dropped_marker.png" alt="Marker drag and drop functionality" height="35%" width="35%"></td>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/additl_marker.png" alt="Adding more markers" height="35%" width="35%"></td>
    <td align="center"><img src="https://github.com/cubantonystark/threejs_gsplat_viewer/blob/main/screenshots/converting_from_.ply_to_.splat.png" alt="Converting from .ply to .splat file" height="35%" width="35%"></td>
  </tr>
  <tr>
    <td>Added marker</td>
    <td>Marker drag and drop functionality</td>
    <td>Adding more markers</td>
    <td>Converting from .ply to .splat file</td>
  </tr>
</tbody>
</table>

### Acknowledgments
This project was inspired by the expertise and code from:

[SuperSplat](https://playcanvas.com/supersplat/editor/)
[Zappar XR](https://github.com/zappar-xr)<br/>
[Kevin Kwok (antimatter15)](https://github.com/antimatter15)

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

### License
This project is licensed under the MIT License.
