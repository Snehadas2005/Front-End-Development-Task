import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Edit2, Save, X, Download, Upload, Menu } from 'lucide-react';
import mindmapDataJson from './data/mind-map.json';

const MindmapApp = () => {
  const [mindmapData, setMindmapData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', summary: '', description: '' });
  const [collapsed, setCollapsed] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const defaultMindmap = {
    id: "root",
    title: "Modern Web Development",
    summary: "Complete ecosystem of web technologies",
    description: "Comprehensive overview of modern web development including frontend frameworks, backend technologies, databases, and deployment strategies.",
    children: [
      {
        id: "frontend",
        title: "Frontend Development",
        summary: "Client-side technologies",
        description: "Frontend development focuses on creating user interfaces and experiences.",
        children: [
          {
            id: "react",
            title: "React",
            summary: "Component-based UI library",
            description: "React is a JavaScript library for building user interfaces.",
            children: []
          },
          {
            id: "vue",
            title: "Vue.js",
            summary: "Progressive framework",
            description: "Vue.js is an approachable framework for building web interfaces.",
            children: []
          }
        ]
      },
      {
        id: "backend",
        title: "Backend Development",
        summary: "Server-side logic",
        description: "Backend development handles server-side operations and business logic.",
        children: [
          {
            id: "nodejs",
            title: "Node.js",
            summary: "JavaScript runtime",
            description: "Node.js enables JavaScript execution on servers.",
            children: []
          },
          {
            id: "python",
            title: "Python",
            summary: "Versatile language",
            description: "Python offers frameworks like Django and Flask.",
            children: []
          }
        ]
      },
      {
        id: "devops",
        title: "DevOps",
        summary: "Infrastructure & CI/CD",
        description: "DevOps practices streamline development and operations.",
        children: [
          {
            id: "docker",
            title: "Docker",
            summary: "Containerization",
            description: "Docker packages applications into containers.",
            children: []
          }
        ]
      }
    ]
  };

  useEffect(() => {
    setMindmapData(mindmapDataJson);
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && mindmapData) {
        setShowSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPan({ x: rect.width / 2, y: 100 });
      }
    }, 100);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateLayout = (node, depth = 0, index = 0, parentX = 0, parentY = 0) => {
    if (!node) return [];
    
    const nodes = [];
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelGap = 180;
    const siblingGap = 60;
    
    const isCollapsed = collapsed.has(node.id);
    const visibleChildren = isCollapsed ? [] : (node.children || []);
    const childCount = visibleChildren.length;
    
    let x, y;
    if (depth === 0) {
      x = 0;
      y = 0;
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
    setScale(prev => Math.min(Math.max(prev * delta, 0.3), 2));
  };

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.closest('.mindmap-bg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(0.8);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: 100 });
    }
  };

  const toggleCollapse = (nodeId, e) => {
    e.stopPropagation();
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
        return { ...node, ...editForm };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };
    
    setMindmapData(prev => updateNode(prev));
    setEditingNode(null);
    if (selectedNode?.id === editingNode) {
      setSelectedNode({ ...selectedNode, ...editForm });
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(mindmapData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
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
          if (data.id && data.title) {
            setMindmapData(data);
            setCollapsed(new Set());
            setSelectedNode(null);
            resetView();
          }
        } catch (error) {
          alert('Error parsing JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!mindmapData) return null;

  const layoutNodes = calculateLayout(mindmapData);
  const edges = [];
  
  layoutNodes.forEach(node => {
    if (!node.collapsed && node.children) {
      node.children.forEach(child => {
        const childNode = layoutNodes.find(n => n.id === child.id);
        if (childNode) {
          edges.push({ from: node, to: childNode });
        }
      });
    }
  });

  const depthColors = ['#7575C8', '#E3F2FF', '#F3FFE3', '#FDE4F9', '#FFEEEB'];

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#E3E3FF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {isMobile && (
            <button onClick={() => setShowSidebar(!showSidebar)} style={iconBtnStyle}>
              <Menu size={20} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ 
              fontSize: isMobile ? '18px' : '24px', 
              fontWeight: '700', 
              color: '#2d2d2d',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Mindmap
            </h1>
            <p style={{ 
              fontSize: isMobile ? '11px' : '13px', 
              color: '#666',
              margin: '2px 0 0 0',
              display: isMobile ? 'none' : 'block'
            }}>
              Data-driven visualization
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setScale(s => Math.min(s * 1.2, 2))} style={iconBtnStyle} title="Zoom In">
            <ZoomIn size={isMobile ? 18 : 20} />
          </button>
          <button onClick={() => setScale(s => Math.max(s * 0.8, 0.3))} style={iconBtnStyle} title="Zoom Out">
            <ZoomOut size={isMobile ? 18 : 20} />
          </button>
          <button onClick={resetView} style={iconBtnStyle} title="Reset View">
            <Maximize2 size={isMobile ? 18 : 20} />
          </button>
          {!isMobile && <div style={{ width: '1px', background: '#e0e0e0', margin: '0 4px' }} />}
          <button onClick={exportData} style={{...primaryBtnStyle, padding: isMobile ? '8px 12px' : '10px 16px'}}>
            <Download size={isMobile ? 16 : 18} />
            {!isMobile && <span style={{ marginLeft: '8px' }}>Export</span>}
          </button>
          <label style={{ ...primaryBtnStyle, cursor: 'pointer', padding: isMobile ? '8px 12px' : '10px 16px' }}>
            <Upload size={isMobile ? 16 : 18} />
            {!isMobile && <span style={{ marginLeft: '8px' }}>Import</span>}
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas */}
        <div 
          ref={containerRef}
          style={{ 
            flex: 1, 
            overflow: 'hidden', 
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative'
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            style={{
              width: '100%',
              height: '100%',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s'
            }}
          >
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1"/>
              </filter>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
              const isSelected = selectedNode?.id === edge.from.id || selectedNode?.id === edge.to.id;
              return (
                <path
                  key={`edge-${i}`}
                  d={`M ${edge.from.x} ${edge.from.y + 40} L ${edge.to.x} ${edge.to.y - 40}`}
                  stroke={isSelected ? '#7575C8' : '#d0d0d0'}
                  strokeWidth={isSelected ? 3 : 2}
                  fill="none"
                  opacity={0.6}
                />
              );
            })}

            {/* Nodes */}
            {layoutNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode?.id === node.id;
              const hasChildren = node.children && node.children.length > 0;
              const bgColor = depthColors[node.depth % depthColors.length];

              return (
                <g key={node.id}>
                  <rect
                    x={node.x - 100}
                    y={node.y - 40}
                    width="200"
                    height="80"
                    rx="16"
                    fill={bgColor}
                    stroke={isSelected || isHovered ? '#7575C8' : 'transparent'}
                    strokeWidth={isSelected || isHovered ? 3 : 0}
                    filter="url(#shadow)"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setSelectedNode(node);
                      if (isMobile) setShowSidebar(true);
                    }}
                    onMouseEnter={() => !isMobile && setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />
                  
                  <text
                    x={node.x}
                    y={node.y - 8}
                    textAnchor="middle"
                    fill="#2d2d2d"
                    fontSize="16"
                    fontWeight="600"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.title.length > 20 ? node.title.substring(0, 18) + '...' : node.title}
                  </text>
                  
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fill="#666"
                    fontSize="12"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.summary.length > 24 ? node.summary.substring(0, 22) + '...' : node.summary}
                  </text>
                  
                  {hasChildren && (
                    <g onClick={(e) => toggleCollapse(node.id, e)} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={node.x}
                        cy={node.y + 40}
                        r="14"
                        fill="white"
                        stroke="#7575C8"
                        strokeWidth="2"
                      />
                      <text
                        x={node.x}
                        y={node.y + 40}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#7575C8"
                        fontSize="18"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.collapsed ? '+' : '−'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {!isMobile && hoveredNode && (
            <div style={{
              position: 'absolute',
              left: `${Math.min((hoveredNode.x * scale) + pan.x + 120, window.innerWidth - 320)}px`,
              top: `${(hoveredNode.y * scale) + pan.y}px`,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxWidth: '280px',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <div style={{ fontWeight: '600', color: '#2d2d2d', marginBottom: '8px' }}>
                {hoveredNode.title}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                {hoveredNode.summary}
              </div>
              {hoveredNode.description && (
                <div style={{ fontSize: '12px', color: '#999', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                  {hoveredNode.description.substring(0, 100)}...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {((!isMobile && selectedNode) || (isMobile && showSidebar && selectedNode)) && (
          <>
            {isMobile && (
              <div 
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 40,
                  animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={() => setShowSidebar(false)}
              />
            )}
            
            <div style={{
              position: isMobile ? 'fixed' : 'relative',
              right: 0,
              top: 0,
              bottom: 0,
              width: isMobile ? '100%' : '380px',
              maxWidth: isMobile ? '85%' : '380px',
              background: 'white',
              borderLeft: isMobile ? 'none' : '1px solid #e0e0e0',
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: isMobile ? '-4px 0 12px rgba(0,0,0,0.15)' : 'none',
              animation: isMobile ? 'slideInRight 0.3s ease-out' : 'none'
            }}>
              <div style={{ padding: isMobile ? '20px 16px' : '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ 
                      fontSize: isMobile ? '20px' : '24px', 
                      fontWeight: '700', 
                      color: '#2d2d2d',
                      margin: '0 0 8px 0',
                      wordBreak: 'break-word'
                    }}>
                      {selectedNode.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        background: '#E3F2FF', 
                        borderRadius: '20px',
                        color: '#666',
                        whiteSpace: 'nowrap'
                      }}>
                        Level {selectedNode.depth}
                      </span>
                      {selectedNode.children?.length > 0 && (
                        <span style={{ 
                          padding: '4px 12px', 
                          background: '#F3FFE3', 
                          borderRadius: '20px',
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}>
                          {selectedNode.children.length} children
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowSidebar(false)} style={{...iconBtnStyle, flexShrink: 0}}>
                    <X size={20} />
                  </button>
                </div>

                {editingNode === selectedNode.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Summary</label>
                      <textarea
                        value={editForm.summary}
                        onChange={(e) => setEditForm(p => ({ ...p, summary: e.target.value }))}
                        rows="3"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                        rows="5"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveEdit} style={{ ...primaryBtnStyle, flex: 1, justifyContent: 'center' }}>
                        <Save size={18} />
                        <span style={{ marginLeft: '8px' }}>Save</span>
                      </button>
                      <button onClick={() => setEditingNode(null)} style={secondaryBtnStyle}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={cardStyle}>
                      <h3 style={sectionTitleStyle}>Summary</h3>
                      <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
                        {selectedNode.summary}
                      </p>
                    </div>

                    {selectedNode.description && (
                      <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>Description</h3>
                        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                          {selectedNode.description}
                        </p>
                      </div>
                    )}

                    <button onClick={() => startEdit(selectedNode)} style={{ ...primaryBtnStyle, width: '100%', justifyContent: 'center' }}>
                      <Edit2 size={18} />
                      <span style={{ marginLeft: '8px' }}>Edit Node</span>
                    </button>

                    {selectedNode.children?.length > 0 && (
                      <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>Children ({selectedNode.children.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                          {selectedNode.children.map(child => (
                            <div
                              key={child.id}
                              onClick={() => {
                                const childNode = layoutNodes.find(n => n.id === child.id);
                                if (childNode) setSelectedNode(childNode);
                              }}
                              style={{
                                padding: '12px',
                                background: '#f8f8f8',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f8f8f8'}
                            >
                              <div style={{ fontWeight: '600', color: '#2d2d2d', fontSize: '14px' }}>
                                {child.title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                {child.summary}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const iconBtnStyle = {
  padding: '10px',
  background: '#f5f5f5',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  color: '#2d2d2d'
};

const primaryBtnStyle = {
  padding: '10px 16px',
  background: '#7575C8',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontWeight: '600',
  transition: 'all 0.2s'
};

const secondaryBtnStyle = {
  padding: '10px 16px',
  background: '#f5f5f5',
  color: '#2d2d2d',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.2s',
  flex: 1
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.2s'
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#2d2d2d',
  marginBottom: '8px'
};

const cardStyle = {
  padding: '16px',
  background: '#f8f8f8',
  borderRadius: '12px',
  border: '1px solid #f0f0f0'
};

const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#7575C8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 12px 0'
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @media (max-width: 768px) {
    svg text {
      font-size: 14px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default MindmapApp;