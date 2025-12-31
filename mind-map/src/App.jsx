import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Edit2, Save, X, Sparkles } from 'lucide-react';

const MindmapApp = () => {
  const [mindmapData, setMindmapData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', summary: '' });
  const [collapsed, setCollapsed] = useState(new Set());
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const svgRef = useRef(null);

  const defaultMindmap = {
    id: "root",
    title: "Web Development",
    summary: "Modern web development encompasses frontend, backend, and full-stack technologies",
    children: [
      {
        id: "node-1",
        title: "Frontend",
        summary: "User interface and client-side development",
        children: [
          { id: "node-1-1", title: "React", summary: "Component-based UI library", children: [] },
          { id: "node-1-2", title: "Vue", summary: "Progressive JavaScript framework", children: [] },
          { id: "node-1-3", title: "CSS", summary: "Styling and layout", children: [] }
        ]
      },
      {
        id: "node-2",
        title: "Backend",
        summary: "Server-side logic and data management",
        children: [
          { id: "node-2-1", title: "Node.js", summary: "JavaScript runtime for servers", children: [] },
          { id: "node-2-2", title: "Python", summary: "Versatile backend language", children: [] },
          { id: "node-2-3", title: "Databases", summary: "Data storage solutions", children: [] }
        ]
      },
      {
        id: "node-3",
        title: "DevOps",
        summary: "Deployment and infrastructure management",
        children: [
          { id: "node-3-1", title: "Docker", summary: "Containerization platform", children: [] },
          { id: "node-3-2", title: "CI/CD", summary: "Continuous integration and deployment", children: [] }
        ]
      }
    ]
  };

  useEffect(() => {
    setMindmapData(defaultMindmap);
  }, []);

  const generateMindmap = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Generate a valid hierarchical mind map JSON for the topic: "${topic}".

Output ONLY valid JSON with this exact schema:
{
  "id": "root",
  "title": "<Main Topic>",
  "summary": "<Brief overview>",
  "children": [
    {
      "id": "node-1",
      "title": "<Subtopic>",
      "summary": "<Short explanation>",
      "children": []
    }
  ]
}

Rules:
- Each node needs: id (unique), title (short), summary (1-2 lines), children (array)
- Limit to 2-3 levels depth
- 3-5 main branches recommended
- Keep concise and clear
- Output ONLY the JSON, no markdown or extra text`
            }
          ],
        })
      });

      const data = await response.json();
      const text = data.content.map(item => item.type === "text" ? item.text : "").join("\n");
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed.id && parsed.title && parsed.children) {
          setMindmapData(parsed);
          setCollapsed(new Set());
          setSelectedNode(null);
          resetView();
        } else {
          throw new Error("Invalid structure");
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        alert("Failed to generate mindmap. Using default.");
        setMindmapData(defaultMindmap);
      }
    } catch (error) {
      console.error("API error:", error);
      alert("Failed to generate mindmap. Using default.");
      setMindmapData(defaultMindmap);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateLayout = (node, depth = 0, index = 0, parentX = 400, parentY = 50) => {
    if (!node) return [];
    
    const nodes = [];
    const nodeWidth = 160;
    const nodeHeight = 60;
    const levelGap = 150;
    const siblingGap = 40;
    
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
    setScale(prev => Math.min(Math.max(prev * delta, 0.3), 3));
  };

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.closest('.mindmap-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleCollapse = (nodeId) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const startEdit = (node) => {
    setEditingNode(node.id);
    setEditForm({ title: node.title, summary: node.summary });
  };

  const saveEdit = () => {
    const updateNode = (node) => {
      if (node.id === editingNode) {
        return { ...node, title: editForm.title, summary: editForm.summary };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };
    
    setMindmapData(prev => updateNode(prev));
    setEditingNode(null);
    if (selectedNode?.id === editingNode) {
      setSelectedNode({ ...selectedNode, title: editForm.title, summary: editForm.summary });
    }
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setEditForm({ title: '', summary: '' });
  };

  if (!mindmapData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-xl">Loading mindmap...</div>
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
        if (childNode) {
          edges.push({ from: parentNode, to: childNode });
        }
      });
    }
  });

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Mindmap Generator
          </h1>
          <div className="flex gap-2 flex-1 max-w-2xl">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateMindmap()}
              placeholder="Enter a topic (e.g., Artificial Intelligence, Solar System, Programming...)"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isGenerating}
            />
            <button
              onClick={generateMindmap}
              disabled={isGenerating || !topic.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScale(s => Math.min(s * 1.2, 3))} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => setScale(s => Math.max(s * 0.8, 0.3))} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={resetView} className="p-2 hover:bg-slate-700 rounded transition-colors" title="Fit to View">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mindmap Canvas */}
        <div 
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            className="w-full h-full mindmap-background"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center'
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            <g>
              {edges.map((edge, i) => {
                const isSelected = selectedNode?.id === edge.from.id || selectedNode?.id === edge.to.id;
                return (
                  <line
                    key={`edge-${i}`}
                    x1={edge.from.x}
                    y1={edge.from.y + 30}
                    x2={edge.to.x}
                    y2={edge.to.y - 30}
                    stroke={isSelected ? "#a78bfa" : "#475569"}
                    strokeWidth={isSelected ? 3 : 2}
                    opacity={isSelected ? 1 : 0.5}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {layoutNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const hasChildren = node.children && node.children.length > 0;
                const colorMap = {
                  0: "#8b5cf6",
                  1: "#06b6d4",
                  2: "#10b981",
                  3: "#f59e0b"
                };
                const color = colorMap[node.depth] || "#6366f1";

                return (
                  <g key={node.id}>
                    <rect
                      x={node.x - 80}
                      y={node.y - 30}
                      width="160"
                      height="60"
                      rx="8"
                      fill={isSelected ? color : "#1e293b"}
                      stroke={isHovered || isSelected ? color : "#475569"}
                      strokeWidth={isHovered || isSelected ? 3 : 2}
                      className="cursor-pointer transition-all"
                      filter={isSelected ? "url(#glow)" : ""}
                      onClick={() => {
                        setSelectedNode(node);
                        if (hasChildren) toggleCollapse(node.id);
                      }}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {node.title.length > 20 ? node.title.substring(0, 18) + '...' : node.title}
                    </text>
                    {hasChildren && (
                      <circle
                        cx={node.x}
                        cy={node.y + 25}
                        r="8"
                        fill={color}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(node.id);
                        }}
                      />
                    )}
                    {hasChildren && (
                      <text
                        x={node.x}
                        y={node.y + 25}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {node.collapsed ? '+' : '−'}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover Tooltip */}
          {hoveredNode && (
            <div 
              className="absolute bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl max-w-xs pointer-events-none z-10"
              style={{
                left: `${(hoveredNode.x * scale) + pan.x + 100}px`,
                top: `${(hoveredNode.y * scale) + pan.y}px`,
              }}
            >
              <div className="font-semibold text-purple-400 mb-1">{hoveredNode.title}</div>
              <div className="text-sm text-slate-300">{hoveredNode.summary}</div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        {selectedNode && (
          <div className="w-96 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-purple-400">{selectedNode.title}</h2>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingNode === selectedNode.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Summary</label>
                  <textarea
                    value={editForm.summary}
                    onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Summary</h3>
                  <p className="text-slate-200">{selectedNode.summary}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Node ID:</span>
                      <span className="text-slate-300">{selectedNode.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Depth Level:</span>
                      <span className="text-slate-300">{selectedNode.depth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Children:</span>
                      <span className="text-slate-300">{selectedNode.children?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startEdit(selectedNode)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Node
                </button>

                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">Child Nodes</h3>
                    <div className="space-y-2">
                      {selectedNode.children.map(child => (
                        <div
                          key={child.id}
                          className="p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            const childNode = layoutNodes.find(n => n.id === child.id);
                            if (childNode) setSelectedNode(childNode);
                          }}
                        >
                          <div className="font-medium text-cyan-400">{child.title}</div>
                          <div className="text-xs text-slate-400 mt-1">{child.summary}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MindmapApp;