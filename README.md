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

### Acknowledgments
This project was inspired by the expertise and code from:

[Zappar XR](https://github.com/zappar-xr)<br/>
[Kevin Kwok (antimatter15)](https://github.com/antimatter15)

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

### License
This project is licensed under the MIT License.
