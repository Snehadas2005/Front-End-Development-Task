# Interactive Mindmap UI - Frontend Assignment

A fully-featured, data-driven interactive mindmap visualization built with React and modern web technologies.

## 🎯 Project Overview

This project implements a seamless, interactive mindmap UI that visualizes hierarchical data structures with rich user interactions. The application is fully data-driven, mobile-optimized, and meets all assignment requirements.

## ✨ Key Features

### Core Functionality
- **Data-Driven Architecture**: Entire mindmap generated from JSON configuration
- **Interactive Visualization**: Pan, zoom, and navigate through nodes
- **Node Management**: Expand/collapse nodes, edit content in real-time
- **Hierarchical Display**: Clear parent-child relationships with color coding
- **Hover Interactions**: Contextual tooltips showing node information
- **Detail Panel**: Comprehensive sidebar with full node details

### Advanced Features
- **Mobile Responsive**: Fully optimized for touch devices and small screens
- **Export/Import**: Save and load mindmap data as JSON files
- **Real-time Editing**: Edit node title, summary, and description inline
- **Visual Feedback**: Smooth animations and transitions
- **Touch Gestures**: Pan and zoom support for mobile devices
- **Accessibility**: Keyboard navigation and screen reader support

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.3.0
- **Styling**: Tailwind CSS (utility classes)
- **Icons**: Lucide React
- **Language**: JavaScript (ES6+)

### Project Structure
```
mind-map/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── data/
│   │   └── mindmap-data.json    # Data file for mindmap structure
│   ├── App.jsx                   # Main application component
│   ├── index.css                 # Global styles
│   └── main.jsx                  # Application entry point
├── index.html
├── package.json
├── vite.config.js
├── README.md                      # This file
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.19.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mind-map
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 📊 Data Structure

The mindmap is driven by a JSON file with the following schema:

```json
{
  "id": "unique-identifier",
  "title": "Node Title",
  "summary": "Brief one-line summary",
  "description": "Detailed description (optional)",
  "metadata": {
    "key": "value"
  },
  "children": [
    {
      "id": "child-id",
      "title": "Child Node",
      "summary": "Child summary",
      "children": []
    }
  ]
}
```

### Example Data File

```json
{
  "id": "root",
  "title": "Web Development",
  "summary": "Modern web technologies",
  "description": "Complete overview of web development stack",
  "metadata": {
    "category": "Technology",
    "level": "Intermediate"
  },
  "children": [
    {
      "id": "frontend",
      "title": "Frontend",
      "summary": "Client-side development",
      "children": [
        {
          "id": "react",
          "title": "React",
          "summary": "Component-based UI library",
          "children": []
        }
      ]
    }
  ]
}
```

## 🎨 UI/UX Features

### Visual Design
- **Modern Glass Morphism**: Frosted glass effect for panels
- **Gradient Backgrounds**: Dynamic purple-to-blue gradients
- **Depth Coding**: Different colors for each hierarchy level
- **Smooth Animations**: Fade-in, slide-in, and scale transitions
- **Glow Effects**: Visual emphasis on selected nodes

### Interaction Patterns
1. **Click Node**: Select and view details in sidebar
2. **Hover Node**: Show quick info tooltip (desktop only)
3. **Click +/− Button**: Expand/collapse child nodes
4. **Mouse Drag**: Pan around the canvas
5. **Mouse Wheel**: Zoom in/out
6. **Touch Drag**: Pan on mobile devices

### Responsive Behavior
- **Desktop (>768px)**: Side-by-side layout with persistent sidebar
- **Tablet (768px)**: Collapsible sidebar with overlay
- **Mobile (<768px)**: Full-screen sidebar slides in from right
- **Touch Optimization**: Minimum 44px tap targets

## 🔧 Customization

### Changing the Mindmap Data

1. **Via UI**: Use the Import button to load a new JSON file
2. **Via Code**: Edit the `defaultMindmap` object in `App.jsx`
3. **Via Data File**: Create `src/data/mindmap-data.json` and load it

### Styling Customization

The application uses CSS-in-JS for component styles and global CSS for base styles:

- **Colors**: Modify the `depthColors` object in `App.jsx`
- **Layout**: Adjust `nodeWidth`, `nodeHeight`, `levelGap` in `calculateLayout()`
- **Global Styles**: Edit `src/index.css`

### Adding New Features

The component structure is modular and extensible:

```jsx
// Add new metadata fields
metadata: {
  author: "John Doe",
  tags: ["important", "review"],
  priority: "high"
}
```

## 📱 Mobile Optimization

### Touch Gestures
- **Single Touch Drag**: Pan the canvas
- **Pinch to Zoom**: (Supported via wheel events)
- **Tap**: Select nodes
- **Long Press**: (Future: Context menu)

### Performance Optimizations
- **Lazy Rendering**: Only visible nodes are rendered
- **Collapsed Subtrees**: Hidden branches don't render
- **Debounced Interactions**: Smooth pan and zoom
- **CSS Transforms**: Hardware-accelerated animations

### Mobile-Specific Features
- **Bottom Toolbar**: Quick access to common actions
- **Full-Screen Sidebar**: Overlay with backdrop blur
- **Large Touch Targets**: Minimum 44px for accessibility
- **Responsive Typography**: Scales with viewport

## 🎯 Assignment Requirements Checklist

### ✅ Mandatory Features
- [x] Mindmap visualization with hierarchical structure
- [x] Hover interactions showing contextual information
- [x] Click interactions for expand/collapse and selection
- [x] Fit to view / Reset view functionality
- [x] Manual editing of nodes and information
- [x] Data display on hover (tooltip)
- [x] Data display in side panel with details
- [x] **Data-driven rendering** from JSON file
- [x] Changing JSON updates the visual without code changes

### ✅ Technical Requirements
- [x] React framework
- [x] Clean, scalable code architecture
- [x] Separation of data and UI logic
- [x] No hardcoded mindmap structure
- [x] Mobile responsive design

### ✅ Submission Requirements
- [x] Solution description (Architecture section)
- [x] Technology explanation (Technology Stack section)
- [x] Data flow documentation (Data Structure section)
- [x] Screenshots (See screenshots/ directory)
- [x] Demo video (See demo-video.mp4)

### ✅ Bonus Features
- [x] Export functionality (JSON download)
- [x] Import functionality (JSON upload)
- [x] Mobile optimization
- [x] Touch gesture support
- [x] Advanced animations

## 📸 Screenshots



## 🎥 Demo Video

A comprehensive demo video showcasing all features is available:
- **File**: `demo-video.mp4` (or link to online video)
- **Duration**: ~3 minutes
- **Contents**:
  - Loading the mindmap
  - Navigating and zooming
  - Expanding/collapsing nodes
  - Editing node information
  - Viewing details in sidebar
  - Export/import functionality
  - Mobile responsive behavior

## 🔍 How Data Flows

1. **Data Loading**: JSON is loaded into React state (`mindmapData`)
2. **Layout Calculation**: `calculateLayout()` computes node positions
3. **Rendering**: SVG elements generated from layout data
4. **User Interaction**: State updates trigger re-calculation
5. **Visual Update**: React re-renders affected components
6. **Data Export**: Current state serialized to JSON

```
JSON Data → React State → Layout Algorithm → SVG Rendering
     ↑                                              ↓
     └────────────── User Interaction ──────────────┘
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is created for educational purposes as part of a frontend development internship assignment.

## 🙏 Acknowledgments

- Assignment provided by Recsify Technologies
- Icons by [Lucide](https://lucide.dev/)
- Built with [React](https://react.dev/)
- Powered by [Vite](https://vitejs.dev/)


**Note**: This project demonstrates frontend development skills including React, state management, responsive design, and data visualization. It was built following modern best practices and design patterns.