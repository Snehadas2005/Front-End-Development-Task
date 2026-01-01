# Mind Map - Data Driven Visualization

A professional hierarchical visualization tool built for the **Frontend Development Internship Assignment**. This project focuses on rendering complex data structures into an interactive, user-friendly mind map.

## ✨ Key Features

*   **Recursive Engine**: Automatically calculates node positions based on hierarchical depth and sibling count.
*   **Interactive Canvas**: Smooth infinite panning and zooming (Ctrl + Scroll) for navigating large data sets.
*   **Draggable Nodes**: Reposition any node manually; connection lines (Bezier curves) update dynamically in real-time.
*   **Deep Customization**: 
    - **Expand/Collapse**: Toggle branches to simplify the view.
    - **Search**: Instantly find and highlight nodes by title or summary.
    - **Live Editing**: Modify node content (Title, Summary, Notes) directly via the side panel.
*   **Data Portability**: 
    - **Export**: Save your current layout and edits into a portable JSON file.
    - **Import**: Load external JSON data to reconstruct mind maps instantly.

## 🛠️ Tech Stack

*   **React (Vite)** - For high-performance UI rendering and state management.
*   **SVG Layer** - Custom implementation for connections and canvas-based interactions.
*   **Lucide React** - Premium iconography.
*   **Vanilla CSS** - A custom design system built for speed and responsiveness.

## � Getting Started

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
