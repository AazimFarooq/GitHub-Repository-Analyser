"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import * as d3 from "d3"
import type { CodeDependency } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCw, Filter, Maximize, Minimize, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import { useFullscreen } from "@/lib/hooks/use-fullscreen"
import { getFileGroup, getNodeColor, getLinkColor } from "@/lib/utils/file-utils"

type DependencyGraphProps = {
  dependencies: CodeDependency[]
  files: string[]
}

export function DependencyGraph({ dependencies, files }: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [linkDistance, setLinkDistance] = useState(100)
  const [nodeCharge, setNodeCharge] = useState(-200)
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  // Filter dependencies based on selected types
  const filteredDependencies = useMemo(() => {
    if (selectedTypes.length === 0) return dependencies
    return dependencies.filter((d) => selectedTypes.includes(d.type))
  }, [dependencies, selectedTypes])

  // Get all unique dependency types
  const dependencyTypes = useMemo(() => {
    return Array.from(new Set(dependencies.map((d) => d.type)))
  }, [dependencies])

  useEffect(() => {
    if (!svgRef.current || !filteredDependencies.length) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 600

    // Create a map of all nodes
    const nodes = Array.from(
      new Set([...filteredDependencies.map((d) => d.source), ...filteredDependencies.map((d) => d.target)]),
    ).map((id) => {
      const name = id.split("/").pop() || id
      const matchesSearch = searchTerm ? name.toLowerCase().includes(searchTerm.toLowerCase()) : true

      return {
        id,
        name,
        group: getFileGroup(id),
        r: matchesSearch ? 6 : 4, // Larger radius for search matches
        opacity: matchesSearch ? 1 : searchTerm ? 0.3 : 1,
      }
    })

    // Create links from dependencies
    const links = filteredDependencies.map((d) => {
      const sourceNode = nodes.find((n) => n.id === d.source)
      const targetNode = nodes.find((n) => n.id === d.target)
      const matchesSearch = searchTerm
        ? sourceNode?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          targetNode?.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      return {
        source: d.source,
        target: d.target,
        type: d.type,
        opacity: matchesSearch ? 0.6 : searchTerm ? 0.1 : 0.6,
      }
    })

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(linkDistance),
      )
      .force("charge", d3.forceManyBody().strength(nodeCharge))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.r * 1.5),
      )

    // Create the SVG elements
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)

    // Add a subtle grid pattern
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "transparent").classed("bg-dots", true)

    // Define arrow markers for links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["import", "export", "reference", "extends", "implements"])
      .enter()
      .append("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", (d) => getLinkColor(d))
      .attr("d", "M0,-5L10,0L0,5")

    // Create links with gradients
    const linkGroup = svg.append("g").attr("class", "links")

    // Add gradients for links
    const defs = svg.append("defs")

    links.forEach((link, i) => {
      const gradientId = `link-gradient-${i}`
      const gradient = defs.append("linearGradient").attr("id", gradientId).attr("gradientUnits", "userSpaceOnUse")

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", getNodeColor(getFileGroup(link.source as string)))

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", getNodeColor(getFileGroup(link.target as string)))
    })

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d, i) => `url(#link-gradient-${i})`)
      .attr("stroke-width", 1.5)
      .attr("marker-end", (d) => `url(#arrow-${d.type})`)
      .attr("opacity", (d) => d.opacity)
      .attr("class", "tree-connection")

    // Create node group
    const nodeGroup = svg.append("g").attr("class", "nodes")

    // Create nodes with glowing effect
    const node = nodeGroup
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(drag(simulation) as any)
      .on("mouseover", function (event, d: any) {
        setHighlightedNode(d.id)

        // Highlight connected links and nodes
        link
          .attr("opacity", (l: any) => {
            if (l.source.id === d.id || l.target.id === d.id) {
              return 1
            }
            return 0.1
          })
          .attr("stroke-width", (l: any) => {
            if (l.source.id === d.id || l.target.id === d.id) {
              return 2
            }
            return 1.5
          })

        node
          .selectAll("circle")
          .attr("opacity", (n: any) => {
            if (n.id === d.id) return 1

            // Check if this node is connected to the hovered node
            const isConnected = links.some(
              (l) => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id),
            )

            return isConnected ? 1 : 0.3
          })
          .attr("r", (n: any) => {
            if (n.id === d.id) return n.r * 1.5
            return n.r
          })

        // Show tooltip
        d3.select(this)
          .append("text")
          .attr("class", "tooltip")
          .attr("dy", -15)
          .attr("text-anchor", "middle")
          .text(d.name)
          .style("font-size", "12px")
          .style("fill", "currentColor")
          .style("pointer-events", "none")
          .style("font-weight", "bold")
      })
      .on("mouseout", function () {
        setHighlightedNode(null)

        // Reset link opacity
        link.attr("opacity", (l: any) => l.opacity).attr("stroke-width", 1.5)

        // Reset node opacity and size
        node
          .selectAll("circle")
          .attr("opacity", (n: any) => n.opacity)
          .attr("r", (n: any) => n.r)

        // Remove tooltip
        d3.select(this).select("text.tooltip").remove()
      })

    // Add glow filter
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%")

    filter.append("feGaussianBlur").attr("stdDeviation", "2").attr("result", "coloredBlur")

    const feMerge = filter.append("feMerge")
    feMerge.append("feMergeNode").attr("in", "coloredBlur")
    feMerge.append("feMergeNode").attr("in", "SourceGraphic")

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => getNodeColor(d.group))
      .attr("opacity", (d: any) => d.opacity)
      .attr("stroke", (d: any) => d3.color(getNodeColor(d.group))?.darker().toString() || "")
      .attr("stroke-width", 1)
      .attr("filter", "url(#glow)")

    // Add node labels
    node
      .append("text")
      .attr("dx", 10)
      .attr("dy", ".35em")
      .text((d: any) => d.name)
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .style("fill", "currentColor")
      .style("opacity", (d: any) => (searchTerm && d.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.7))
      .style("font-weight", (d: any) =>
        searchTerm && d.name.toLowerCase().includes(searchTerm.toLowerCase()) ? "bold" : "normal",
      )

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)

      // Update gradient positions
      links.forEach((link, i) => {
        const sourceNode = nodes.find((n) => n.id === link.source)
        const targetNode = nodes.find((n) => n.id === link.target)

        if (sourceNode && targetNode) {
          d3.select(`#link-gradient-${i}`)
            .attr("x1", (sourceNode as any).x)
            .attr("y1", (sourceNode as any).y)
            .attr("x2", (targetNode as any).x)
            .attr("y2", (targetNode as any).y)
        }
      })
    })

    // Drag behavior
    function drag(simulation: any) {
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

      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [filteredDependencies, searchTerm, linkDistance, nodeCharge])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setSearchTerm("")
    setSelectedTypes([])
  }

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-lg bg-background overflow-hidden" ref={containerRef}>
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 w-[200px] bg-card/80 backdrop-blur-sm"
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-[200px] justify-start gap-2 bg-card/80 backdrop-blur-sm">
              <Filter className="h-4 w-4" />
              <span>Filter by type</span>
              {selectedTypes.length > 0 && (
                <span className="ml-auto rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                  {selectedTypes.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Dependency Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {dependencyTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, type])
                  } else {
                    setSelectedTypes(selectedTypes.filter((t) => t !== type))
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLinkColor(type) }}></div>
                  <span>{type}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            {selectedTypes.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => setSelectedTypes([])}
                >
                  Clear filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="space-y-4 bg-card/80 backdrop-blur-sm p-3 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted-foreground">Link Distance</label>
              <span className="text-xs font-medium">{linkDistance}</span>
            </div>
            <Slider
              value={[linkDistance]}
              min={50}
              max={200}
              step={10}
              onValueChange={(value) => setLinkDistance(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted-foreground">Node Repulsion</label>
              <span className="text-xs font-medium">{Math.abs(nodeCharge)}</span>
            </div>
            <Slider
              value={[Math.abs(nodeCharge)]}
              min={50}
              max={500}
              step={50}
              onValueChange={(value) => setNodeCharge(-value[0])}
            />
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button variant="outline" size="icon" onClick={handleZoomIn} className="bg-card/80 backdrop-blur-sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} className="bg-card/80 backdrop-blur-sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} className="bg-card/80 backdrop-blur-sm">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={toggleFullscreen} className="bg-card/80 backdrop-blur-sm">
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      <motion.div
        className="w-full h-full"
        animate={{ scale: zoom }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: "center" }}
      >
        <svg ref={svgRef} className="w-full h-full" />
      </motion.div>

      <div className="absolute bottom-4 left-4 text-xs bg-card/80 backdrop-blur-sm p-3 rounded-lg z-10">
        <div className="font-medium mb-2">Node Types</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-[#3b82f6] mr-1"></span>
            <span>JavaScript/TypeScript</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-[#ec4899] mr-1"></span>
            <span>Styles</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-[#f59e0b] mr-1"></span>
            <span>Config</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-[#10b981] mr-1"></span>
            <span>Documentation</span>
          </div>
        </div>

        <div className="font-medium mt-3 mb-2">Connection Types</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {dependencyTypes.map((type) => (
            <div key={type} className="flex items-center">
              <span
                className="inline-block w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: getLinkColor(type) }}
              ></span>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
