"use client"

import { useState, useEffect, useRef } from "react"
import type { TreeNode } from "@/types/github"
import * as d3 from "d3"

type KnowledgeGraphExplorerProps = {
  tree: TreeNode
}

type Concept = {
  id: string
  name: string
  type: "component" | "hook" | "utility" | "context" | "model" | "api" | "concept"
  description: string
  files: string[]
  importance: number // 1-10
  complexity: number // 1-10
  dependencies: string[]
  tags: string[]
}

type ConceptLink = {
  source: string
  target: string
  type: "uses" | "implements" | "extends" | "creates" | "consumes" | "relates"
  strength: number // 1-10
  description: string
}

export function KnowledgeGraphExplorer({ tree }: KnowledgeGraphExplorerProps) {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [links, setLinks] = useState<ConceptLink[]>([])
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [selectedLink, setSelectedLink] = useState<ConceptLink | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterImportance, setFilterImportance] = useState([1, 10])
  const [filterComplexity, setFilterComplexity] = useState([1, 10])
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"graph" | "hierarchy" | "radial">("graph")
  const [conceptGrouping, setConceptGrouping] = useState<"type" | "complexity" | "importance">("type")
  const [relatedFiles, setRelatedFiles] = useState<string[]>([])
  const [relatedConcepts, setRelatedConcepts] = useState<Concept[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<any>(null)

  // Initialize with simulated data
  useEffect(() => {
    if (!tree) return

    setIsLoading(true)

    // Simulate loading delay
    setTimeout(() => {
      // Generate simulated concepts and links
      const generatedConcepts = generateConcepts(tree)
      const generatedLinks = generateLinks(generatedConcepts)

      setConcepts(generatedConcepts)
      setLinks(generatedLinks)
      setIsLoading(false)
    }, 1500)
  }, [tree])

  // Initialize visualization when data is loaded
  useEffect(() => {
    if (isLoading || !svgRef.current || concepts.length === 0) return

    initializeVisualization()
  }, [isLoading, concepts, links, viewMode, conceptGrouping])

  // Update visualization when filters change
  useEffect(() => {
    if (isLoading || !svgRef.current || concepts.length === 0) return

    updateVisualization()
  }, [searchTerm, filterType, filterImportance, filterComplexity])

  // Update related files and concepts when a concept is selected
  useEffect(() => {
    if (!selectedConcept) {
      setRelatedFiles([])
      setRelatedConcepts([])
      return
    }

    // Set related files
    setRelatedFiles(selectedConcept.files)

    // Find related concepts
    const relatedConceptIds = links
      .filter((link) => link.source === selectedConcept.id || link.target === selectedConcept.id)
      .map((link) => (link.source === selectedConcept.id ? link.target : link.source))

    const uniqueRelatedConceptIds = [...new Set(relatedConceptIds)]
    const relatedConceptsList = concepts.filter((concept) => uniqueRelatedConceptIds.includes(concept.id))

    setRelatedConcepts(relatedConceptsList)
  }, [selectedConcept, concepts, links])

  // Generate simulated concepts
  const generateConcepts = (tree: TreeNode): Concept[] => {
    // Extract file nodes
    const fileNodes: TreeNode[] = []
    const extractFiles = (node: TreeNode) => {
      if (node.type === "blob") {
        fileNodes.push(node)
      } else if (node.children) {
        node.children.forEach(extractFiles)
      }
    }
    extractFiles(tree)

    // Filter to only include code files
    const codeFiles = fileNodes.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      return ["js", "jsx", "ts", "tsx", "py", "java", "rb", "go", "php", "c", "cpp", "cs"].includes(ext)
    })

    // Generate concepts based on file names and paths
    const concepts: Concept[] = []
    const conceptTypes: ("component" | "hook" | "utility" | "context" | "model" | "api" | "concept")[] = [
      "component",
      "hook",
      "utility",
      "context",
      "model",
      "api",
      "concept",
    ]

    // Helper to generate a concept name from a file
    const generateConceptName = (file: TreeNode): string => {
      const fileName = file.name.split(".")[0]

      // Convert kebab-case or snake_case to PascalCase
      return fileName
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
    }

    // Generate component concepts
    const componentFiles = codeFiles.filter(
      (file) =>
        file.name.includes("component") ||
        file.path.includes("components") ||
        file.name.match(/^[A-Z][a-zA-Z]*\.(jsx?|tsx?)$/),
    )

    componentFiles.forEach((file) => {
      const name = generateConceptName(file)
      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "component",
        description: `The ${name} component ${generateComponentDescription()}`,
        files: [file.path],
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("component"),
      })
    })

    // Generate hook concepts
    const hookFiles = codeFiles.filter((file) => file.name.startsWith("use") || file.path.includes("hooks"))

    hookFiles.forEach((file) => {
      const name = generateConceptName(file)
      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "hook",
        description: `The ${name} hook ${generateHookDescription()}`,
        files: [file.path],
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("hook"),
      })
    })

    // Generate utility concepts
    const utilityFiles = codeFiles.filter(
      (file) => file.name.includes("util") || file.path.includes("utils") || file.path.includes("helpers"),
    )

    utilityFiles.forEach((file) => {
      const name = generateConceptName(file)
      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "utility",
        description: `The ${name} utility ${generateUtilityDescription()}`,
        files: [file.path],
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("utility"),
      })
    })

    // Generate context concepts
    const contextFiles = codeFiles.filter(
      (file) =>
        file.name.includes("context") ||
        file.name.includes("provider") ||
        file.path.includes("contexts") ||
        file.path.includes("providers"),
    )

    contextFiles.forEach((file) => {
      const name = generateConceptName(file)
      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "context",
        description: `The ${name} context ${generateContextDescription()}`,
        files: [file.path],
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("context"),
      })
    })

    // Generate model concepts
    const modelFiles = codeFiles.filter(
      (file) =>
        file.name.includes("model") ||
        file.name.includes("schema") ||
        file.path.includes("models") ||
        file.path.includes("schemas"),
    )

    modelFiles.forEach((file) => {
      const name = generateConceptName(file)
      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "model",
        description: `The ${name} model ${generateModelDescription()}`,
        files: [file.path],
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("model"),
      })
    })

    // Generate API concepts
    const apiFiles = codeFiles.filter(
      (file) =>
        file.name.includes("api") ||
        file.name.includes("service") ||
        file.path.includes("api") ||
        file.path.includes("services"),
    )

    apiFiles.forEach((file) => {
      const name = generateConceptName(file)
      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "api",
        description: `The ${name} API ${generateApiDescription()}`,
        files: [file.path],
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("api"),
      })
    })

    // Generate abstract concepts
    const abstractConcepts = [
      "Authentication",
      "Authorization",
      "DataFetching",
      "StateManagement",
      "Routing",
      "ErrorHandling",
      "Caching",
      "Internationalization",
      "Accessibility",
      "ThemeManagement",
      "FormHandling",
      "DataValidation",
      "EventHandling",
      "Persistence",
      "Notifications",
    ]

    // Add 5-10 abstract concepts
    const numAbstractConcepts = Math.floor(Math.random() * 6) + 5
    for (let i = 0; i < numAbstractConcepts; i++) {
      const name = abstractConcepts[i]

      // Find related files
      const relatedFiles = codeFiles
        .filter((file) => file.path.toLowerCase().includes(name.toLowerCase()))
        .map((file) => file.path)
        .slice(0, 3)

      concepts.push({
        id: `concept_${concepts.length}`,
        name,
        type: "concept",
        description: `${name} ${generateConceptDescription()}`,
        files: relatedFiles,
        importance: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        dependencies: [],
        tags: generateTags("concept"),
      })
    }

    return concepts
  }

  // Generate simulated links between concepts
  const generateLinks = (concepts: Concept[]): ConceptLink[] => {
    const links: ConceptLink[] = []
    const linkTypes: ("uses" | "implements" | "extends" | "creates" | "consumes" | "relates")[] = [
      "uses",
      "implements",
      "extends",
      "creates",
      "consumes",
      "relates",
    ]

    // Create links between concepts
    concepts.forEach((source) => {
      // Each concept has 1-3 outgoing links
      const numLinks = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < numLinks; i++) {
        // Find a target concept that isn't the source
        const potentialTargets = concepts.filter((c) => c.id !== source.id)

        if (potentialTargets.length === 0) continue

        const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
        const linkType = linkTypes[Math.floor(Math.random() * linkTypes.length)]

        // Check if this link already exists
        const linkExists = links.some(
          (link) =>
            (link.source === source.id && link.target === target.id) ||
            (link.source === target.id && link.target === source.id),
        )

        if (!linkExists) {
          links.push({
            source: source.id,
            target: target.id,
            type: linkType,
            strength: Math.floor(Math.random() * 10) + 1,
            description: generateLinkDescription(source.name, target.name, linkType),
          })

          // Update dependencies
          source.dependencies.push(target.id)
        }
      }
    })

    return links
  }

  // Generate component description
  const generateComponentDescription = () => {
    const descriptions = [
      "is responsible for rendering the user interface for displaying and interacting with data.",
      "provides a reusable UI element that encapsulates complex rendering logic.",
      "handles user input and triggers appropriate actions based on interactions.",
      "displays information in a structured format with sorting and filtering capabilities.",
      "manages its own internal state while exposing a clean API for parent components.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate hook description
  const generateHookDescription = () => {
    const descriptions = [
      "encapsulates reusable stateful logic that can be shared across multiple components.",
      "manages side effects and provides a clean way to interact with external systems.",
      "abstracts complex state management into a simple, declarative API.",
      "provides a way to reuse stateful logic between components without changing their structure.",
      "handles asynchronous operations and manages loading, error, and success states.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate utility description
  const generateUtilityDescription = () => {
    const descriptions = [
      "provides pure functions for data transformation and manipulation.",
      "contains helper functions that are used throughout the application.",
      "implements common algorithms and data processing logic.",
      "offers a collection of stateless functions for formatting and validation.",
      "contains reusable logic for common operations like date formatting and string manipulation.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate context description
  const generateContextDescription = () => {
    const descriptions = [
      "provides a way to share state across the component tree without prop drilling.",
      "manages global application state that needs to be accessed by many components.",
      "encapsulates complex state logic and provides it to components that need it.",
      "implements the Context API pattern for sharing data across the component hierarchy.",
      "maintains application-wide state and provides methods to update it.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate model description
  const generateModelDescription = () => {
    const descriptions = [
      "defines the structure and validation rules for data in the application.",
      "represents a domain entity with properties and behaviors.",
      "encapsulates business logic and data validation rules.",
      "provides methods for creating, reading, updating, and deleting data.",
      "implements the data schema and relationships between entities.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate API description
  const generateApiDescription = () => {
    const descriptions = [
      "provides methods for interacting with external services and APIs.",
      "encapsulates HTTP requests and response handling logic.",
      "abstracts the communication with backend services.",
      "handles authentication, error handling, and data transformation for API calls.",
      "implements the repository pattern for data access.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate concept description
  const generateConceptDescription = () => {
    const descriptions = [
      "is a core architectural concept that spans multiple components and modules.",
      "represents a cross-cutting concern that affects multiple parts of the application.",
      "is an abstract pattern implemented across different parts of the codebase.",
      "is a fundamental principle that guides the design and implementation of the system.",
      "is a high-level abstraction that encapsulates complex interactions between components.",
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  // Generate link description
  const generateLinkDescription = (sourceName: string, targetName: string, type: string) => {
    switch (type) {
      case "uses":
        return `${sourceName} uses ${targetName} to implement its functionality.`
      case "implements":
        return `${sourceName} implements the interface or contract defined by ${targetName}.`
      case "extends":
        return `${sourceName} extends or inherits functionality from ${targetName}.`
      case "creates":
        return `${sourceName} is responsible for creating instances of ${targetName}.`
      case "consumes":
        return `${sourceName} consumes data or services provided by ${targetName}.`
      case "relates":
        return `${sourceName} has a conceptual relationship with ${targetName}.`
      default:
        return `${sourceName} is related to ${targetName}.`
    }
  }

  // Generate tags based on concept type
  const generateTags = (type: string) => {
    const commonTags = ["frontend", "backend", "core", "feature"]

    const typeTags: Record<string, string[]> = {
      component: ["ui", "interactive", "stateful", "stateless", "layout", "form"],
      hook: ["state", "effect", "context", "ref", "callback", "memo"],
      utility: ["helper", "formatter", "validator", "transformer", "calculator"],
      context: ["provider", "consumer", "store", "global-state", "theme"],
      model: ["entity", "schema", "data", "validation", "orm"],
      api: ["service", "client", "rest", "graphql", "fetch"],
      concept: ["pattern", "architecture", "design", "principle", "abstraction"],
    }

    const availableTags = [...commonTags, ...(typeTags[type] || [])]

    // Select 1-3 random tags
    const numTags = Math.floor(Math.random() * 3) + 1
    const selectedTags = []

    for (let i = 0; i < numTags; i++) {
      const randomTag = availableTags[Math.floor(Math.random() * availableTags.length)]
      if (!selectedTags.includes(randomTag)) {
        selectedTags.push(randomTag)
      }
    }

    return selectedTags
  }

  // Initialize visualization
  const initializeVisualization = () => {
    if (!svgRef.current || !containerRef.current) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove()

    // Get container dimensions
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Create SVG
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height)

    // Filter concepts based on search and filters
    const filteredConcepts = concepts.filter((concept) => {
      // Filter by search term
      if (
        searchTerm &&
        !concept.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !concept.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }

      // Filter by type
      if (filterType && concept.type !== filterType) {
        return false
      }

      // Filter by importance
      if (concept.importance < filterImportance[0] || concept.importance > filterImportance[1]) {
        return false
      }

      // Filter by complexity
      if (concept.complexity < filterComplexity[0] || concept.complexity > filterComplexity[1]) {
        return false
      }

      return true
    })

    // Filter links to only include filtered concepts
    const filteredConceptIds = filteredConcepts.map((c) => c.id)
    const filteredLinks = links.filter(
      (link) => filteredConceptIds.includes(link.source) && filteredConceptIds.includes(link.target),
    )

    // Create nodes for D3
    const nodes = filteredConcepts.map((concept) => ({
      id: concept.id,
      name: concept.name,
      type: concept.type,
      importance: concept.importance,
      complexity: concept.complexity,
      radius: 5 + concept.importance / 2,
    }))

    // Create links for D3
    const d3Links = filteredLinks.map((link) => ({
      source: link.source,
      target: link.target,
      type: link.type,
      strength: link.strength,
    }))

    // Choose visualization based on view mode
    if (viewMode === "graph") {
      createForceDirectedGraph(svg, nodes, d3Links, width, height)
    } else if (viewMode === "hierarchy") {
      createHierarchicalLayout(svg, nodes, d3Links, width, height)
    } else if (viewMode === "radial") {
      createRadialLayout(svg, nodes, d3Links, width, height)
    }
  }

  // Create force-directed graph
  const createForceDirectedGraph = (svg: any, nodes: any[], links: any[], width: number, height: number) => {
    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
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

    // Store simulation reference
    simulationRef.current = simulation

    // Create a group for links
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.strength))
      .attr("stroke", (d: any) => getLinkColor(d.type))
      .attr("stroke-opacity", 0.6)
      .on("mouseover", (event: any, d: any) => {
        const linkData = filteredLinks.find((l) => l.source === d.source.id && l.target === d.target.id)
        setSelectedLink(linkData || null)
      })

    // Create a group for nodes
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => getNodeColor(d, conceptGrouping))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event: any, d: any) => {
        const conceptData = concepts.find((c) => c.id === d.id)
        setSelectedConcept(conceptData || null)
      })
      .on("mouseout", (event: any, d: any) => {
        // Only clear if not clicked
        if (!d.clicked) {
          setSelectedConcept(null)
        }
      })
      .on("click", (event: any, d: any) => {
        const conceptData = concepts.find((c) => c.id === d.id)

        // Toggle clicked state
        d.clicked = !d.clicked

        // Clear clicked state on all other nodes
        nodes.forEach((n: any) => {
          if (n !== d) {
            n.clicked = false
          }
        })

        setSelectedConcept(d.clicked ? conceptData || null : null)
      })
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

    // Add labels to nodes
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

  // Create hierarchical layout
  const createHierarchicalLayout = (svg: any, nodes: any[], links: any[], width: number, height: number) => {
    // Group nodes by type
    const nodesByType: Record<string, any[]> = {}

    nodes.forEach((node) => {
      if (!nodesByType[node.type]) {
        nodesByType[node.type] = []
      }
      nodesByType[node.type].push(node)
    })

    // Calculate positions
    const types = Object.keys(nodesByType)
    const typeSpacing = height / (types.length + 1)

    types.forEach((type, i) => {
      const y = (i + 1) * typeSpacing
      const nodesOfType = nodesByType[type]
      const nodeSpacing = width / (nodesOfType.length + 1)

      nodesOfType.forEach((node, j) => {
        node.x = (j + 1) * nodeSpacing
        node.y = y
      })
    })

    // Draw links
    svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", (d: any) => nodes.find((n: any) => n.id === d.source)?.x || 0)
      .attr("y1", (d: any) => nodes.find((n: any) => n.id === d.source)?.y || 0)
      .attr("x2", (d: any) => nodes.find((n: any) => n.id === d.target)?.x || 0)
      .attr("y2", (d: any) => nodes.find((n: any) => n.id === d.target)?.y || 0)
      .attr("stroke-width", (d: any) => Math.sqrt(d.strength))
      .attr("stroke", (d: any) => getLinkColor(d.type))
      .attr("stroke-opacity", 0.6)
      .on("mouseover", (event: any, d: any) => {
        const linkData = filteredLinks.find((l) => l.source === d.source && l.target === d.target)
        setSelectedLink(linkData || null)
      })

    // Draw nodes
    svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => getNodeColor(d, conceptGrouping))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event: any, d: any) => {
        const conceptData = concepts.find((c) => c.id === d.id)
        setSelectedConcept(conceptData || null)
      })
      .on("mouseout", (event: any, d: any) => {
        setSelectedConcept(null)
      })
      .on("click", (event: any, d: any) => {
        const conceptData = concepts.find((c) => c.id === d.id)
        setSelectedConcept(conceptData || null)
      })

    // Add labels to nodes
    svg
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
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y)
      .style("pointer-events", "none")
  }

  // Create radial layout
  const createRadialLayout = (svg: any, nodes: any[], links: any[], width: number, height: number) => {
    const radius = Math.min(width, height) / 2

    // Create a hierarchy from the nodes
    const root = d3
      .hierarchy({ children: nodes })
      .sum(() => 1)
      .sort((a, b) => (b.data.importance || 0) - (a.data.importance || 0))

    // Create a radial pack layout
    const pack = d3
      .pack()
      .size([2 * radius, 2 * radius])
      .padding(3)

    // Generate the layout
    const packedData = pack(root)

    // Draw links
    svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", (d: any) => {
        const sourceNode = packedData.descendants().find((node: any) => node.data.id === d.source)
        return sourceNode ? sourceNode.x : 0
      })
      .attr("y1", (d: any) => {
        const sourceNode = packedData.descendants().find((node: any) => node.data.id === d.source)
        return sourceNode ? sourceNode.y : 0
      })
      .attr("x2", (d: any) => {
        const targetNode = packedData.descendants().find((node: any) => node.data.id === d.target)
        return targetNode ? targetNode.x : 0
      })
      .attr("y2", (d: any) => {
        const targetNode = packedData.descendants().find((node: any) => node.data.id === d.target)
        return targetNode ? targetNode.y : 0
      })
      .attr("stroke-width", (d: any) => Math.sqrt(d.strength))
      .attr("stroke", (d: any) => getLinkColor(d.type))
      .attr("stroke-opacity", 0.6)
      .on("mouseover", (event: any, d: any) => {
        const linkData = filteredLinks.find((l) => l.source === d.source && l.target === d.target)
        setSelectedLink(linkData || null)
      })

    // Draw nodes
    svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .attr("class", "nodes")
      .selectAll("circle")
      .data(packedData.descendants().slice(1))
      .enter()
      .append("circle")
      .attr("cx", (d: any) => d.x - radius)
      .attr("cy", (d: any) => d.y - radius)
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => getNodeColor(d.data, conceptGrouping))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event: any, d: any) => {
        const conceptData = concepts.find((c) => c.id === d.data.id)
        setSelectedConcept(conceptData || null)
      })
      .on("mouseout", (event: any, d: any) => {
        setSelectedConcept(null)
      })
      .on("click", (event: any, d: any) => {
        const conceptData = concepts.find((c) => c.id === d.data.id)
        setSelectedConcept(conceptData || null)
      })

    // Add labels to nodes
    svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .attr("class", "labels")
      .selectAll("text")
      .data(packedData.descendants().slice(1))
      .enter()
      .append("text")
      .text((d: any) => d.data.name)
      .attr("font-size", 10)
      .attr("dx", 0)
      .attr("dy", 0)
      .attr("x", (d: any) => d.x - radius)
      .attr("y", (d: any) => d.y - radius)
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
  }

  // Update visualization
  const updateVisualization = () => {
    if (!svgRef.current || !containerRef.current) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove()

    // Get container dimensions
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Create SVG
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height)

    // Filter concepts based on search and filters
    const filteredConcepts = concepts.filter((concept) => {
      // Filter by search term
      if (
        searchTerm &&
        !concept.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !concept.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }

      // Filter by type
      if (filterType && concept.type !== filterType) {
        return false
      }

      // Filter by importance
      if (concept.importance < filterImportance[0] || concept.importance > filterImportance[1]) {
        return false
      }

      // Filter by complexity
      if (concept.complexity < filterComplexity[0] || concept.complexity > filterComplexity[1]) {
        return false
      }

      return true
    })

    // Filter links to only include filtered concepts
    const filteredConceptIds = filteredConcepts.map((c) => c.id)
    const filteredLinks = links.filter(
      (link) => filteredConceptIds.includes(link.source) && filteredConceptIds.includes(link.target),
    )

    // Create nodes for D3
    const nodes = filteredConcepts.map((concept) => ({
      id: concept.id,
      name: concept.name,
      type: concept.type,
      importance: concept.importance,
      complexity: concept.complexity,
      radius: 5 + concept.importance / 2,
    }))

    // Create links for D3
    const d3Links = filteredLinks.map((link) => ({
      source: link.source,
      target: link.target,
      type: link.type,
      strength: link.strength,
    }))

    // Choose visualization based on view mode
    if (viewMode === "graph") {
      createForceDirectedGraph(svg, nodes, d3Links, width, height)
    } else if (viewMode === "hierarchy") {
      createHierarchicalLayout(svg, nodes, d3Links, width, height)
    } else if (viewMode === "radial") {
      createRadialLayout(svg, nodes, d3Links, width, height)
    }
  }

  // Get node color based on concept grouping
  const getNodeColor = (node: any, conceptGrouping: string) => {
    switch (conceptGrouping) {
      case "type":
        switch (node.type) {
          case "component":
            return "#6366f1" // Indigo
          case "hook":
            return "#06b6d4" // Cyan
          case "utility":
            return "#10b981" // Emerald
          case "context":
            return "#eab308" // Yellow
          case "model":
            return "#f43f5e" // Rose
          case "api":
            return "#8b5cf6" // Violet
          case "concept":
            return "#3b82f6" // Blue
          default:
            return "#9ca3af" // Gray
        }
      case "complexity":
        const complexityScale = d3.scaleLinear().domain([1, 10]).range(["#f0fdfa", "#064e3b"]) // Emerald gradient
        return complexityScale(node.complexity)
      case "importance":
        const importanceScale = d3.scaleLinear().domain([1, 10]).range(["#fff7ed", "#be123c"]) // Rose gradient
        return importanceScale(node.importance)
      default:
        return "#9ca3af" // Gray
    }
  }

  // Get link color based on link type
  const getLinkColor = (type: string) => {
    switch (type) {
      case "uses":
        return "#9ca3af" // Gray
      case "implements":
        return "#6b7280" // Cool Gray
      case "extends":
        return "#4b5563" // Gray
      case "creates":
        return "#374151" // Gray
      case "consumes":
        return "#1f2937" // Gray
      case "relates":
        return "#000000" // Black
      default:
        return "#9ca3af" // Gray
    }
  }

  return (
    
      
        \
  Knowledge
  Graph
  Explorer

  )
}
