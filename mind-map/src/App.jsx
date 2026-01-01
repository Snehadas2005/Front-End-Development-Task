import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Edit2, Save, X, Plus, Trash2, Download, Upload, Menu, ChevronRight } from 'lucide-react';

const MindmapApp = () => {
  const [mindmapData, setMindmapData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', summary: '', description: '' });
  const [collapsed, setCollapsed] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const svgRef = useRef(null);

  const defaultMindmap = {
    id: "root",
    title: "Modern Web Development",
    summary: "Complete ecosystem of web technologies",
    description: "Comprehensive overview of modern web development including frontend frameworks, backend technologies, databases, and deployment strategies. This mindmap covers essential skills and tools for full-stack development.",
    metadata: {
      created: "2024-01-01",
      category: "Technology",
      level: "Intermediate"
    },
    children: [
      {
        id: "frontend",
        title: "Frontend Development",
        summary: "Client-side technologies and frameworks",
        description: "Frontend development focuses on creating user interfaces and experiences. It involves HTML, CSS, JavaScript, and modern frameworks to build interactive web applications.",
        metadata: { complexity: "Medium", popularity: "High" },
        children: [
          {
            id: "react",
            title: "React",
            summary: "Component-based UI library by Meta",
            description: "React is a JavaScript library for building user interfaces with reusable components, virtual DOM, and one-way data flow.",
            metadata: { version: "18.x", license: "MIT" },
            children: []
          },
          {
            id: "vue",
            title: "Vue.js",
            summary: "Progressive JavaScript framework",
            description: "Vue.js is an approachable, performant framework for building web interfaces with reactive data binding and composable components.",
            metadata: { version: "3.x", license: "MIT" },
            children: []
          },
          {
            id: "styling",
            title: "Styling",
            summary: "CSS frameworks and methodologies",
            description: "Modern styling approaches include Tailwind CSS, CSS Modules, Styled Components, and CSS-in-JS solutions.",
            metadata: { trending: "Tailwind CSS" },
            children: []
          }
        ]
      },
      {
        id: "backend",
        title: "Backend Development",
        summary: "Server-side logic and APIs",
        description: "Backend development handles server-side operations, business logic, database interactions, and API development.",
        metadata: { complexity: "High", scalability: "Critical" },
        children: [
          {
            id: "nodejs",
            title: "Node.js",
            summary: "JavaScript runtime for servers",
            description: "Node.js enables JavaScript execution on servers, providing non-blocking I/O and event-driven architecture for scalable applications.",
            metadata: { version: "20.x LTS", ecosystem: "npm" },
            children: []
          },
          {
            id: "python",
            title: "Python",
            summary: "Versatile backend language",
            description: "Python offers frameworks like Django and Flask for rapid backend development with clean syntax and extensive libraries.",
            metadata: { frameworks: "Django, Flask, FastAPI" },
            children: []
          },
          {
            id: "databases",
            title: "Databases",
            summary: "Data storage solutions",
            description: "Choose between SQL databases (PostgreSQL, MySQL) for structured data or NoSQL (MongoDB, Redis) for flexible schemas.",
            metadata: { types: "SQL, NoSQL, NewSQL" },
            children: []
          }
        ]
      },
      {
        id: "devops",
        title: "DevOps & Deployment",
        summary: "Infrastructure and CI/CD",
        description: "DevOps practices streamline development and operations through automation, monitoring, and continuous delivery pipelines.",
        metadata: { importance: "Critical", automation: "High" },
        children: [
          {
            id: "docker",
            title: "Docker",
            summary: "Containerization platform",
            description: "Docker packages applications with dependencies into containers for consistent deployment across environments.",
            metadata: { version: "24.x", orchestration: "Kubernetes" },
            children: []
          },
          {
            id: "cicd",
            title: "CI/CD Pipelines",
            summary: "Automated deployment workflows",
            description: "Continuous Integration and Deployment automate testing and deployment using tools like GitHub Actions, Jenkins, or GitLab CI.",
            metadata: { tools: "GitHub Actions, Jenkins, CircleCI" },
            children: []
          },
          {
            id: "cloud",
            title: "Cloud Platforms",
            summary: "AWS, Azure, GCP hosting",
            description: "Cloud platforms provide scalable infrastructure, managed services, and global deployment capabilities.",
            metadata: { providers: "AWS, Azure, GCP, Vercel" },
            children: []
          }
        ]
      }
    ]
  };

  useEffect(() => {
    setMindmapData(defaultMindmap);
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateLayout = (node, depth = 0, index = 0, parentX = 400, parentY = 80) => {
    if (!node) return [];
    
    const nodes = [];
    const nodeWidth = 180;
    const nodeHeight = 70;
    const levelGap = 160;
    const siblingGap = 50;
    
    const isCollapsed = collapsed.has(node.id);
    const visibleChildren = isCollapsed ? [] : (node.children || []);
    const childCount = visibleChildren.length;
    
    let x, y;
    if (depth === 0) {
      x = parentX;
      y = parentY;
    } else {
      y = parentY + levelGap;
      const totalWidth = childCount > 0 ? (childCount * nodeWidth) + ((childCount - 1) * siblingGap) : nodeWidth;
      const startX = parentX - totalWidth / 2;
      x = startX + (index * (nodeWidth + siblingGap)) + nodeWidth / 2;
    }
    
    nodes.push({ ...node, x, y, depth, collapsed: isCollapsed });
    
    if (!isCollapsed && node.children) {
      node.children.forEach((child, i) => {
        nodes.push(...calculateLayout(child, depth + 1, i, x, y));
      });
    }
    
    return nodes;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.2), 3));
  };

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.closest('.mindmap-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - pan.x, 
        y: e.touches[0].clientY - pan.y 
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      setPan({ 
        x: e.touches[0].clientX - dragStart.x, 
        y: e.touches[0].clientY - dragStart.y 
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleCollapse = (nodeId) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const startEdit = (node) => {
    setEditingNode(node.id);
    setEditForm({ 
      title: node.title, 
      summary: node.summary,
      description: node.description || ''
    });
  };

  const saveEdit = () => {
    const updateNode = (node) => {
      if (node.id === editingNode) {
        return { 
          ...node, 
          title: editForm.title, 
          summary: editForm.summary,
          description: editForm.description 
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };
    
    setMindmapData(prev => updateNode(prev));
    setEditingNode(null);
    if (selectedNode?.id === editingNode) {
      setSelectedNode({ 
        ...selectedNode, 
        title: editForm.title, 
        summary: editForm.summary,
        description: editForm.description 
      });
    }
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setEditForm({ title: '', summary: '', description: '' });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(mindmapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.id && data.title && data.children) {
            setMindmapData(data);
            setCollapsed(new Set());
            setSelectedNode(null);
            resetView();
          } else {
            alert('Invalid mindmap data format');
          }
        } catch (error) {
          alert('Error parsing JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!mindmapData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl animate-pulse">Loading mindmap...</div>
      </div>
    );
  }

  const layoutNodes = calculateLayout(mindmapData);
  const edges = [];
  
  layoutNodes.forEach(node => {
    if (!node.collapsed && node.children) {
      const parentNode = layoutNodes.find(n => n.id === node.id);
      node.children.forEach(child => {
        const childNode = layoutNodes.find(n => n.id === child.id);
        if (childNode) edges.push({ from: parentNode, to: childNode });
      });
    }
  });

  const depthColors = {
    0: { bg: "#6366f1", glow: "#818cf8" },
    1: "#8b5cf6",
    2: "#06b6d4",
    3: "#10b981",
    4: "#f59e0b"
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="glass-effect border-b border-white/10 shadow-2xl z-20">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Interactive Mindmap
              </h1>
              <p className="text-xs text-slate-400 hidden md:block">
                Data-driven visualization
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(s => Math.min(s * 1.2, 3))}
              className="btn-icon"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setScale(s => Math.max(s * 0.8, 0.2))}
              className="btn-icon"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={resetView}
              className="btn-icon"
              title="Fit to View"
            >
              <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="h-6 w-px bg-white/20 hidden md:block" />
            <button
              onClick={exportData}
              className="btn-primary hidden md:flex"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Export</span>
            </button>
            <label className="btn-primary cursor-pointer hidden md:flex">
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Import</span>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mindmap Canvas */}
        <div 
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <svg
            ref={svgRef}
            className="w-full h-full mindmap-background"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8"/>
              </linearGradient>
            </defs>

            {/* Edges with improved styling */}
            <g>
              {edges.map((edge, i) => {
                const isSelected = selectedNode?.id === edge.from.id || selectedNode?.id === edge.to.id;
                const midX = (edge.from.x + edge.to.x) / 2;
                const midY = (edge.from.y + edge.to.y) / 2;
                
                return (
                  <g key={`edge-${i}`}>
                    <path
                      d={`M ${edge.from.x} ${edge.from.y + 35} Q ${midX} ${midY} ${edge.to.x} ${edge.to.y - 35}`}
                      stroke={isSelected ? "#a78bfa" : "url(#edgeGradient)"}
                      strokeWidth={isSelected ? 3 : 2}
                      fill="none"
                      opacity={isSelected ? 1 : 0.4}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </g>

            {/* Nodes with enhanced design */}
            <g>
              {layoutNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const hasChildren = node.children && node.children.length > 0;
                const color = depthColors[node.depth] || "#6366f1";

                return (
                  <g key={node.id}>
                    {/* Node shadow */}
                    <rect
                      x={node.x - 88}
                      y={node.y - 28}
                      width="176"
                      height="66"
                      rx="12"
                      fill="rgba(0,0,0,0.3)"
                      className="transition-all duration-300"
                    />
                    
                    {/* Node background */}
                    <rect
                      x={node.x - 90}
                      y={node.y - 30}
                      width="180"
                      height="70"
                      rx="12"
                      fill={isSelected || isHovered ? color : "#1e293b"}
                      stroke={isHovered || isSelected ? color : "#475569"}
                      strokeWidth={isHovered || isSelected ? 3 : 2}
                      className="cursor-pointer transition-all duration-300"
                      filter={isSelected ? "url(#glow)" : ""}
                      onClick={() => {
                        setSelectedNode(node);
                        if (isMobile) setShowSidebar(true);
                      }}
                      onMouseEnter={() => !isMobile && setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    
                    {/* Node title */}
                    <text
                      x={node.x}
                      y={node.y - 5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="15"
                      fontWeight="700"
                      className="pointer-events-none select-none"
                    >
                      {node.title.length > 18 ? node.title.substring(0, 16) + '...' : node.title}
                    </text>
                    
                    {/* Node summary hint */}
                    <text
                      x={node.x}
                      y={node.y + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.6)"
                      fontSize="11"
                      className="pointer-events-none select-none"
                    >
                      {node.summary.length > 22 ? node.summary.substring(0, 20) + '...' : node.summary}
                    </text>
                    
                    {/* Collapse/Expand button */}
                    {hasChildren && (
                      <g
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(node.id);
                        }}
                      >
                        <circle
                          cx={node.x}
                          cy={node.y + 35}
                          r="12"
                          fill={color}
                          stroke="white"
                          strokeWidth="2"
                        />
                        <text
                          x={node.x}
                          y={node.y + 35}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="16"
                          fontWeight="bold"
                          className="pointer-events-none select-none"
                        >
                          {node.collapsed ? '+' : '−'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Desktop Hover Tooltip */}
          {!isMobile && hoveredNode && (
            <div 
              className="absolute glass-effect border border-white/20 rounded-xl p-4 shadow-2xl max-w-sm pointer-events-none z-10 animate-fade-in"
              style={{
                left: `${Math.min((hoveredNode.x * scale) + pan.x + 120, window.innerWidth - 300)}px`,
                top: `${(hoveredNode.y * scale) + pan.y}px`,
              }}
            >
              <div className="font-bold text-purple-300 mb-2 text-lg">{hoveredNode.title}</div>
              <div className="text-sm text-slate-300 mb-2">{hoveredNode.summary}</div>
              {hoveredNode.description && (
                <div className="text-xs text-slate-400 border-t border-white/10 pt-2 mt-2">
                  {hoveredNode.description.substring(0, 100)}...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        {showSidebar && selectedNode && (
          <>
            {isMobile && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                onClick={() => setShowSidebar(false)}
              />
            )}
            
            <div className={`${
              isMobile 
                ? 'fixed inset-y-0 right-0 w-full max-w-md z-40 animate-slide-in' 
                : 'relative w-96'
            } glass-effect border-l border-white/10 overflow-y-auto custom-scrollbar`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                      {selectedNode.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="px-2 py-1 bg-purple-500/20 rounded-full">
                        Level {selectedNode.depth}
                      </span>
                      {selectedNode.children?.length > 0 && (
                        <span className="px-2 py-1 bg-blue-500/20 rounded-full">
                          {selectedNode.children.length} children
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      setShowSidebar(!isMobile);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {editingNode === selectedNode.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-300">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="input-field"
                        placeholder="Enter title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-300">
                        Summary
                      </label>
                      <textarea
                        value={editForm.summary}
                        onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                        rows="3"
                        className="input-field"
                        placeholder="Enter summary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-purple-300">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows="5"
                        className="input-field"
                        placeholder="Enter detailed description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="btn-success flex-1"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="card-section">
                        <h3 className="section-title">Summary</h3>
                        <p className="text-slate-300 leading-relaxed">
                          {selectedNode.summary}
                        </p>
                      </div>

                      {selectedNode.description && (
                        <div className="card-section">
                          <h3 className="section-title">Description</h3>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {selectedNode.description}
                          </p>
                        </div>
                      )}

                      <div className="card-section">
                        <h3 className="section-title">Metadata</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-slate-400 text-sm">Node ID</span>
                            <span className="text-slate-300 font-mono text-xs bg-slate-700/50 px-2 py-1 rounded">
                              {selectedNode.id}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-slate-400 text-sm">Depth Level</span>
                            <span className="text-purple-400 font-semibold">
                              {selectedNode.depth}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-slate-400 text-sm">Children Count</span>
                            <span className="text-blue-400 font-semibold">
                              {selectedNode.children?.length || 0}
                            </span>
                          </div>
                          {selectedNode.metadata && Object.entries(selectedNode.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-2 border-b border-white/10">
                              <span className="text-slate-400 text-sm capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-slate-300 text-sm">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => startEdit(selectedNode)}
                        className="btn-primary w-full"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Node
                      </button>

                      {selectedNode.children && selectedNode.children.length > 0 && (
                        <div className="card-section">
                          <h3 className="section-title">Child Nodes ({selectedNode.children.length})</h3>
                          <div className="space-y-3 mt-4">
                            {selectedNode.children.map(child => (
                              <div
                                key={child.id}
                                className="card-child-node"
                                onClick={() => {
                                  const childNode = layoutNodes.find(n => n.id === child.id);
                                  if (childNode) setSelectedNode(childNode);
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-cyan-300 mb-1">
                                      {child.title}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      {child.summary}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom toolbar */}
      {isMobile && (
        <div className="glass-effect border-t border-white/10 p-3 flex items-center justify-around md:hidden">
          <button onClick={exportData} className="btn-icon" title="Export">
            <Download className="w-5 h-5" />
          </button>
          <label className="btn-icon cursor-pointer">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
          <button onClick={resetView} className="btn-icon" title="Reset View">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      )}

      <style jsx>{`
        .glass-effect {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .btn-icon {
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .btn-icon:active {
          transform: scale(0.95);
        }

        .btn-primary {
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          background: rgba(71, 85, 105, 0.5);
          transition: all 0.2s;
          font-weight: 600;
        }

        .btn-secondary:hover {
          background: rgba(71, 85, 105, 0.7);
        }

        .btn-success {
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-success:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
        }

        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 0.75rem;
          color: white;
          transition: all 0.2s;
          outline: none;
        }

        .input-field:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          background: rgba(30, 41, 59, 0.8);
        }

        .card-section {
          padding: 1rem;
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(71, 85, 105, 0.3);
          border-radius: 1rem;
        }

        .section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: rgb(192, 132, 252);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .card-child-node {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .card-child-node:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
          border-color: rgba(139, 92, 246, 0.4);
          transform: translateX(4px);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @media (max-width: 768px) {
          .btn-primary, .btn-secondary, .btn-success {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MindmapApp;