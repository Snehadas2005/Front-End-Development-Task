# Mind Map - Data Driven Visualization

A professional hierarchical visualization tool built for the **Frontend Development Internship Assignment**. This project focuses on rendering complex data structures into an interactive, user-friendly mind map.

### 📁 Project Structure
```
mind-map/
├── public/
│   └── vite.svg
├── demo-images/                # Showcase of application features
│   ├── workspace-overview.png
│   ├── sidebar-details.png
│   ├── search-functionality.png
│   ├── add-new-node.png
│   └── color-palette.png
├── src/
│   ├── data/
│   │   └── mind-map.json       # Source of truth for mindmap data
│   ├── App.jsx                 # Main application logic & UI
│   ├── index.css               # Global design tokens
│   └── main.jsx                # Application entry point
├── index.html
├── package.json
└── README.md
```

## ✨ Key Features

*   **Recursive Engine**: Automatically calculates node positions based on hierarchical depth and sibling count.
*   **Interactive Canvas**: Smooth infinite panning and zooming (Ctrl + Scroll) for navigating large data sets.
*   **Draggable Nodes**: Reposition any node manually; connection lines (Bezier curves) update dynamically in real-time.
*   **Data Portability**: 
    - **Export**: Save your current layout and edits into a portable JSON file.
    - **Import**: Load external JSON data to reconstruct mind maps instantly.

## 🎨 UI/UX Features

*   **Smooth Animations**: Features staggered entry animations for sidebar elements and fluid transitions for canvas adjustments.
*   **Contextual Insight Tooltips**: Hover over any node to see metadata and quick summaries without clicking.
*   **Responsive Viewport**: The engine automatically centers the visualization on window resize for a consistent experience.
*   **Intuitive Controls**: High-contrast, bold design system with clear visual feedback for hover, select, and drag actions.
*   **Glassmorphic Design**: A modern, clean sidebar for deep metadata editing and focused research notes.

## 🛠️ Functional Capabilities

*   **Dynamic Creation**: Add new sub-concepts on the fly using the built-in "Add Node" functionality.
*   **Personalization**: Use the custom Color Palette to categorize or highlight specific nodes with different styles.
*   **Smart Search**: Instantly filter through the map; non-matching nodes dim to provide clear visual focus on search results.
*   **Node Management**: Fully integrated Edit and Delete (with recursive removal) capabilities for complete data control.
*   **Branch Management**: Expand or collapse entire branches with a single click to manage complex hierarchies.

## 📸 Application Demos

### 1. Interactive Workspace Overview
![Workspace Overview](demo-images/workspace-overview.png)

### 2. Detailed Node Information & Sidebar
![Sidebar Details](demo-images/sidebar-details.png)

### 3. Smart Search & Filter System
![Search Functionality](demo-images/search-functionality.png)

### 4. Dynamic Node Creation
![Add New Node](demo-images/add-new-node.png)

### 5. Customizable Color Themes
![Color Palette](demo-images/color-palette.png)

## 💻 Tech Stack

*   **React (Vite)** - For high-performance UI rendering and state management.
*   **SVG Layer** - Custom implementation for connections and canvas-based interactions.
*   **Lucide React** - Premium iconography.
*   **Vanilla CSS** - A custom design system built for speed and responsiveness.

## 🚀 Getting Started

1.  **Clone the project**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 📐 How it Works

The application takes a structured JSON input (`src/data/mind-map.json`) and passes it through a recursive layout engine. This engine calculates the absolute coordinates of every node while considering manual user-defined offsets. The rendering layer then draws curved paths between parents and children, ensuring a clear visual flow of information.

---
*Developed as part of a Frontend Engineering Assignment.*
