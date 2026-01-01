import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Edit2, Save, X, Download, Upload, Trash2, Plus, Search, Settings, Star, Sparkles, Command, Info, Eye, Share2 } from 'lucide-react';
import mindmapDataJson from './data/mind-map.json';

/**
 * Hi! This is the main Mind Map app for the Frontend Internship Task.
 * It's built to handle big hierarchical data structures with stuff like
 * dragging, zooming, and full editing support.
 */
const MindmapApp = () => {
  // Keeping track of all the map data and UI states here
  const [mindmapData, setMindmapData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodeOffsets, setNodeOffsets] = useState({});
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', summary: '', description: '', notes: '' });
  const [collapsed, setCollapsed] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [nodeColors, setNodeColors] = useState({});
  const [showPalette, setShowPalette] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Load the initial data and center the view when the app starts
  useEffect(() => {
    setMindmapData(mindmapDataJson);
    const handleResize = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPan({ x: rect.width / 2, y: 240 });
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * [REQ] Recursive Layout Engine
   * This is where the magic happens. It calculates exactly where each node
   * should sit based on how deep it is in the tree and how many siblings it has.
   */
  const calculateLayout = (node, depth = 0, index = 0, parentX = 0, parentY = 0) => {
    if (!node) return [];
    
    const nodes = [];
    const nodeWidth = 320;
    const levelGap = 280;
    const siblingGap = 40;
    
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
    
    // Mix in the manual drag offsets so nodes stay where you put them
    const offset = nodeOffsets[node.id] || { x: 0, y: 0 };
    const finalX = x + offset.x;
    const finalY = y + offset.y;
    
    nodes.push({ ...node, x: finalX, y: finalY, depth, collapsed: isCollapsed });
    
    if (!isCollapsed && node.children) {
      node.children.forEach((child, i) => {
        nodes.push(...calculateLayout(child, depth + 1, i, finalX - offset.x, finalY - offset.y));
      });
    }
    
    return nodes;
  };

  /**
   * [REQ] Navigation Controls
   * Handling the scroll wheel for zooming and regular panning.
   */
  const handleWheel = (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.min(Math.max(prev * delta, 0.2), 3));
    } else {
        setPan(prev => ({
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY
        }));
    }
  };

  /**
   * [REQ] Interaction Management
   * Logic to figure out if we're dragging a specific node or just the whole canvas.
   */
  const handleMouseDown = (e) => {
    const isNode = e.target.closest('.node-card');
    const nodeId = isNode?.getAttribute('data-id');

    if (nodeId) {
        setDraggingNodeId(nodeId);
        setDragStart({ x: e.clientX, y: e.clientY });
        e.stopPropagation();
    } else if (e.button === 0 && (e.target.tagName === 'svg' || e.target.classList.contains('mindmap-bg'))) {
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (draggingNodeId) {
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;
        
        setNodeOffsets(prev => ({
            ...prev,
            [draggingNodeId]: {
                x: (prev[draggingNodeId]?.x || 0) + dx,
                y: (prev[draggingNodeId]?.y || 0) + dy
            }
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDraggingCanvas) {
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  const resetView = () => {
    setScale(0.8);
    setNodeOffsets({});
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: 240 });
    }
  };

  /**
   * [REQ] Hierarchical Logic
   * Toggle branches open or closed to keep the map manageable.
   */
  const toggleCollapse = (nodeId, e) => {
    e.stopPropagation();
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  /**
   * Adds a new child node to the currently selected node.
   */
  const addNode = () => {
    if (!selectedNode) {
      alert("Select a parent node first!");
      return;
    }
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      title: "New Concept",
      summary: "",
      description: "",
      notes: "",
      children: []
    };

    const insertNode = (parent) => {
      if (parent.id === selectedNode.id) {
        return { ...parent, children: [...(parent.children || []), newNode] };
      }
      if (parent.children) {
        return { ...parent, children: parent.children.map(insertNode) };
      }
      return parent;
    };

    setMindmapData(prev => insertNode(prev));
    setSelectedNode(newNode);
    setCollapsed(prev => {
      const next = new Set(prev);
      next.delete(selectedNode.id); // Auto-expand parent
      return next;
    });
  };

  const changeNodeColor = (color) => {
    if (selectedNode) {
      setNodeColors(prev => ({ ...prev, [selectedNode.id]: color }));
    }
  };

  /**
   * Removes a node (and all its children) from the chart.
   * Keeps the root node safe so the map doesn't break.
   */
  const deleteNode = (nodeId) => {
    if (nodeId === mindmapData.id) {
      alert("Oops! You can't delete the main root node.");
      return;
    }

    if (!window.confirm("Are you sure? This will delete this node and all its sub-nodes.")) {
      return;
    }

    const removeNode = (parent) => {
      if (!parent.children) return parent;
      
      // Check if the target is an immediate child
      const hasTarget = parent.children.some(child => child.id === nodeId);
      if (hasTarget) {
        return { ...parent, children: parent.children.filter(child => child.id !== nodeId) };
      }
      
      // Otherwise, look deeper
      return { ...parent, children: parent.children.map(removeNode) };
    };

    setMindmapData(prev => removeNode(prev));
    setSelectedNode(null);
  };

  /**
   * [REQ] CRUD Operations
   * Basic editing logic to update node details in the local state.
   */
  const startEdit = (node) => {
    setEditingNode(node.id);
    setEditForm({ 
      title: node.title, 
      summary: node.summary,
      description: node.description || '',
      notes: node.notes || ''
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

  /**
   * [REQ] Data Persistence: Export
   * Snapshots the whole map (including your manual moves) into a JSON file.
   */
  const exportData = () => {
    const addOffsetsToData = (node) => {
        const offset = nodeOffsets[node.id] || { x: 0, y: 0 };
        const newNode = { ...node, manualOffset: offset };
        if (node.children) {
            newNode.children = node.children.map(addOffsetsToData);
        }
        return newNode;
    };
    const finalData = addOffsetsToData(mindmapData);
    const dataStr = JSON.stringify(finalData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * [REQ] Data Persistence: Import
   * Lets you upload a JSON file to restore a previous map or load a new one.
   */
  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.id && data.title) {
            setMindmapData(data);
            const offsets = {};
            const extractOffsets = (node) => {
                if (node.manualOffset) offsets[node.id] = node.manualOffset;
                if (node.children) node.children.forEach(extractOffsets);
            };
            extractOffsets(data);
            setNodeOffsets(offsets);
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

  // Loading screen if data isn't ready yet
  if (!mindmapData) return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100vh', background: '#E3E3FF', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #7575C8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  /**
   * Hooking up the graph nodes and drawing the connection paths.
   */
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

  const pastelColors = ['#E3F2FF', '#F3FFE3', '#FDE4F9', '#FFEEEB'];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#E3E3FF', color: '#1A1A1A', overflow: 'hidden' }}>
      
      {/* Top Navbar with the app title and export/import actions */}
      <nav style={{ padding: '0 60px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderBottom: '1px solid #1A1A1A', zIndex: 100, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>Mind Map</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7575C8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
                Data Driven Visualization
            </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="primary-btn" onClick={exportData}><Download size={18} /><span>Export Data</span></button>
            <label className="secondary-btn"><Upload size={18} /><span>Import Data</span>
                <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </label>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        
        {/* Navigation Interface Controls */}
        <div style={{ position: 'absolute', left: '30px', top: '30px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 60 }}>
            {/* [NEW] Add Node & Palette controls before Zoom */}
            <button className="control-btn" style={{ background: '#7575C8', color: 'white' }} onClick={addNode} title="Add Sub-node to Selected">
                <Plus size={24} />
            </button>
            <div style={{ position: 'relative' }}>
                <button className={`control-btn ${showPalette ? 'active' : ''}`} onClick={() => setShowPalette(!showPalette)} title="Change Node Color">
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: selectedNode ? (nodeColors[selectedNode.id] || '#FFF') : '#CCC', border: '2px solid #1A1A1A' }} />
                </button>
                {showPalette && (
                    <div className="palette-popup">
                        {['#E3F2FF', '#F3FFE3', '#FDE4F9', '#FFEEEB', '#FFE5A0', '#D0F4DE', '#FFD6E0', '#C1E1C1'].map(c => (
                            <div 
                                key={c} 
                                onClick={() => { changeNodeColor(c); setShowPalette(false); }}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: '1px solid #1A1A1A' }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div style={{ height: '4px' }} /> {/* Spacer */}

            <button className="control-btn" onClick={() => setScale(s => Math.min(s * 1.2, 3))} title="Zoom In"><ZoomIn size={24} /></button>
            <button className="control-btn" onClick={() => setScale(s => Math.max(s * 0.8, 0.2))} title="Zoom Out"><ZoomOut size={24} /></button>
            <button className="control-btn" onClick={resetView} title="Reset View & Positions"><Maximize2 size={24} /></button>
        </div>

        <Star size={40} color="#7575C8" style={{ position: 'absolute', right: '10%', top: '15%', opacity: 0.2 }} />
        <Sparkles size={30} color="#7575C8" style={{ position: 'absolute', left: '15%', bottom: '20%', opacity: 0.2 }} />

        {/* [REQ] Global search bar to highlight specific nodes */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '30px', zIndex: 50, width: '400px' }}>
            <div className="search-box">
                <Search size={20} color="#555" />
                <input 
                    type="text" placeholder="Search node titles or content..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: 500 }}
                />
                {searchQuery && <X size={18} style={{ cursor: 'pointer', color: '#999' }} onClick={() => setSearchQuery('')} />}
            </div>
        </div>

        {/* [REQ] The main canvas area where we render the SVG map */}
        <div 
          ref={containerRef}
          style={{ flex: 1, overflow: 'hidden', cursor: draggingNodeId ? 'grabbing' : (isDraggingCanvas ? 'grabbing' : 'grab'), position: 'relative' }}
          onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        >
          <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}>
            <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transition: (isDraggingCanvas || draggingNodeId) ? 'none' : 'transform 0.1s ease-out' }}>
                <rect width="10000" height="10000" x="-5000" y="-5000" fill="#E3E3FF" className="mindmap-bg" />

                {/* Draw those nice curved connection lines */}
                {edges.map((edge, i) => {
                  const isRelated = selectedNode?.id === edge.from.id || selectedNode?.id === edge.to.id;
                  const isHoverRelated = hoveredNode?.id === edge.from.id || hoveredNode?.id === edge.to.id;
                  
                  return (
                    <path
                      key={`edge-${i}`}
                      d={`M ${edge.from.x} ${edge.from.y + 80} C ${edge.from.x} ${edge.from.y + 180}, ${edge.to.x} ${edge.to.y - 180}, ${edge.to.x} ${edge.to.y - 80}`}
                      stroke={isRelated || isHoverRelated ? '#7575C8' : '#1A1A1A'}
                      strokeWidth={(isRelated || isHoverRelated) ? 4 : 2}
                      fill="none" opacity={(isRelated || isHoverRelated) ? 0.8 : 0.2}
                      style={{ transition: 'none' }}
                    />
                  );
                })}

                {/* Time to render the node cards themselves */}
                {layoutNodes.map((node, idx) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNode?.id === node.id;
                  const isDragging = draggingNodeId === node.id;
                  const hasChildren = node.children && node.children.length > 0;
                  const bgColor = pastelColors[idx % pastelColors.length];
                  
                  const isMatch = searchQuery && (
                    node.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    node.summary.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  const isRoot = node.depth === 0;

                  return (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                      <foreignObject x="-160" y="-80" width="320" height="160" style={{ overflow: 'visible' }}>
                        <div 
                          data-id={node.id} onClick={() => setSelectedNode(node)}
                          onMouseEnter={() => setHoveredNode(node)} onMouseLeave={() => setHoveredNode(null)}
                          className={`node-card ${isSelected ? 'selected' : ''} ${isMatch ? 'matched' : ''} ${isDragging ? 'dragging' : ''}`}
                          style={{
                            background: nodeColors[node.id] || bgColor,
                            opacity: (searchQuery && !isMatch) ? 0.15 : ((selectedNode && !isSelected && !isHovered) ? 0.6 : 1),
                            zIndex: isDragging || isMatch ? 1000 : 1,
                            boxShadow: isMatch ? '0 0 20px rgba(117, 117, 200, 0.4), 0 8px 0 #1A1A1A' : undefined,
                            border: isMatch ? '3px solid #7575C8' : '1px solid #1A1A1A',
                            scale: isMatch ? '1.05' : '1',
                          }}
                        >
                            <div className="card-icon-wrap"><div className="card-icon">{isRoot ? <Command size={16} /> : <Settings size={16} />}</div></div>
                            <header style={{ marginBottom: '12px' }}>
                                <div className="node-tag"><Sparkles size={10} /><span>{isRoot ? 'ROOT' : `LEVEL ${node.depth}`}</span></div>
                                <h3 className="node-title">{node.title}</h3>
                            </header>
                            
                            {node.summary ? (
                                <p className="node-summary">{node.summary}</p>
                            ) : (
                                <div className="empty-placeholder-lines">
                                    <div className="p-line" style={{ width: '100%' }} />
                                    <div className="p-line" style={{ width: '70%' }} />
                                    <div className="p-line" style={{ width: '40%' }} />
                                </div>
                            )}

                            {(hasChildren || node.collapsed) && (
                                <div onClick={(e) => toggleCollapse(node.id, e)} className="collapse-btn" style={{ cursor: 'pointer' }}>{node.collapsed ? '+' : '-'}</div>
                            )}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
            </g>
          </svg>

          {/* [REQ] Quick tooltip when you hover over a node */}
          {hoveredNode && !selectedNode && !draggingNodeId && !searchQuery && (
            <div className="hover-tooltip" style={{ left: `${Math.min(hoveredNode.x * scale + pan.x + 160, window.innerWidth - 320)}px`, top: `${hoveredNode.y * scale + pan.y - 120}px` }}>
                <div className="tooltip-header"><Info size={16} color="#7575C8" /><span>Quick Insight</span></div>
                <h4>{hoveredNode.title}</h4>
                <p>{hoveredNode.summary}</p>
                <div className="tooltip-footer">
                    <div className="node-tag" style={{ background: '#F3FFE3' }}>{hoveredNode.children?.length || 0} Sub-nodes</div>
                </div>
            </div>
          )}
        </div>

        {/* [REQ] Sidebar: Here's where we show the detailed info and editing form */}
        <aside style={{
            position: 'fixed', right: 0, top: '90px', bottom: 0, width: selectedNode ? '480px' : '0',
            background: 'white', borderLeft: selectedNode ? '1px solid #1A1A1A' : 'none',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', overflowY: 'auto', overflowX: 'hidden',
            zIndex: 1000, scrollBehavior: 'smooth', boxShadow: selectedNode ? '-20px 0 50px rgba(0,0,0,0.1)' : 'none',
            pointerEvents: selectedNode ? 'auto' : 'none', backgroundColor: 'white'
        }}>
            {selectedNode && (
                <div style={{ padding: '60px 48px 150px 48px', width: '100%', maxWidth: '480px', boxSizing: 'border-box' }}>
                    <header className="sidebar-header">
                        <div>
                            <div className="node-tag" style={{ marginBottom: '16px' }}><Star size={12} /><span>Entity Details</span></div>
                            <h2 className="sidebar-title">{selectedNode.title}</h2>
                        </div>
                        <button className="close-btn" onClick={() => setSelectedNode(null)}><X size={24} /></button>
                    </header>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        {editingNode === selectedNode.id ? (
                            <div className="edit-form">
                                <div className="input-group"><label>TITLE</label><input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} /></div>
                                <div className="input-group"><label>SUMMARY</label><textarea rows={3} value={editForm.summary} onChange={e => setEditForm(p => ({ ...p, summary: e.target.value }))} /></div>
                                <div className="input-group"><label>DETAILED DESCRIPTION</label><textarea rows={5} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
                                <div className="input-group"><label>RESEARCH NOTES</label><textarea rows={3} value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} /></div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button className="primary-btn" onClick={saveEdit} style={{ flex: 1 }}><Save size={20} /> Save Changes</button>
                                    <button className="secondary-btn" onClick={() => setEditingNode(null)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <section className="sidebar-section">
                                    <div className="section-divider"><h3>OVERVIEW</h3><div className="line" /></div>
                                    <p className="summary-text">{selectedNode.summary}</p>
                                </section>

                                {selectedNode.description && (
                                    <section className="sidebar-section">
                                        <div className="section-divider"><h3>DETAILED SPEC</h3><div className="line" /></div>
                                        <div className="desc-box"><p>{selectedNode.description}</p></div>
                                    </section>
                                )}

                                {selectedNode.notes && (
                                    <section className="sidebar-section">
                                        <div className="section-divider"><h3>RESEARCH NOTES</h3><div className="line" /></div>
                                        <p className="notes-text">"{selectedNode.notes}"</p>
                                    </section>
                                )}

                                <div className="sidebar-section" style={{ display: 'flex', gap: '16px' }}>
                                    <button className="primary-btn" style={{ flex: 1, justifyContent: 'center', padding: '16px' }} onClick={() => startEdit(selectedNode)}><Edit2 size={20} /><span>Edit Entity</span></button>
                                    <button className="delete-btn" onClick={() => deleteNode(selectedNode.id)}><Trash2 size={20} color="#e11d48" /></button>
                                </div>

                                {selectedNode.children?.length > 0 && (
                                    <section className="sidebar-section">
                                        <div className="section-divider"><h3>HIERARCHY ({selectedNode.children.length})</h3><div className="line" /></div>
                                        <div className="hierarchy-list">
                                            {selectedNode.children.map((child, i) => (
                                                <div 
                                                    key={child.id} onClick={() => { const n = layoutNodes.find(ln => ln.id === child.id); if (n) setSelectedNode(n); }}
                                                    className="hierarchy-item" style={{ background: pastelColors[i % pastelColors.length] }}
                                                >
                                                    <div className="item-title">{child.title}</div>
                                                    <div className="item-summary">{child.summary}</div>
                                                    <div className="item-icon"><Maximize2 size={16} /></div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </aside>
      </div>

    <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        /* [REQ] Just some styling for the sidebar scrollbar and nice entry animations */
        aside::-webkit-scrollbar { width: 8px; }
        aside::-webkit-scrollbar-track { background: #F1F1FB; border-left: 1px solid #1A1A1A; }
        aside::-webkit-scrollbar-thumb { background: #7575C8; border: 2px solid #F1F1FB; border-radius: 10px; }
        aside::-webkit-scrollbar-thumb:hover { background: #5A5A9E; }

        .palette-popup {
            position: absolute;
            left: 60px;
            top: 0;
            background: white;
            border: 1px solid #1A1A1A;
            border-radius: 12px;
            padding: 12px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            animation: fadeIn 0.2s ease-out;
        }

        .empty-placeholder-lines {
            display: flex;
            flex-direction: column;
            gap: 8px;
            opacity: 0.3;
        }
        .p-line {
            height: 4px;
            background: #1A1A1A;
            border-radius: 2px;
        }

        .sidebar-section { animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; margin-bottom: 60px; }
        .sidebar-section:nth-child(1) { animation-delay: 0.1s; }
        .sidebar-section:nth-child(2) { animation-delay: 0.2s; }
        .sidebar-section:nth-child(3) { animation-delay: 0.3s; }
        .sidebar-section:nth-child(4) { animation-delay: 0.4s; }
        .sidebar-section:nth-child(5) { animation-delay: 0.5s; }

        .primary-btn, .secondary-btn, .control-btn, .close-btn, .delete-btn {
            border: 1px solid #1A1A1A; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: white; box-shadow: 0 4px 0 #1A1A1A;
        }
        .primary-btn { padding: 10px 20px; }
        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #1A1A1A; }
        .secondary-btn { padding: 10px 20px; }
        .secondary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #1A1A1A; }
        .control-btn { width: 50px; height: 50px; justify-content: center; padding: 0; }
        .control-btn:hover { transform: scale(1.05); }
        .close-btn { padding: 12px; box-shadow: 0 2px 0 #1A1A1A; }
        .delete-btn { padding: 16px; background: #FFEEEB; }

        .node-tag { background: rgba(255,255,255,0.6); padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(0,0,0,0.05); }
        .status-tag { display: flex; align-items: center; gap: 8px; background: #F3FFE3; padding: 8px 16px; border-radius: 30px; border: 1px solid #1A1A1A; font-weight: 800; font-size: 0.8rem; }
        .status-tag .dot { width: 8px; height: 8px; background: #4ADE80; border-radius: 50%; border: 1px solid #1A1A1A; animation: pulse 2s infinite; }

        .node-card { width: 100%; height: 100%; border: 1px solid #1A1A1A; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; text-align: left; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 0 #1A1A1A; position: relative; user-select: none; }
        .node-card:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #1A1A1A; }
        .node-card.selected { transform: translateY(-4px); box-shadow: 0 8px 0 #1A1A1A; border-color: #7575C8; }
        .node-card.matched { border-color: #7575C8; transform: translateY(-6px) scale(1.02); }
        .node-card.dragging { transform: scale(1.05) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important; z-index: 1000; }
        
        .card-icon-wrap { position: absolute; top: 12px; right: 12px; }
        .card-icon { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #1A1A1A; background: white; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
        .node-title { font-size: 1.25rem; font-weight: 800; margin: 0; color: #1A1A1A; line-height: 1.2; }
        .node-summary { font-size: 0.9rem; color: #555; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; margin: 0; }
        .collapse-btn { position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; background: white; border: 1px solid #1A1A1A; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; z-index: 10; box-shadow: 0 2px 0 #1A1A1A; }

        .search-box { background: white; border: 1px solid #1A1A1A; border-radius: 30px; padding: 12px 24px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 0 #1A1A1A; transition: all 0.3s; }
        .search-box:focus-within { transform: translateY(-2px); box-shadow: 0 6px 0 #7575C8; border-color: #7575C8; }

        .hover-tooltip { position: absolute; padding: 24px; background: white; border: 1px solid #1A1A1A; border-radius: 20px; box-shadow: 0 8px 0 #1A1A1A; z-index: 200; width: 280px; pointer-events: none; animation: slideUp 0.15s ease-out; }
        .tooltip-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .tooltip-header span { font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .hover-tooltip h4 { font-weight: 800; margin: 0 0 8px 0; }
        .hover-tooltip p { font-size: 0.85rem; color: #555; margin: 0; line-height: 1.5; }
        .tooltip-footer { margin-top: 16px; display: flex; gap: 8px; }

        .sidebar-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .sidebar-title { font-size: 2.5rem; font-weight: 800; line-height: 1.1; }
        .section-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .section-divider h3 { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #999; margin: 0; }
        .section-divider .line { flex: 1; height: 1px; background: #EEE; }
        .summary-text { font-size: 1.15rem; line-height: 1.6; font-weight: 500; }
        .desc-box { background: #F9F9F9; padding: 28px; border-radius: 20px; border: 1px solid #EEE; }
        .desc-box p { font-size: 1.05rem; line-height: 1.7; color: #444; margin: 0; }
        .notes-text { font-size: 1.05rem; line-height: 1.6; color: #666; font-style: italic; margin: 0; }
        .hierarchy-list { display: flex; flex-direction: column; gap: 16px; }
        .hierarchy-item { padding: 20px 24px; border: 1px solid #1A1A1A; border-radius: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 0 #1A1A1A; position: relative; }
        .hierarchy-item:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #1A1A1A; }

        /* [REQ] Styling for the edit forms to make them pop! */
        .edit-form { display: flex; flex-direction: column; gap: 24px; }
        .input-group label { display: block; font-weight: 700; margin-bottom: 12px; font-size: 0.85rem; color: #1A1A1A; letter-spacing: 0.05em; text-transform: uppercase; }
        .input-group input, .input-group textarea { 
            width: 100%; padding: 16px; border: 1px solid #1A1A1A; border-radius: 16px; font-size: 1.1rem; 
            font-family: inherit; box-sizing: border-box; background: #F9F9F9; transition: all 0.2s;
        }
        .input-group input:focus, .input-group textarea:focus {
            background: white; outline: none; border-color: #7575C8; box-shadow: 0 4px 0 #7575C8; transform: translateY(-2px);
        }
        .input-group textarea { resize: vertical; min-height: 100px; }
    `}</style>
    </div>
  );
};

export default MindmapApp;