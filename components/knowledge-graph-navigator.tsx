"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  Network,
  FileCode,
  Lightbulb,
  X,
  ChevronRight,
  ChevronDown,
  Zap,
  Layers,
  Tag,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeNode } from "@/types/github"
import {
  buildKnowledgeGraph,
  findCentralConcepts,
  findRelatedConcepts,
  searchConcepts,
  getConceptsByCategory,
  type ConceptNode,
  type KnowledgeGraph,
} from "@/lib/utils/knowledge-graph"
import * as d3 from "d3"

type KnowledgeGraphNavigatorProps = {
  tree: TreeNode
}

export function KnowledgeGraphNavigator({ tree }: KnowledgeGraphNavigatorProps) {
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<ConceptNode | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ConceptNode[]>([])
  const [activeTab, setActiveTab] = useState("explore")
  const [relatedConcepts, setRelatedConcepts] = useState<{
    directlyRelated: ConceptNode[]
    indirectlyRelated: ConceptNode[]
  } | null>(null)
  const [conceptsByCategory, setConceptsByCategory] = useState<Record<string, ConceptNode[]>>({})
  const [centralConcepts, setCentralConcepts] = useState<ConceptNode[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["UI Components"]))
  const [viewMode, setViewMode] = useState<"list" | "graph">("list")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [navigationHistory, setNavigationHistory] = useState<ConceptNode[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build knowledge graph on component mount
  useEffect(() => {
    const graph = buildKnowledgeGraph(tree)
    setKnowledgeGraph(graph)

    // Find central concepts
    const central = findCentralConcepts(graph, 10)
    setCentralConcepts(central)

    // Group concepts by category
    const byCategory = getConceptsByCategory(graph)
    setConceptsByCategory(byCategory)
  }, [tree])

  // Handle search
  useEffect(() => {
    if (knowledgeGraph && searchQuery.trim()) {
      const results = searchConcepts(knowledgeGraph, searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, knowledgeGraph])

  // Update related concepts when a concept is selected
  useEffect(() => {
    if (knowledgeGraph && selectedConcept) {
      const related = findRelatedConcepts(knowledgeGraph, selectedConcept.id)
      setRelatedConcepts(related)

      // Update navigation history
      if (historyIndex === navigationHistory.length - 1) {
        // Add to history if we're at the end
        setNavigationHistory([...navigationHistory, selectedConcept])
        setHistoryIndex(navigationHistory.length)
      } else {
        // Replace forward history if we navigated back
        const newHistory = [...navigationHistory.slice(0, historyIndex + 1), selectedConcept]
        setNavigationHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      }

      // Set selected files
      setSelectedFiles(selectedConcept.files)
    }
  }, [selectedConcept, knowledgeGraph])

  // Render graph when view mode changes to graph or when selected concept changes
  useEffect(() => {
    if (viewMode === "graph" && knowledgeGraph && selectedConcept) {
      renderConceptGraph()
    }
  }, [viewMode, selectedConcept, knowledgeGraph, isFullscreen])

  // Handle window resize for graph
  useEffect(() => {
    const handleResize = () => {
      if (viewMode === "graph" && knowledgeGraph && selectedConcept) {
        renderConceptGraph()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [viewMode, selectedConcept, knowledgeGraph])

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Navigate to a concept
  const navigateToConcept = (concept: ConceptNode) => {
    setSelectedConcept(concept)
    setActiveTab("explore")
  }

  // Navigate back in history
  const navigateBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setSelectedConcept(navigationHistory[historyIndex - 1])
    }
  }

  // Navigate forward in history
  const navigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setSelectedConcept(navigationHistory[historyIndex + 1])
    }
  }

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Filter concepts by type
  const filterByType = (type: string | null) => {
    setActiveFilter(type)
  }

  // Get filtered concepts by category
  const filteredConceptsByCategory = useMemo(() => {
    if (!activeFilter) return conceptsByCategory

    const filtered: Record<string, ConceptNode[]> = {}
    Object.entries(conceptsByCategory).forEach(([category, concepts]) => {
      const filteredConcepts = concepts.filter((concept) => concept.type === activeFilter)
      if (filteredConcepts.length > 0) {
        filtered[category] = filteredConcepts
      }
    })
    return filtered
  }, [conceptsByCategory, activeFilter])

  // Render the concept graph using D3
  const renderConceptGraph = () => {
    if (!svgRef.current || !containerRef.current || !knowledgeGraph || !selectedConcept) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight || 500

    // Create SVG
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height)

    // Create nodes for D3
    const nodes: any[] = []
    const links: any[] = []

    // Add selected concept
    nodes.push({
      id: selectedConcept.id,
      label: selectedConcept.label,
      group: selectedConcept.category,
      type: selectedConcept.type,
      radius: 12,
      selected: true,
    })

    // Add directly related concepts
    if (relatedConcepts) {
      relatedConcepts.directlyRelated.forEach((concept) => {
        nodes.push({
          id: concept.id,
          label: concept.label,
          group: concept.category,
          type: concept.type,
          radius: 8,
          selected: false,
        })

        // Add link to selected concept
        links.push({
          source: selectedConcept.id,
          target: concept.id,
          value: 1,
          direct: true,
        })
      })

      // Add indirectly related concepts
      relatedConcepts.indirectlyRelated.slice(0, 10).forEach((concept) => {
        nodes.push({
          id: concept.id,
          label: concept.label,
          group: concept.category,
          type: concept.type,
          radius: 6,
          selected: false,
        })

        // Find a path to this concept through directly related concepts
        const directlyRelatedIds = relatedConcepts.directlyRelated.map((c) => c.id)
        const connectedThrough = directlyRelatedIds.find((directId) => {
          return knowledgeGraph.edges.some(
            (edge) =>
              (edge.source === directId && edge.target === concept.id) ||
              (edge.source === concept.id && edge.target === directId),
          )
        })

        if (connectedThrough) {
          links.push({
            source: connectedThrough,
            target: concept.id,
            value: 0.5,
            direct: false,
          })
        } else {
          // If no direct path found, connect to the selected concept
          links.push({
            source: selectedConcept.id,
            target: concept.id,
            value: 0.3,
            direct: false,
          })
        }
      })
    }

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => (d.direct ? 100 : 150)),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.radius * 2.5),
      )

    // Create links
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", (d: any) => Math.max(1, d.value * 3))
      .attr("stroke", (d: any) => (d.direct ? "#6366f1" : "#94a3b8"))
      .attr("stroke-opacity", (d: any) => (d.direct ? 0.8 : 0.4))
      .attr("stroke-dasharray", (d: any) => (d.direct ? "none" : "3,3"))

    // Create node groups
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)
      .on("click", (event: any, d: any) => {
        const concept = knowledgeGraph.nodes.find((n) => n.id === d.id)
        if (concept) {
          navigateToConcept(concept)
        }
      })

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => getNodeColor(d))
      .attr("stroke", (d: any) => (d.selected ? "#f97316" : "#fff"))
      .attr("stroke-width", (d: any) => (d.selected ? 3 : 1.5))

    // Add type icons to nodes
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-family", "sans-serif")
      .attr("font-size", "8px")
      .attr("fill", "#fff")
      .text((d: any) => getTypeIcon(d.type))

    // Add labels to nodes
    node
      .append("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .text((d: any) => d.label)
      .attr("font-size", (d: any) => (d.selected ? "14px" : "12px"))
      .attr("font-weight", (d: any) => (d.selected ? "bold" : "normal"))
      .attr("fill", "currentColor")
      .attr("stroke", "none")
      .attr("pointer-events", "none")

    // Add title for tooltip
    node.append("title").text((d: any) => `${d.label} (${d.type})`)

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
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

  // Get color for node based on category
  const getNodeColor = (node: any) => {
    const categoryColors: Record<string, string> = {
      "UI Components": "#3b82f6", // blue
      Hooks: "#8b5cf6", // purple
      "API Endpoints": "#10b981", // green
      Utilities: "#f59e0b", // amber
      Classes: "#ef4444", // red
      Contexts: "#6366f1", // indigo
      "Domain Concepts": "#ec4899", // pink
      Other: "#6b7280", // gray
    }

    return categoryColors[node.group] || "#6b7280"
  }

  // Get icon for node type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "component":
        return "C"
      case "hook":
        return "H"
      case "api":
        return "A"
      case "function":
        return "F"
      case "class":
        return "L"
      case "context":
        return "X"
      case "concept":
        return "D"
      default:
        return "?"
    }
  }

  // Get badge color for concept type
  const getConceptTypeColor = (type: string) => {
    switch (type) {
      case "component":
        return "bg-blue-500"
      case "hook":
        return "bg-purple-500"
      case "api":
        return "bg-green-500"
      case "function":
        return "bg-amber-500"
      case "class":
        return "bg-red-500"
      case "context":
        return "bg-indigo-500"
      case "concept":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card
      className={cn("overflow-hidden transition-all duration-300", isFullscreen ? "fixed inset-4 z-50" : "relative")}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-primary" />
            Knowledge Graph Navigator
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search concepts, components, functions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              <div className="p-2 bg-muted/50 text-xs font-medium">
                Found {searchResults.length} concepts matching "{searchQuery}"
              </div>
              <ul className="py-1">
                {searchResults.map((concept) => (
                  <li key={concept.id}>
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center"
                      onClick={() => navigateToConcept(concept)}
                    >
                      <span className={cn("w-2 h-2 rounded-full mr-2", getConceptTypeColor(concept.type))}></span>
                      <span className="font-medium">{concept.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {concept.type}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="explore" className="text-xs">
                <Lightbulb className="h-4 w-4 mr-1" />
                Explore
              </TabsTrigger>
              <TabsTrigger value="browse" className="text-xs">
                <Layers className="h-4 w-4 mr-1" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="central" className="text-xs">
                <Network className="h-4 w-4 mr-1" />
                Central
              </TabsTrigger>
            </TabsList>

            {/* Explore tab content */}
            <TabsContent value="explore" className="mt-4 space-y-4">
              {selectedConcept ? (
                <div>
                  {/* Navigation history */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={historyIndex <= 0}
                      onClick={navigateBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={historyIndex >= navigationHistory.length - 1}
                      onClick={navigateForward}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {historyIndex + 1} / {navigationHistory.length}
                    </div>

                    <div className="ml-auto">
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setViewMode("list")}
                      >
                        List
                      </Button>
                      <Button
                        variant={viewMode === "graph" ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => setViewMode("graph")}
                      >
                        Graph
                      </Button>
                    </div>
                  </div>

                  {/* Concept details */}
                  <div className="p-4 border rounded-lg bg-muted/30 mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("px-2 py-1", getConceptTypeColor(selectedConcept.type))}>
                            {selectedConcept.type}
                          </Badge>
                          <h3 className="text-lg font-bold">{selectedConcept.label}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{selectedConcept.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {selectedConcept.category}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium mb-2">Files ({selectedConcept.files.length})</h4>
                        <div className="max-h-24 overflow-y-auto text-xs space-y-1">
                          {selectedConcept.files.map((file) => (
                            <div key={file} className="flex items-center">
                              <FileCode className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="truncate">{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium mb-2">
                          Related Concepts ({selectedConcept.related.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedConcept.related.slice(0, 5).map((relatedId) => {
                            const concept = knowledgeGraph?.nodes.find((n) => n.id === relatedId)
                            return concept ? (
                              <Badge
                                key={relatedId}
                                variant="outline"
                                className="text-xs cursor-pointer"
                                onClick={() => navigateToConcept(concept)}
                              >
                                {concept.label}
                              </Badge>
                            ) : null
                          })}
                          {selectedConcept.related.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedConcept.related.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Graph or list view */}
                  {viewMode === "graph" ? (
                    <div
                      ref={containerRef}
                      className="border rounded-lg bg-muted/30 h-[400px] relative overflow-hidden"
                    >
                      <svg ref={svgRef} className="w-full h-full"></svg>

                      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg text-xs">
                        <div className="font-medium mb-1">Legend:</div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                            <span>UI Components</span>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                            <span>Hooks</span>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            <span>API Endpoints</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {relatedConcepts && (
                        <>
                          {/* Directly related concepts */}
                          <div>
                            <h3 className="text-sm font-medium mb-2">Directly Related Concepts</h3>
                            <div className="border rounded-lg overflow-hidden">
                              {relatedConcepts.directlyRelated.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  No directly related concepts found
                                </div>
                              ) : (
                                <ul className="divide-y">
                                  {relatedConcepts.directlyRelated.map((concept) => (
                                    <li key={concept.id} className="p-2 hover:bg-muted/50">
                                      <button className="w-full text-left" onClick={() => navigateToConcept(concept)}>
                                        <div className="flex items-center">
                                          <span
                                            className={cn(
                                              "w-2 h-2 rounded-full mr-2",
                                              getConceptTypeColor(concept.type),
                                            )}
                                          ></span>
                                          <span className="font-medium">{concept.label}</span>
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            {concept.type}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 ml-4">{concept.description}</p>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          {/* Indirectly related concepts */}
                          <div>
                            <h3 className="text-sm font-medium mb-2">Indirectly Related Concepts</h3>
                            <div className="border rounded-lg overflow-hidden">
                              {relatedConcepts.indirectlyRelated.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                  No indirectly related concepts found
                                </div>
                              ) : (
                                <ul className="divide-y">
                                  {relatedConcepts.indirectlyRelated.slice(0, 5).map((concept) => (
                                    <li key={concept.id} className="p-2 hover:bg-muted/50">
                                      <button className="w-full text-left" onClick={() => navigateToConcept(concept)}>
                                        <div className="flex items-center">
                                          <span
                                            className={cn(
                                              "w-2 h-2 rounded-full mr-2",
                                              getConceptTypeColor(concept.type),
                                            )}
                                          ></span>
                                          <span className="font-medium">{concept.label}</span>
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            {concept.type}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 ml-4">{concept.description}</p>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a Concept to Explore</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Choose a concept from the Browse or Central tabs to explore its relationships and details.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Browse tab content */}
            <TabsContent value="browse" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Browse by Category</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeFilter === null ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => filterByType(null)}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === "component" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => filterByType("component")}
                  >
                    Components
                  </Button>
                  <Button
                    variant={activeFilter === "hook" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => filterByType("hook")}
                  >
                    Hooks
                  </Button>
                  <Button
                    variant={activeFilter === "function" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => filterByType("function")}
                  >
                    Functions
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(filteredConceptsByCategory).length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground border rounded-lg">
                    No concepts found with the selected filter
                  </div>
                ) : (
                  Object.entries(filteredConceptsByCategory).map(([category, concepts]) => (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full p-3 flex items-center justify-between bg-muted/50 hover:bg-muted"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium">{category}</span>
                          <Badge variant="outline" className="ml-2">
                            {concepts.length}
                          </Badge>
                        </div>
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      {expandedCategories.has(category) && (
                        <ul className="divide-y">
                          {concepts.map((concept) => (
                            <li key={concept.id} className="p-2 hover:bg-muted/50">
                              <button className="w-full text-left" onClick={() => navigateToConcept(concept)}>
                                <div className="flex items-center">
                                  <span
                                    className={cn("w-2 h-2 rounded-full mr-2", getConceptTypeColor(concept.type))}
                                  ></span>
                                  <span className="font-medium">{concept.label}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {concept.files.length} {concept.files.length === 1 ? "file" : "files"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 ml-4">{concept.description}</p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Central tab content */}
            <TabsContent value="central" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Central Concepts</h3>
                <Badge variant="outline" className="text-xs">
                  Most connected
                </Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <ul className="divide-y">
                  {centralConcepts.map((concept) => (
                    <li key={concept.id} className="p-3 hover:bg-muted/50">
                      <button className="w-full text-left" onClick={() => navigateToConcept(concept)}>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-amber-500" />
                          <span className="font-medium">{concept.label}</span>
                          <Badge className={cn("ml-2 text-xs", getConceptTypeColor(concept.type))}>
                            {concept.type}
                          </Badge>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {concept.related.length} connections
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{concept.description}</p>
                        <div className="mt-2 ml-6 flex flex-wrap gap-1">
                          {concept.related.slice(0, 3).map((relatedId) => {
                            const relatedConcept = knowledgeGraph?.nodes.find((n) => n.id === relatedId)
                            return relatedConcept ? (
                              <Badge key={relatedId} variant="outline" className="text-xs">
                                {relatedConcept.label}
                              </Badge>
                            ) : null
                          })}
                          {concept.related.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{concept.related.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
