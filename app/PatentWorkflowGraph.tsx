"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  FlaskConical,
  Target,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  GitFork,
  Layers,
  Info,
  Building,
  ArrowRight,
  RefreshCw,
  X,
  Maximize2,
  Lock,
} from "lucide-react";

type Graph = {
  nodes: Node[];
  edges: any[];
};

// Helper parser to extract structured chemical & therapeutic similarity details
function parsePatentDetails(data: any) {
  const explanation = data?.explanation || "";
  const chemicalFromExplanation = explanation.match(/Chemical Overlap:\s*([^\n]+(?:\n(?!Therapeutic|Patent|Risk)[^\n]+)*)/i)?.[1]?.trim();
  const therapeuticFromExplanation = explanation.match(/Therapeutic Overlap:\s*([^\n]+(?:\n(?!Patent|Risk)[^\n]+)*)/i)?.[1]?.trim();
  const typeFromExplanation = explanation.match(/Patent Type:\s*([^\n]+)/i)?.[1]?.trim();
  const riskFromExplanation = explanation.match(/Risk Level:\s*([^\n]+)/i)?.[1]?.trim();

  // Primary summary is text before Chemical Overlap
  const summaryPart = explanation.split(/Chemical Overlap:/i)[0]?.trim();

  return {
    chemical: data?.chemicalOverlap || chemicalFromExplanation || "Moderate chemical class and scaffold similarity identified.",
    therapeutic: data?.therapeuticOverlap || therapeuticFromExplanation || "Overlapping biological mechanism or target disease profile.",
    patentType: data?.patentType || typeFromExplanation || "Composition of Matter",
    riskLevel: data?.riskLevel || riskFromExplanation || "Medium",
    summary: summaryPart || data?.details || "AI matched relevant patent reference.",
  };
}

// ReactFlow Custom Graph Node (Memoized outside render)
const GraphNode = React.memo(function GraphNode({ data, selected }: { data: any; selected: boolean }) {
  const isIdea = data.kind === "idea";

  if (isIdea) {
    return (
      <div className={`relative min-w-[240px] max-w-[280px] rounded-xl border-2 px-5 py-4 shadow-2xl transition-all ${
        selected ? "border-cyan-400 ring-4 ring-cyan-500/30" : "border-cyan-500/60"
      } bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-950 text-white`}>
        <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 opacity-0" />
        <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 opacity-0" />
        <Handle type="target" id="left" position={Position.Left} className="!bg-cyan-400 opacity-0" />
        <Handle type="source" id="right" position={Position.Right} className="!bg-cyan-400 opacity-0" />

        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 border border-cyan-500/40">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Your Innovation
          </span>
          <span title="Fixed neat layout">
            <Lock className="h-3 w-3 text-cyan-400/60" />
          </span>
        </div>
        <div className="text-base font-bold text-slate-100">{data.label}</div>
        {data.subtitle && <div className="mt-1 text-xs font-mono text-cyan-200/80 truncate">{data.subtitle}</div>}
        {data.details && <div className="mt-2 text-[11px] leading-relaxed text-slate-300 line-clamp-2">{data.details}</div>}
      </div>
    );
  }

  const parsed = parsePatentDetails(data);
  const score = data.relevanceScore ?? 80;

  const scoreColor =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score >= 60
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <div className={`relative min-w-[220px] max-w-[260px] rounded-xl border px-4 py-3.5 shadow-lg transition-all ${
      selected
        ? "border-cyan-400 ring-4 ring-cyan-500/30 bg-slate-900 text-white scale-105"
        : "border-slate-800 bg-slate-950/95 text-slate-100 hover:border-slate-700"
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 opacity-0" />
      <Handle type="target" id="left" position={Position.Left} className="!bg-cyan-400 opacity-0" />
      <Handle type="source" id="right" position={Position.Right} className="!bg-cyan-400 opacity-0" />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-mono text-xs font-bold text-cyan-300 truncate">{data.label}</span>
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>
          {score}% Match
        </span>
      </div>

      <div className="text-xs font-semibold leading-snug text-slate-200 line-clamp-2">{data.title || data.details}</div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
        <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-medium border border-slate-700/50">{parsed.patentType}</span>
        {data.assignee && (
          <span className="truncate max-w-[110px] text-slate-400 font-medium" title={data.assignee}>
            • {data.assignee}
          </span>
        )}
      </div>
    </div>
  );
});

// Static nodeTypes object defined outside render to prevent ReactFlow warning
const nodeTypes = { graph: GraphNode };

const LEGEND_ITEMS = [
  { label: "High Relevance Match", color: "#10b981", type: "high", desc: "Top ranked patent candidate with high similarity score" },
  { label: "AI Semantic Match", color: "#06b6d4", type: "semantic", desc: "Contextual similarity based on multi-vector embedding" },
  { label: "Shared Assignee", color: "#8b5cf6", type: "assignee", desc: "Patents assigned to the same organization or owner" },
  { label: "Same Patent Type", color: "#f59e0b", type: "type", desc: "Belongs to same IP category (e.g. Composition of Matter)" },
  { label: "Overlapping Terms", color: "#ec4899", type: "terms", desc: "Shares key technical terminology & title keywords" },
];

export default function PatentWorkflowGraph({
  graph,
  dark = true,
}: {
  graph: Graph;
  dark?: boolean;
}) {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [legendFilter, setLegendFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rawNodes = graph?.nodes || [];
  const rawEdges = graph?.edges || [];

  // Highlight selected edge and connected nodes prominently
  const processedEdges = useMemo(() => {
    return rawEdges.map((edge) => {
      const strokeColor = edge.data?.color || edge.style?.stroke || "#06b6d4";
      const isSelected = selectedEdge?.id === edge.id;
      const labelStr = String(edge.label || "").toLowerCase();
      const isFiltered = legendFilter ? edge.data?.type === legendFilter || labelStr.includes(legendFilter) : true;

      return {
        ...edge,
        animated: isSelected ? true : edge.animated,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? "#38bdf8" : strokeColor,
          width: isSelected ? 22 : 18,
          height: isSelected ? 22 : 18,
        },
        style: {
          ...(edge.style || {}),
          stroke: isSelected ? "#38bdf8" : strokeColor,
          strokeWidth: isSelected ? 5 : (edge.style?.strokeWidth || 3),
          opacity: isSelected ? 1 : (selectedEdge ? 0.25 : (isFiltered ? 1 : 0.2)),
          filter: isSelected ? `drop-shadow(0 0 10px ${strokeColor})` : "none",
        },
        labelStyle: {
          fill: isSelected ? "#38bdf8" : (dark ? "#f8fafc" : "#0f172a"),
          fontWeight: isSelected ? 800 : 700,
          fontSize: isSelected ? 12 : 11,
        },
        labelBgStyle: {
          fill: dark ? "#0f172a" : "#ffffff",
          fillOpacity: 0.95,
          rx: 6,
          ry: 6,
          stroke: isSelected ? "#38bdf8" : strokeColor,
          strokeWidth: isSelected ? 2 : 1,
        },
      };
    });
  }, [rawEdges, selectedEdge, legendFilter, dark]);

  const processedNodes = useMemo(() => {
    return rawNodes.map((node) => {
      const isSelected = selectedNode?.id === node.id;
      const isEdgeConnected = selectedEdge
        ? selectedEdge.source === node.id || selectedEdge.target === node.id
        : false;

      const isFiltered = legendFilter
        ? node.id === "user-idea" ||
          rawEdges.some((e) => e.data?.type === legendFilter && (e.source === node.id || e.target === node.id))
        : true;

      return {
        type: "graph",
        ...node,
        selected: isSelected || isEdgeConnected,
        style: {
          opacity: isSelected || isEdgeConnected ? 1 : (selectedNode || selectedEdge ? 0.4 : (isFiltered ? 1 : 0.3)),
        },
      };
    });
  }, [rawNodes, selectedNode, selectedEdge, legendFilter, rawEdges]);

  const patentNodesList = rawNodes.filter((n) => n.id !== "user-idea");

  function handleSelectPatentCard(patentNodeId: string) {
    const targetNode = rawNodes.find((n) => n.id === patentNodeId);
    if (targetNode) {
      setSelectedNode(targetNode);
      setSelectedEdge(null);
    }
  }

  if (!rawNodes.length) return null;

  const GraphContainer = ({ isModal = false }: { isModal?: boolean }) => (
    <div className={`grid ${isModal ? "h-[85vh]" : "min-h-[650px]"} grid-cols-1 lg:grid-cols-[1fr_380px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl`}>
      {/* Canvas Area */}
      <div className="relative h-full w-full min-h-[550px] bg-slate-950">
        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-2 text-xs backdrop-blur-md shadow-lg">
          <span className="font-semibold text-slate-300 px-2 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            Neat Order Layout
          </span>

          {legendFilter && (
            <button
              onClick={() => setLegendFilter(null)}
              className="flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
            >
              Reset Filter <X className="h-3 w-3" />
            </button>
          )}

          {!isModal && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-md"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
            </button>
          )}
        </div>

        <ReactFlow
          nodes={processedNodes}
          edges={processedEdges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          onNodeClick={(_, node) => {
            setSelectedNode(node);
            setSelectedEdge(null);
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdge(edge);
            setSelectedNode(null);
          }}
          style={{ width: "100%", height: "100%", background: "#06111f" }}
        >
          <Background gap={20} size={1.2} color="rgba(6,182,212,0.14)" />
          <MiniMap
            nodeColor={(node) => (String(node.id) === "user-idea" ? "#06b6d4" : "#1e293b")}
            nodeStrokeColor={(node) => (String(node.id) === "user-idea" ? "#38bdf8" : "#475569")}
            nodeStrokeWidth={2}
            maskColor="rgba(15, 23, 42, 0.7)"
            style={{ background: "#091424", borderRadius: "12px", border: "1px solid #1e293b" }}
          />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200" showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Right Similarity & Edge Explanation Panel */}
      <aside className="flex flex-col border-t border-slate-800 bg-slate-900 p-6 text-slate-100 lg:border-l lg:border-t-0 overflow-y-auto max-h-[85vh]">
        {selectedEdge ? (
          /* EDGE SELECTED: Detailed Link Explanation & Highlight */
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Highlighted Edge Relationship</p>
                <h3 className="mt-1 text-lg font-bold text-white flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-cyan-400" />
                  {selectedEdge.data?.category || selectedEdge.label || "Connected Nodes"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Clear
              </button>
            </div>

            {/* Edge Source & Target Header */}
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/40 bg-slate-950 p-3 text-xs shadow-lg">
              <span className="font-bold text-cyan-300">{selectedEdge.data?.sourceLabel || selectedEdge.source}</span>
              <ArrowRight className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span className="font-bold text-indigo-300">{selectedEdge.data?.targetLabel || selectedEdge.target}</span>
            </div>

            {/* Category Explanation Box */}
            <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4 space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0 animate-ping"
                  style={{ background: selectedEdge.data?.color || "#06b6d4" }}
                />
                <span className="text-sm font-bold text-slate-100">
                  {selectedEdge.data?.category || "Direct Connection"}
                </span>
                {selectedEdge.data?.score != null && (
                  <span className="ml-auto rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                    {selectedEdge.data.score}% Relevance
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-200">{selectedEdge.data?.reason}</p>
            </div>

            {/* Single Green Chemical + Therapeutic Overlap Box */}
            {(selectedEdge.data?.chemicalOverlap || selectedEdge.data?.therapeuticOverlap) && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-4 space-y-2.5 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Chemical + Therapeutic Overlap
                </div>
                {selectedEdge.data?.chemicalOverlap && (
                  <p className="text-xs leading-relaxed text-slate-200">
                    <span className="font-semibold text-emerald-300">Chemical Similarity: </span>
                    {selectedEdge.data.chemicalOverlap}
                  </p>
                )}
                {selectedEdge.data?.therapeuticOverlap && (
                  <p className="text-xs leading-relaxed text-slate-200 pt-2 border-t border-emerald-500/20">
                    <span className="font-semibold text-emerald-300">Therapeutic Overlap: </span>
                    {selectedEdge.data.therapeuticOverlap}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : selectedNode ? (
          /* NODE SELECTED: Patent Similarity & Comparative Analysis */
          (() => {
            const isIdea = selectedNode.data.kind === "idea";
            if (isIdea) {
              return (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Central Innovation</p>
                    <h3 className="mt-1 text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      {selectedNode.data.label}
                    </h3>
                  </div>

                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
                    <p className="text-xs font-mono text-cyan-200">{selectedNode.data.subtitle}</p>
                    <p className="text-xs leading-relaxed text-slate-300">{selectedNode.data.details}</p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click any surrounding patent node or color-coded edge link to view specific similarity breakdowns against your innovation.
                  </p>
                </div>
              );
            }

            const parsed = parsePatentDetails(selectedNode.data);
            const score = selectedNode.data.relevanceScore ?? 80;
            const patentNumber = selectedNode.data.label;

            return (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-cyan-300">{patentNumber}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                        score >= 80
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                      }`}>
                        {score}% Match
                      </span>
                    </div>
                    <h3 className="mt-1 text-xs font-semibold text-slate-200 leading-snug">
                      {selectedNode.data.title || selectedNode.data.details}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-slate-400 hover:text-white underline shrink-0"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 font-medium">
                    <Building className="h-3.5 w-3.5 text-cyan-400" />
                    {selectedNode.data.assignee || "Unknown Assignee"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 font-medium">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    {parsed.patentType}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Similarity Breakdown
                  </h4>

                  {/* Single Unified Green Chemical + Therapeutic Overlap Box */}
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-4 space-y-2.5 shadow-md">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      AI Relevance Explanation
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">
                      {selectedEdge?.data?.reason || parsed.summary || "Prior art reference matched by AI relevance scoring."}
                    </p>
                  </div>
                </div>

                {patentNumber && (
                  <a
                    href={`https://patents.google.com/patent/${patentNumber.replace(/\s+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-cyan-500/20"
                  >
                    View Patent on Google Patents
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            );
          })()
        ) : (
          /* DEFAULT VIEW: Legend & Top Patent Similarity Rankings */
          <div className="space-y-6 animate-fadeIn">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Relationship Landscape</p>
              <h3 className="mt-1 text-base font-bold text-white">Patent Overlaps & Edge Links</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Click any colored edge link to highlight and view its similarity explanation.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Edge Relationship Types</p>
              <div className="grid grid-cols-1 gap-1.5">
                {LEGEND_ITEMS.map((item) => {
                  const isActive = legendFilter === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => setLegendFilter(isActive ? null : item.type)}
                      className={`flex items-start gap-2.5 rounded-lg border p-2 text-left transition-all text-xs ${
                        isActive
                          ? "border-cyan-400 bg-cyan-950/40 text-white"
                          : "border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full mt-0.5 shrink-0" style={{ background: item.color }} />
                      <div>
                        <div className="font-bold text-slate-200">{item.label}</div>
                        <div className="text-[10px] text-slate-400 leading-snug">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Mapped Patent Nodes</span>
                <span className="text-[10px] font-normal text-slate-500">Click node to inspect</span>
              </p>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {patentNodesList.map((pNode) => {
                  const parsed = parsePatentDetails(pNode.data);
                  const score = pNode.data.relevanceScore ?? 80;

                  return (
                    <div
                      key={pNode.id}
                      onClick={() => handleSelectPatentCard(pNode.id)}
                      className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                          {pNode.data.label}
                        </span>
                        <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                          {score}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1 font-medium">
                        {pNode.data.title || pNode.data.details}
                      </p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-cyan-400 font-medium truncate max-w-[200px]">
                          AI Prior Art Match
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  return (
    <>
      <GraphContainer isModal={false} />

      {/* Fullscreen Modal View when "View Relationships" is opened */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 sm:p-6 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-7xl rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 rounded-t-xl">
              <div className="flex items-center gap-2">
                <GitFork className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Innovation Patent Relationship Map</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2">
              <GraphContainer isModal={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
