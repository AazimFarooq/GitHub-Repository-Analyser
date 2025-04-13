"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { TreeNode, CodeDependency } from "@/types/github"
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileWarning,
  Search,
  Share2,
  X,
  Zap,
  FileCode,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  analyzeFileImpact,
  calculateChangeRiskScore,
  type ImpactNode,
  type ImpactLevel,
} from "@/lib/utils/impact-analysis"
import * as d3 from "d3"
import { cn } from "@/lib/utils"

type ImpactAnalyzerProps = {
  tree: TreeNode
  dependencies: CodeDependency[]
}

export function ImpactAnalyzer({ tree, dependencies }: ImpactAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [impactedFiles, setImpactedFiles] = useState<ImpactNode[]>([])
  const [impactMetrics, setImpactMetrics] = useState<any>(null)
  const [riskAssessment, setRiskAssessment] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"list" | "graph" | "chain">("list")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [filteredImpactLevel, setFilteredImpactLevel] = useState<ImpactLevel | null>(null)
  const [showAllFiles, setShowAllFiles] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract all file paths from the tree
  const [allFiles, setAllFiles] = useState<string[]>([])

  useEffect(() => {
    const files: string[] = []

    const extractFiles = (node: TreeNode) => {
      if (node.type === "blob") {
        files.push(node.path)
      }

      if (node.children) {
        node.children.forEach(extractFiles)
      }
    }

    extractFiles(tree)
    setAllFiles(files)
  }, [tree])

  // Filter files based on search term
  const filteredFiles = allFiles.filter((file) => file.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 100) // Limit to 100 results for performance

  // Analyze impact when a file is selected
  useEffect(() => {
    if (!selectedFile) {
      setImpactedFiles([])
      setImpactMetrics(null)
      setRiskAssessment(null)
      return
    }

    const { impactedFiles, metrics } = analyzeFileImpact(selectedFile, dependencies, tree)
    const risk = calculateChangeRiskScore(metrics)

    setImpactedFiles(impactedFiles)
    setImpactMetrics(metrics)
    setRiskAssessment(risk)

    // Reset filters and expanded nodes
    setFilteredImpactLevel(null)
    setExpandedNodes(new Set())

    // If in graph mode, render the graph
    if (viewMode === "graph") {
      renderImpactGraph(impactedFiles)
    }
  }, [selectedFile, dependencies, tree, viewMode])

  // Re-render graph when view mode changes to graph
  useEffect(() => {
    if (viewMode === "graph" && impactedFiles.length > 0) {
      renderImpactGraph(impactedFiles)
    }
  }, [viewMode, impactedFiles])

  // Filter impacted files based on selected impact level
  const displayedImpactedFiles = impactedFiles
    .filter((file) => !filteredImpactLevel || file.impactLevel === filteredImpactLevel)
    .filter((file) => file.path !== selectedFile) // Exclude the selected file itself

  // Group impacted files by impact level for the list view
  const groupedImpactedFiles = displayedImpactedFiles.reduce(
    (groups, file) => {
      if (!groups[file.impactLevel]) {
        groups[file.impactLevel] = []
      }
      groups[file.impactLevel].push(file)
      return groups
    },
    {} as Record<ImpactLevel, ImpactNode[]>,
  )

  // Toggle expanded state for a node
  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  // Render impact graph using D3
  const renderImpactGraph = (impactedFiles: ImpactNode[]) => {
    if (!svgRef.current || !containerRef.current) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    const width = containerRef.current.clientWidth
    const height = 500

    // Create SVG
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height)

    // Create nodes for D3
    const nodes = impactedFiles.map((file) => ({
      id: file.path,
      name: file.name,
      group: file.impactLevel,
      radius: file.impactLevel === "direct" ? 8 : file.impactLevel === "indirect" ? 6 : 4,
      weight: file.weight,
    }))

    // Create links based on dependency paths
    const links: { source: string; target: string; value: number }[] = []

    impactedFiles.forEach((file) => {
      if (file.dependencyPath.length > 1) {
        for (let i = 0; i < file.dependencyPath.length - 1; i++) {
          links.push({
            source: file.dependencyPath[i],
            target: file.dependencyPath[i + 1],
            value: 1 - i * 0.1, // Stronger links for direct connections
          })
        }
      }
    })

    // Remove duplicate links
    const uniqueLinks = links.filter(
      (link, index, self) =>
        index ===
        self.findIndex(
          (l) =>
            (l.source === link.source && l.target === link.target) ||
            (l.source === link.target && l.target === link.source),
        ),
    )

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(uniqueLinks)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.radius * 2),
      )

    // Create links
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(uniqueLinks)
      .enter()
      .append("line")
      .attr("stroke-width", (d: any) => Math.max(1, d.value * 3))
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)

    // Create nodes
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => getImpactColor(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

    // Add node labels
    const label = svg
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d: any) => d.name)
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4)
      .style("pointer-events", "none")

    // Add title for tooltip
    node.append("title").text((d: any) => d.id)

    // Highlight the selected file
    node
      .filter((d: any) => d.id === selectedFile)
      .attr("stroke", "#ff0")
      .attr("stroke-width", 3)
      .attr("r", (d: any) => d.radius * 1.5)

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }

  // Get color based on impact level
  const getImpactColor = (level: ImpactLevel) => {
    switch (level) {
      case "direct":
        return "#ef4444" // Red
      case "indirect":
        return "#f97316" // Orange
      case "potential":
        return "#facc15" // Yellow
      case "safe":
        return "#22c55e" // Green
      default:
        return "#6b7280" // Gray
    }
  }

  // Get background color based on impact level
  const getImpactBgColor = (level: ImpactLevel) => {
    switch (level) {
      case "direct":
        return "bg-red-500"
      case "indirect":
        return "bg-orange-500"
      case "potential":
        return "bg-yellow-500"
      case "safe":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get text color based on impact level
  const getImpactTextColor = (level: ImpactLevel) => {
    switch (level) {
      case "direct":
        return "text-red-500"
      case "indirect":
        return "text-orange-500"
      case "potential":
        return "text-yellow-500"
      case "safe":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  // Get risk color based on risk level
  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-500"
      case "high":
        return "text-orange-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <FileWarning className="h-4 w-4 mr-2 text-primary" />
            Change Impact Analyzer
          </CardTitle>

          {selectedFile && (
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="list" className="text-xs px-2 py-1">
                  List View
                </TabsTrigger>
                <TabsTrigger value="graph" className="text-xs px-2 py-1">
                  Graph View
                </TabsTrigger>
                <TabsTrigger value="chain" className="text-xs px-2 py-1">
                  Chain View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select a file to analyze impact:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {searchTerm && (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {filteredFiles.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No files found matching "{searchTerm}"</div>
                ) : (
                  <ul className="py-1">
                    {filteredFiles.map((file) => (
                      <li key={file}>
                        <button
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center",
                            selectedFile === file && "bg-muted",
                          )}
                          onClick={() => setSelectedFile(file)}
                        >
                          <FileCode className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{file}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Selected file and impact summary */}
          {selectedFile && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium flex items-center">
                    <FileCode className="h-4 w-4 mr-2 text-primary" />
                    {selectedFile.split("/").pop()}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedFile}</p>
                </div>

                {riskAssessment && (
                  <Badge
                    className={cn(
                      "px-2 py-1",
                      riskAssessment.level === "critical"
                        ? "bg-red-500"
                        : riskAssessment.level === "high"
                          ? "bg-orange-500"
                          : riskAssessment.level === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500",
                    )}
                  >
                    {riskAssessment.level.charAt(0).toUpperCase() + riskAssessment.level.slice(1)} Risk
                  </Badge>
                )}
              </div>

              {impactMetrics && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                    <div className="flex items-center gap-2">
                      <Progress value={riskAssessment.score} className="h-2 flex-1" />
                      <span className={cn("text-sm font-medium", getRiskColor(riskAssessment.level))}>
                        {riskAssessment.score}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Impact Breakdown</div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                      <span className="mr-2">Direct: {impactMetrics.directImpact}</span>

                      <span className="inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
                      <span className="mr-2">Indirect: {impactMetrics.indirectImpact}</span>

                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span>Potential: {impactMetrics.potentialImpact}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Max Chain Depth</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center">
                        {Array.from({ length: impactMetrics.maxChainLength }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-4 h-1 mr-0.5",
                              i < 3 ? "bg-red-500" : i < 6 ? "bg-orange-500" : "bg-yellow-500",
                            )}
                          ></div>
                        ))}
                      </div>
                      <span className="text-sm font-medium">{impactMetrics.maxChainLength} levels</span>
                    </div>
                  </div>
                </div>
              )}

              {riskAssessment && riskAssessment.factors.length > 0 && (
                <div className="mt-4 text-sm">
                  <div className="font-medium mb-1">Risk Factors:</div>
                  <ul className="list-disc list-inside text-xs text-muted-foreground">
                    {riskAssessment.factors.map((factor: string, index: number) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Impact visualization */}
          {selectedFile && impactedFiles.length > 0 && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Filter by impact:</span>
                <Badge
                  variant={filteredImpactLevel === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilteredImpactLevel(null)}
                >
                  All
                </Badge>
                <Badge
                  variant={filteredImpactLevel === "direct" ? "default" : "outline"}
                  className={cn("cursor-pointer", filteredImpactLevel !== "direct" && "bg-red-500")}
                  onClick={() => setFilteredImpactLevel(filteredImpactLevel === "direct" ? null : "direct")}
                >
                  Direct
                </Badge>
                <Badge
                  variant={filteredImpactLevel === "indirect" ? "default" : "outline"}
                  className={cn("cursor-pointer", filteredImpactLevel !== "indirect" && "bg-orange-500")}
                  onClick={() => setFilteredImpactLevel(filteredImpactLevel === "indirect" ? null : "indirect")}
                >
                  Indirect
                </Badge>
                <Badge
                  variant={filteredImpactLevel === "potential" ? "default" : "outline"}
                  className={cn("cursor-pointer", filteredImpactLevel !== "potential" && "bg-yellow-500")}
                  onClick={() => setFilteredImpactLevel(filteredImpactLevel === "potential" ? null : "potential")}
                >
                  Potential
                </Badge>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => setShowAllFiles(!showAllFiles)}
                  >
                    {showAllFiles ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showAllFiles ? "Hide Safe Files" : "Show All Files"}
                  </Button>
                </div>
              </div>

              {/* List View */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {Object.entries(groupedImpactedFiles).map(([level, files]) => (
                    <div key={level} className="space-y-2">
                      <h3 className={cn("text-sm font-medium", getImpactTextColor(level as ImpactLevel))}>
                        {level.charAt(0).toUpperCase() + level.slice(1)} Impact ({files.length})
                      </h3>

                      <div className="border rounded-lg overflow-hidden">
                        <ul className="divide-y">
                          {files.map((file) => (
                            <li key={file.id} className="p-2 hover:bg-muted/50">
                              <div className="flex items-start">
                                <div className={cn("w-1 self-stretch mr-2", getImpactBgColor(file.impactLevel))}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <FileCode className="h-4 w-4 mr-2 shrink-0" />
                                    <span className="font-medium text-sm truncate">{file.name}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {file.distance} {file.distance === 1 ? "hop" : "hops"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{file.path}</p>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-6 text-xs"
                                    onClick={() => toggleNode(file.id)}
                                  >
                                    {expandedNodes.has(file.id) ? (
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                    )}
                                    {expandedNodes.has(file.id) ? "Hide" : "Show"} Dependency Path
                                  </Button>

                                  {expandedNodes.has(file.id) && (
                                    <div className="mt-2 pl-4 border-l-2 border-muted">
                                      <div className="text-xs font-medium mb-1">Dependency Chain:</div>
                                      <div className="space-y-1">
                                        {file.dependencyPath.map((path, index) => (
                                          <div key={index} className="flex items-center">
                                            {index > 0 && <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                                            <span className="text-xs truncate">{path.split("/").pop()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="ml-2">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{
                                      background: `conic-gradient(${getImpactColor(file.impactLevel)} ${file.weight * 100}%, transparent 0)`,
                                    }}
                                  >
                                    <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-medium">
                                      {Math.round(file.weight * 100)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Graph View */}
              {viewMode === "graph" && (
                <div ref={containerRef} className="border rounded-lg bg-muted/30 h-[500px] relative overflow-hidden">
                  <svg ref={svgRef} className="w-full h-full"></svg>

                  <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg text-xs">
                    <div className="font-medium mb-1">Impact Legend:</div>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        <span>Direct Impact</span>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                        <span>Indirect Impact</span>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        <span>Potential Impact</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chain View */}
              {viewMode === "chain" && impactMetrics.criticalPaths.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Critical Dependency Chains</h3>

                  <div className="space-y-6">
                    {impactMetrics.criticalPaths.map((path: string[], index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Critical Path #{index + 1}</h4>
                          <Badge variant="outline">{path.length} nodes</Badge>
                        </div>

                        <div className="relative">
                          {/* Vertical timeline line */}
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>

                          {/* Chain nodes */}
                          <div className="space-y-6 relative">
                            {path.map((nodePath, nodeIndex) => {
                              const node = impactedFiles.find((f) => f.path === nodePath)
                              const isFirst = nodeIndex === 0
                              const isLast = nodeIndex === path.length - 1
                              const isSelected = nodePath === selectedFile

                              return (
                                <div key={nodeIndex} className="flex items-start ml-4 pl-6 relative">
                                  {/* Node marker */}
                                  <div
                                    className={cn(
                                      "absolute left-0 w-4 h-4 rounded-full border-2 border-background",
                                      isSelected
                                        ? "bg-primary"
                                        : isFirst
                                          ? "bg-red-500"
                                          : isLast
                                            ? "bg-green-500"
                                            : node
                                              ? getImpactBgColor(node.impactLevel)
                                              : "bg-gray-500",
                                    )}
                                  ></div>

                                  {/* Node content */}
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <FileCode className="h-4 w-4 mr-2" />
                                      <span className="font-medium text-sm">{nodePath.split("/").pop()}</span>
                                      {isSelected && <Badge className="ml-2 bg-primary">Selected File</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{nodePath}</p>

                                    {node && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={cn("text-xs", getImpactTextColor(node.impactLevel))}
                                        >
                                          {node.impactLevel}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Impact Weight: {Math.round(node.weight * 100)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No impact message */}
          {selectedFile && impactedFiles.length === 0 && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Impact Detected</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This file appears to be isolated and has no dependencies or dependents. Changes to this file should have
                minimal impact on the rest of the codebase.
              </p>
            </div>
          )}

          {/* Initial state */}
          {!selectedFile && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium mb-2">Analyze Change Impact</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select a file to analyze the potential impact of changes. This tool helps you understand which parts of
                the codebase might be affected when you modify a specific file.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
