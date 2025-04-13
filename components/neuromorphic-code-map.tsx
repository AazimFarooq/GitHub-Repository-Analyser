"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TreeNode, CodeDependency } from "@/types/github"
import { Brain, Zap, Maximize2, Minimize2, RotateCw, Sparkles, Activity, Braces } from "lucide-react"
import * as d3 from "d3"

type NeuromorphicCodeMapProps = {
  tree: TreeNode
  dependencies: CodeDependency[]
}

export function NeuromorphicCodeMap({ tree, dependencies }: NeuromorphicCodeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [neuronCount, setNeuronCount] = useState(100)
  const [synapseStrength, setSynapseStrength] = useState(50)
  const [activationThreshold, setActivationThreshold] = useState(30)
  const [viewMode, setViewMode] = useState<"neural" | "cognitive" | "emotional">("neural")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeNeurons, setActiveNeurons] = useState<Set<string>>(new Set())
  const [neurons, setNeurons] = useState<any[]>([])
  const [synapses, setSynapses] = useState<any[]>([])
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const animationFrameRef = useRef<number | null>(null)
  const simulationStepRef = useRef(0)

  // Initialize neural network
  useEffect(() => {
    if (!tree) return

    // Extract file nodes for visualization
    const fileNodes: TreeNode[] = []
    const extractFiles = (node: TreeNode) => {
      if (node.type === "blob") {
        fileNodes.push(node)
      } else if (node.children) {
        node.children.forEach(extractFiles)
      }
    }
    extractFiles(tree)

    // Create neurons for each file (limit to 150 for performance)
    const newNeurons = fileNodes.slice(0, 150).map((file, index) => {
      const fileType = file.name.split(".").pop() || ""

      // Determine neuron type based on file extension
      let neuronType = "interneuron" // default
      if (/\.(js|jsx|ts|tsx)$/.test(file.name)) neuronType = "excitatory"
      else if (/\.(css|scss|less)$/.test(file.name)) neuronType = "inhibitory"
      else if (/\.(json|yml|yaml|xml)$/.test(file.name)) neuronType = "modulatory"
      else if (/\.(md|txt)$/.test(file.name)) neuronType = "sensory"

      // Calculate neuron properties
      const fileSize = file.size || 1000
      const complexity = Math.log(fileSize) / 10

      return {
        id: file.path,
        x: Math.random() * 800,
        y: Math.random() * 600,
        fileName: file.name,
        fileType,
        neuronType,
        size: 5 + complexity * 2,
        threshold: 0.3 + Math.random() * 0.4,
        activation: 0,
        restingPotential: -70,
        membrane: -70,
        refractoryPeriod: 0,
        lastFired: 0,
        connections: [],
        cognitive: {
          abstraction: Math.random(),
          complexity: complexity,
          modularity: Math.random(),
        },
        emotional: {
          joy: Math.random() * 0.5,
          frustration: Math.random() * 0.3,
          pride: Math.random() * 0.7,
        },
      }
    })

    // Create synapses based on dependencies
    const newSynapses: any[] = []

    // Add synapses from explicit dependencies
    dependencies.forEach((dep) => {
      const sourceNeuron = newNeurons.find((n) => n.id === dep.source)
      const targetNeuron = newNeurons.find((n) => n.id === dep.target)

      if (sourceNeuron && targetNeuron) {
        const weight = (dep.weight || 1) * 0.2
        const synapse = {
          source: sourceNeuron,
          target: targetNeuron,
          weight,
          type: dep.type,
          plasticity: Math.random() * 0.2,
          lastActive: 0,
        }

        newSynapses.push(synapse)
        sourceNeuron.connections.push(targetNeuron)
      }
    })

    // Add additional synapses based on file proximity and types
    newNeurons.forEach((source, i) => {
      // Each neuron connects to 2-5 other neurons
      const connectionCount = Math.floor(Math.random() * 4) + 2

      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * newNeurons.length)
        if (targetIndex !== i) {
          const target = newNeurons[targetIndex]

          // Check if connection already exists
          if (
            !newSynapses.some(
              (s) =>
                (s.source.id === source.id && s.target.id === target.id) ||
                (s.source.id === target.id && s.target.id === source.id),
            )
          ) {
            // Determine synapse weight based on neuron types
            let weight = 0.1 + Math.random() * 0.3

            // Files of same type have stronger connections
            if (source.fileType === target.fileType) {
              weight += 0.2
            }

            // Excitatory neurons have stronger outgoing connections
            if (source.neuronType === "excitatory") {
              weight += 0.1
            }

            // Inhibitory neurons have negative weights
            if (source.neuronType === "inhibitory") {
              weight *= -1
            }

            const synapse = {
              source,
              target,
              weight,
              type: "proximity",
              plasticity: Math.random() * 0.3,
              lastActive: 0,
            }

            newSynapses.push(synapse)
            source.connections.push(target)
          }
        }
      }
    })

    setNeurons(newNeurons)
    setSynapses(newSynapses)

    // Start rendering
    startRendering()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [tree, dependencies])

  // Handle neuron count changes
  useEffect(() => {
    if (neurons.length === 0) return

    // Adjust visible neurons based on count
    const visibleNeurons = [...neurons]

    // Show only the specified number of neurons
    visibleNeurons.forEach((neuron, index) => {
      neuron.visible = index < neuronCount
    })

    setNeurons(visibleNeurons)

    // Update synapses to only include visible neurons
    const visibleSynapses = synapses.filter(
      (synapse) => synapse.source.visible !== false && synapse.target.visible !== false,
    )

    setSynapses(visibleSynapses)
  }, [neuronCount, neurons.length])

  // Handle synapse strength changes
  useEffect(() => {
    if (synapses.length === 0) return

    const updatedSynapses = synapses.map((synapse) => ({
      ...synapse,
      weight: synapse.weight * (synapseStrength / 50),
    }))

    setSynapses(updatedSynapses)
  }, [synapseStrength])

  // Start rendering loop
  const startRendering = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const render = () => {
      if (!canvas || !containerRef.current) return

      // Resize canvas to container
      canvas.width = containerRef.current.clientWidth
      canvas.height = containerRef.current.clientHeight

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw based on view mode
      if (viewMode === "neural") {
        drawNeuralView(ctx, canvas.width, canvas.height)
      } else if (viewMode === "cognitive") {
        drawCognitiveView(ctx, canvas.width, canvas.height)
      } else if (viewMode === "emotional") {
        drawEmotionalView(ctx, canvas.width, canvas.height)
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    animationFrameRef.current = requestAnimationFrame(render)
  }

  // Neural network simulation step
  const simulateStep = () => {
    if (neurons.length === 0 || !isSimulating) return

    simulationStepRef.current += 1

    // Create a copy of neurons to update
    const updatedNeurons = [...neurons]
    const newActiveNeurons = new Set<string>()

    // Randomly stimulate some neurons to start activity
    if (simulationStepRef.current % 60 === 0) {
      const randomNeuronIndex = Math.floor(Math.random() * updatedNeurons.length)
      updatedNeurons[randomNeuronIndex].activation = 1
    }

    // Update each neuron
    updatedNeurons.forEach((neuron) => {
      // Skip neurons in refractory period
      if (neuron.refractoryPeriod > 0) {
        neuron.refractoryPeriod -= 1
        return
      }

      // Calculate input from connected neurons
      let input = 0
      synapses.forEach((synapse) => {
        if (synapse.target.id === neuron.id && synapse.source.activation > 0) {
          input += synapse.source.activation * synapse.weight

          // Apply Hebbian learning (synapses that fire together, wire together)
          synapse.weight += synapse.plasticity * 0.01
          synapse.lastActive = simulationStepRef.current
        }
      })

      // Update membrane potential
      const leakFactor = 0.95 // membrane leakage
      neuron.membrane = neuron.membrane * leakFactor + input * 30

      // Check if neuron fires
      const firingThreshold = -55 + (activationThreshold - 30) // -55 to -25 based on slider

      if (neuron.membrane > firingThreshold) {
        // Neuron fires
        neuron.activation = 1
        neuron.membrane = neuron.restingPotential
        neuron.refractoryPeriod = 5 // Refractory period in simulation steps
        neuron.lastFired = simulationStepRef.current
        newActiveNeurons.add(neuron.id)
      } else {
        // Neuron activation decays
        neuron.activation *= 0.9
      }
    })

    setNeurons(updatedNeurons)
    setActiveNeurons(newActiveNeurons)
  }

  // Start/stop simulation
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      simulateStep()
    }, 50 / simulationSpeed)

    return () => clearInterval(interval)
  }, [isSimulating, simulationSpeed, neurons, synapses, activationThreshold])

  // Draw neural network view
  const drawNeuralView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw synapses
    synapses.forEach((synapse) => {
      const source = synapse.source
      const target = synapse.target

      // Skip if either neuron is not visible
      if (source.visible === false || target.visible === false) return

      // Determine if synapse is active
      const isActive = source.activation > 0.5
      const timeSinceActive = simulationStepRef.current - synapse.lastActive
      const recentlyActive = timeSinceActive < 20

      // Set line style based on synapse type and activity
      ctx.beginPath()

      if (synapse.weight > 0) {
        // Excitatory synapse (positive weight)
        if (isActive || recentlyActive) {
          // Active synapse
          const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y)
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)") // Blue
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")
          ctx.strokeStyle = gradient
          ctx.lineWidth = Math.abs(synapse.weight) * 3
        } else {
          // Inactive synapse
          ctx.strokeStyle = `rgba(59, 130, 246, ${Math.abs(synapse.weight) * 0.3})`
          ctx.lineWidth = Math.abs(synapse.weight) * 1.5
        }
      } else {
        // Inhibitory synapse (negative weight)
        if (isActive || recentlyActive) {
          // Active synapse
          const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y)
          gradient.addColorStop(0, "rgba(236, 72, 153, 0.8)") // Pink
          gradient.addColorStop(1, "rgba(236, 72, 153, 0.2)")
          ctx.strokeStyle = gradient
          ctx.lineWidth = Math.abs(synapse.weight) * 3
        } else {
          // Inactive synapse
          ctx.strokeStyle = `rgba(236, 72, 153, ${Math.abs(synapse.weight) * 0.3})`
          ctx.lineWidth = Math.abs(synapse.weight) * 1.5
        }
      }

      // Draw synapse line
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()

      // Draw direction arrow
      if (Math.abs(synapse.weight) > 0.2) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x)
        const arrowLength = 10
        const arrowWidth = 4

        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2

        ctx.beginPath()
        ctx.moveTo(midX, midY)
        ctx.lineTo(
          midX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
          midY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle),
        )
        ctx.lineTo(
          midX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
          midY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle),
        )
        ctx.closePath()
        ctx.fillStyle = synapse.weight > 0 ? "rgba(59, 130, 246, 0.8)" : "rgba(236, 72, 153, 0.8)"
        ctx.fill()
      }
    })

    // Draw neurons
    neurons.forEach((neuron) => {
      if (neuron.visible === false) return

      // Skip neurons that are too small to see
      if (neuron.size < 1) return

      // Determine if neuron is active
      const isActive = neuron.activation > 0.5
      const timeSinceActive = simulationStepRef.current - neuron.lastFired
      const recentlyActive = timeSinceActive < 10

      // Set neuron style based on type and activity
      ctx.beginPath()

      let baseColor
      switch (neuron.neuronType) {
        case "excitatory":
          baseColor = [59, 130, 246] // Blue
          break
        case "inhibitory":
          baseColor = [236, 72, 153] // Pink
          break
        case "modulatory":
          baseColor = [245, 158, 11] // Amber
          break
        case "sensory":
          baseColor = [16, 185, 129] // Green
          break
        default:
          baseColor = [100, 116, 139] // Slate
      }

      // Draw neuron body
      if (isActive || recentlyActive) {
        // Active neuron
        const glowSize = neuron.size * 3
        const gradient = ctx.createRadialGradient(neuron.x, neuron.y, neuron.size * 0.5, neuron.x, neuron.y, glowSize)
        gradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 1)`)
        gradient.addColorStop(0.3, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.5)`)
        gradient.addColorStop(1, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0)`)

        ctx.fillStyle = gradient
        ctx.arc(neuron.x, neuron.y, glowSize, 0, Math.PI * 2)
        ctx.fill()

        // Neuron core
        ctx.beginPath()
        ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`
        ctx.fill()
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else {
        // Inactive neuron
        ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${0.3 + neuron.activation * 0.7})`
        ctx.fill()
        ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.8)`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw dendrites (small branches) for larger neurons
      if (neuron.size > 6) {
        const dendritesCount = Math.floor(neuron.size)
        const dendriteLength = neuron.size * 1.5

        for (let i = 0; i < dendritesCount; i++) {
          const angle = (Math.PI * 2 * i) / dendritesCount
          const startX = neuron.x + Math.cos(angle) * neuron.size
          const startY = neuron.y + Math.sin(angle) * neuron.size
          const endX = startX + Math.cos(angle) * dendriteLength * (0.5 + Math.random() * 0.5)
          const endY = startY + Math.sin(angle) * dendriteLength * (0.5 + Math.random() * 0.5)

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${0.2 + neuron.activation * 0.3})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    })

    // Draw neuron labels for active neurons
    neurons.forEach((neuron) => {
      if (neuron.visible === false) return

      const isActive = neuron.activation > 0.5
      const timeSinceActive = simulationStepRef.current - neuron.lastFired
      const recentlyActive = timeSinceActive < 20

      if (isActive || recentlyActive || activeNeurons.has(neuron.id)) {
        ctx.font = "10px sans-serif"
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.fillText(neuron.fileName, neuron.x, neuron.y - neuron.size - 5)
      }
    })
  }

  // Draw cognitive view
  const drawCognitiveView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create a force-directed layout
    const simulation = d3
      .forceSimulation(neurons)
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "link",
        d3
          .forceLink(synapses)
          .id((d: any) => d.id)
          .distance(100),
      )
      .stop()

    // Run simulation for a few ticks
    for (let i = 0; i < 10; i++) {
      simulation.tick()
    }

    // Draw cognitive clusters
    const clusters: { [key: string]: any[] } = {
      high_abstraction: [],
      high_complexity: [],
      high_modularity: [],
      mixed: [],
    }

    // Assign neurons to cognitive clusters
    neurons.forEach((neuron) => {
      if (neuron.visible === false) return

      if (neuron.cognitive.abstraction > 0.7) {
        clusters.high_abstraction.push(neuron)
      } else if (neuron.cognitive.complexity > 0.7) {
        clusters.high_complexity.push(neuron)
      } else if (neuron.cognitive.modularity > 0.7) {
        clusters.high_modularity.push(neuron)
      } else {
        clusters.mixed.push(neuron)
      }
    })

    // Draw cluster backgrounds
    Object.entries(clusters).forEach(([clusterType, clusterNeurons]) => {
      if (clusterNeurons.length === 0) return

      // Calculate cluster center and radius
      let centerX = 0
      let centerY = 0

      clusterNeurons.forEach((neuron) => {
        centerX += neuron.x
        centerY += neuron.y
      })

      centerX /= clusterNeurons.length
      centerY /= clusterNeurons.length

      // Calculate radius to encompass all neurons
      let radius = 0
      clusterNeurons.forEach((neuron) => {
        const distance = Math.sqrt(Math.pow(neuron.x - centerX, 2) + Math.pow(neuron.y - centerY, 2))
        radius = Math.max(radius, distance + neuron.size + 20)
      })

      // Draw cluster background
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)

      let fillColor
      switch (clusterType) {
        case "high_abstraction":
          fillColor = "rgba(59, 130, 246, 0.1)" // Blue
          break
        case "high_complexity":
          fillColor = "rgba(236, 72, 153, 0.1)" // Pink
          break
        case "high_modularity":
          fillColor = "rgba(16, 185, 129, 0.1)" // Green
          break
        default:
          fillColor = "rgba(100, 116, 139, 0.1)" // Slate
      }

      ctx.fillStyle = fillColor
      ctx.fill()

      // Draw cluster label
      ctx.font = "12px sans-serif"
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"

      let label
      switch (clusterType) {
        case "high_abstraction":
          label = "Abstract Components"
          break
        case "high_complexity":
          label = "Complex Logic"
          break
        case "high_modularity":
          label = "Modular Structure"
          break
        default:
          label = "Mixed Components"
      }

      ctx.fillText(label, centerX, centerY - radius - 10)
    })

    // Draw connections
    synapses.forEach((synapse) => {
      const source = synapse.source
      const target = synapse.target

      // Skip if either neuron is not visible
      if (source.visible === false || target.visible === false) return

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)

      // Color based on cognitive relationship
      let strokeColor = "rgba(100, 116, 139, 0.2)" // Default gray

      if (source.cognitive.abstraction > 0.7 && target.cognitive.abstraction > 0.7) {
        strokeColor = "rgba(59, 130, 246, 0.3)" // Blue for abstract-abstract
      } else if (source.cognitive.complexity > 0.7 && target.cognitive.complexity > 0.7) {
        strokeColor = "rgba(236, 72, 153, 0.3)" // Pink for complex-complex
      } else if (source.cognitive.modularity > 0.7 && target.cognitive.modularity > 0.7) {
        strokeColor = "rgba(16, 185, 129, 0.3)" // Green for modular-modular
      }

      ctx.strokeStyle = strokeColor
      ctx.lineWidth = Math.abs(synapse.weight) * 2
      ctx.stroke()
    })

    // Draw neurons
    neurons.forEach((neuron) => {
      if (neuron.visible === false) return

      ctx.beginPath()
      ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2)

      // Color based on dominant cognitive trait
      let fillColor
      if (neuron.cognitive.abstraction > Math.max(neuron.cognitive.complexity, neuron.cognitive.modularity)) {
        fillColor = "rgba(59, 130, 246, 0.7)" // Blue for abstract
      } else if (neuron.cognitive.complexity > Math.max(neuron.cognitive.abstraction, neuron.cognitive.modularity)) {
        fillColor = "rgba(236, 72, 153, 0.7)" // Pink for complex
      } else if (neuron.cognitive.modularity > Math.max(neuron.cognitive.abstraction, neuron.cognitive.complexity)) {
        fillColor = "rgba(16, 185, 129, 0.7)" // Green for modular
      } else {
        fillColor = "rgba(100, 116, 139, 0.7)" // Slate for mixed
      }

      ctx.fillStyle = fillColor
      ctx.fill()

      // Draw cognitive trait indicators
      const traitRadius = neuron.size * 1.5

      // Abstraction indicator (blue)
      ctx.beginPath()
      ctx.arc(neuron.x, neuron.y, traitRadius, 0, Math.PI * 2 * neuron.cognitive.abstraction)
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Complexity indicator (pink)
      ctx.beginPath()
      ctx.arc(neuron.x, neuron.y, traitRadius + 3, 0, Math.PI * 2 * neuron.cognitive.complexity)
      ctx.strokeStyle = "rgba(236, 72, 153, 0.8)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Modularity indicator (green)
      ctx.beginPath()
      ctx.arc(neuron.x, neuron.y, traitRadius + 6, 0, Math.PI * 2 * neuron.cognitive.modularity)
      ctx.strokeStyle = "rgba(16, 185, 129, 0.8)"
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  // Draw emotional view
  const drawEmotionalView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create emotional landscape
    const gridSize = 50
    const cellWidth = width / gridSize
    const cellHeight = height / gridSize

    // Create emotional field
    const emotionalField = Array(gridSize)
      .fill(0)
      .map(() =>
        Array(gridSize)
          .fill(0)
          .map(() => ({
            joy: 0,
            frustration: 0,
            pride: 0,
          })),
      )

    // Populate emotional field based on neurons
    neurons.forEach((neuron) => {
      if (neuron.visible === false) return

      // Calculate grid position
      const gridX = Math.floor(neuron.x / cellWidth)
      const gridY = Math.floor(neuron.y / cellHeight)

      // Ensure grid coordinates are within bounds
      if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        // Add emotional influence based on distance
        const influenceRadius = 5

        for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
          for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
            const targetX = gridX + dx
            const targetY = gridY + dy

            if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              const influence = Math.max(0, 1 - distance / influenceRadius)

              emotionalField[targetY][targetX].joy += neuron.emotional.joy * influence
              emotionalField[targetY][targetX].frustration += neuron.emotional.frustration * influence
              emotionalField[targetY][targetX].pride += neuron.emotional.pride * influence
            }
          }
        }
      }
    })

    // Normalize emotional field
    let maxJoy = 0
    let maxFrustration = 0
    let maxPride = 0

    emotionalField.forEach((row) => {
      row.forEach((cell) => {
        maxJoy = Math.max(maxJoy, cell.joy)
        maxFrustration = Math.max(maxFrustration, cell.frustration)
        maxPride = Math.max(maxPride, cell.pride)
      })
    })

    // Draw emotional landscape
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = emotionalField[y][x]

        // Skip cells with no emotional content
        if (cell.joy + cell.frustration + cell.pride < 0.1) continue

        // Determine dominant emotion
        const dominantEmotion =
          cell.joy > cell.frustration && cell.joy > cell.pride
            ? "joy"
            : cell.frustration > cell.joy && cell.frustration > cell.pride
              ? "frustration"
              : "pride"

        // Calculate color based on emotions
        const joyNorm = maxJoy > 0 ? cell.joy / maxJoy : 0
        const frustrationNorm = maxFrustration > 0 ? cell.frustration / maxFrustration : 0
        const prideNorm = maxPride > 0 ? cell.pride / maxPride : 0

        // Create color from emotion blend
        const r = Math.floor(frustrationNorm * 236)
        const g = Math.floor(joyNorm * 185)
        const b = Math.floor(prideNorm * 246)
        const a = Math.min(1, (joyNorm + frustrationNorm + prideNorm) * 0.7)

        // Draw emotional cell
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)

        // Add texture for dominant emotion
        if (dominantEmotion === "joy" && joyNorm > 0.5) {
          // Radial gradient for joy
          const gradient = ctx.createRadialGradient(
            (x + 0.5) * cellWidth,
            (y + 0.5) * cellHeight,
            1,
            (x + 0.5) * cellWidth,
            (y + 0.5) * cellHeight,
            cellWidth,
          )
          gradient.addColorStop(0, `rgba(255, 255, 100, ${joyNorm * 0.5})`)
          gradient.addColorStop(1, "rgba(255, 255, 100, 0)")

          ctx.fillStyle = gradient
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
        } else if (dominantEmotion === "frustration" && frustrationNorm > 0.5) {
          // Sharp lines for frustration
          ctx.strokeStyle = `rgba(255, 100, 100, ${frustrationNorm * 0.5})`
          ctx.lineWidth = 1

          const lineCount = Math.floor(frustrationNorm * 5)
          for (let i = 0; i < lineCount; i++) {
            ctx.beginPath()
            ctx.moveTo(x * cellWidth, (y + i / lineCount) * cellHeight)
            ctx.lineTo((x + 1) * cellWidth, (y + i / lineCount) * cellHeight)
            ctx.stroke()
          }
        } else if (dominantEmotion === "pride" && prideNorm > 0.5) {
          // Circular pattern for pride
          ctx.strokeStyle = `rgba(100, 100, 255, ${prideNorm * 0.5})`
          ctx.lineWidth = 1

          ctx.beginPath()
          ctx.arc((x + 0.5) * cellWidth, (y + 0.5) * cellHeight, cellWidth * 0.4 * prideNorm, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    // Draw neurons on top of emotional landscape
    neurons.forEach((neuron) => {
      if (neuron.visible === false) return

      ctx.beginPath()
      ctx.arc(neuron.x, neuron.y, neuron.size, 0, Math.PI * 2)

      // Color based on dominant emotion
      let fillColor
      if (neuron.emotional.joy > Math.max(neuron.emotional.frustration, neuron.emotional.pride)) {
        fillColor = "rgba(255, 255, 100, 0.7)" // Yellow for joy
      } else if (neuron.emotional.frustration > Math.max(neuron.emotional.joy, neuron.emotional.pride)) {
        fillColor = "rgba(255, 100, 100, 0.7)" // Red for frustration
      } else {
        fillColor = "rgba(100, 100, 255, 0.7)" // Blue for pride
      }

      ctx.fillStyle = fillColor
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 0.5
      ctx.stroke()

      // Draw emotional indicators
      if (neuron.size > 5) {
        // Joy indicator
        if (neuron.emotional.joy > 0.3) {
          const joySize = neuron.size * neuron.emotional.joy
          ctx.beginPath()
          ctx.arc(neuron.x, neuron.y, joySize, 0, Math.PI * 2)
          ctx.strokeStyle = "rgba(255, 255, 100, 0.5)"
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Frustration indicator
        if (neuron.emotional.frustration > 0.3) {
          const frustrationSize = neuron.size * neuron.emotional.frustration
          ctx.beginPath()
          ctx.moveTo(neuron.x - frustrationSize, neuron.y - frustrationSize)
          ctx.lineTo(neuron.x + frustrationSize, neuron.y + frustrationSize)
          ctx.moveTo(neuron.x + frustrationSize, neuron.y - frustrationSize)
          ctx.lineTo(neuron.x - frustrationSize, neuron.y + frustrationSize)
          ctx.strokeStyle = "rgba(255, 100, 100, 0.5)"
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Pride indicator
        if (neuron.emotional.pride > 0.3) {
          const prideSize = neuron.size * neuron.emotional.pride
          ctx.beginPath()
          ctx.arc(neuron.x, neuron.y, prideSize, 0, Math.PI * 2)
          ctx.setLineDash([2, 2])
          ctx.strokeStyle = "rgba(100, 100, 255, 0.5)"
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    })

    // Draw legend
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(10, height - 90, 180, 80)

    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#fff"
    ctx.fillText("Emotional Legend:", 20, height - 70)

    // Joy legend
    ctx.fillStyle = "rgba(255, 255, 100, 0.7)"
    ctx.fillRect(20, height - 50, 15, 15)
    ctx.fillStyle = "#fff"
    ctx.fillText("Joy", 45, height - 38)

    // Frustration legend
    ctx.fillStyle = "rgba(255, 100, 100, 0.7)"
    ctx.fillRect(20, height - 30, 15, 15)
    ctx.fillStyle = "#fff"
    ctx.fillText("Frustration", 45, height - 18)

    // Pride legend
    ctx.fillStyle = "rgba(100, 100, 255, 0.7)"
    ctx.fillRect(100, height - 50, 15, 15)
    ctx.fillStyle = "#fff"
    ctx.fillText("Pride", 125, height - 38)

    // Mixed legend
    const mixedGradient = ctx.createLinearGradient(100, height - 30, 115, height - 15)
    mixedGradient.addColorStop(0, "rgba(255, 255, 100, 0.7)")
    mixedGradient.addColorStop(0.5, "rgba(255, 100, 100, 0.7)")
    mixedGradient.addColorStop(1, "rgba(100, 100, 255, 0.7)")
    ctx.fillStyle = mixedGradient
    ctx.fillRect(100, height - 30, 15, 15)
    ctx.fillStyle = "#fff"
    ctx.fillText("Mixed", 125, height - 18)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  // Reset view
  const resetView = () => {
    if (!canvasRef.current || neurons.length === 0) return

    const canvas = canvasRef.current
    const updatedNeurons = [...neurons]

    // Reset neuron positions
    updatedNeurons.forEach((neuron) => {
      neuron.x = Math.random() * canvas.width
      neuron.y = Math.random() * canvas.height
      neuron.activation = 0
      neuron.membrane = neuron.restingPotential
      neuron.refractoryPeriod = 0
    })

    setNeurons(updatedNeurons)
    setActiveNeurons(new Set())
    simulationStepRef.current = 0
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Brain className="h-4 w-4 mr-2 text-primary" />
            Neuromorphic Code Mapping
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="neural" className="text-xs px-2 py-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">Neural</span>
                </TabsTrigger>
                <TabsTrigger value="cognitive" className="text-xs px-2 py-1 flex items-center gap-1">
                  <Braces className="h-3 w-3" />
                  <span className="hidden sm:inline">Cognitive</span>
                </TabsTrigger>
                <TabsTrigger value="emotional" className="text-xs px-2 py-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="hidden sm:inline">Emotional</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={resetView}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          <div
            className="relative w-full h-[500px] bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800 light:from-gray-100 light:to-gray-200 overflow-hidden"
            ref={containerRef}
          >
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs">Neuron Count</label>
                    <span className="text-xs font-medium">{neuronCount}</span>
                  </div>
                  <Slider
                    value={[neuronCount]}
                    min={10}
                    max={150}
                    step={5}
                    onValueChange={(value) => setNeuronCount(value[0])}
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs">Synapse Strength</label>
                    <span className="text-xs font-medium">{synapseStrength}%</span>
                  </div>
                  <Slider
                    value={[synapseStrength]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(value) => setSynapseStrength(value[0])}
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs">Activation Threshold</label>
                    <span className="text-xs font-medium">{activationThreshold}</span>
                  </div>
                  <Slider
                    value={[activationThreshold]}
                    min={10}
                    max={50}
                    step={5}
                    onValueChange={(value) => setActivationThreshold(value[0])}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-gray-300">
                  <p className="italic">
                    {viewMode === "neural" &&
                      "Neural view: Files as neurons with synaptic connections based on dependencies."}
                    {viewMode === "cognitive" &&
                      "Cognitive view: Code organized by abstraction, complexity, and modularity."}
                    {viewMode === "emotional" && "Emotional view: Visualize the emotional landscape of your codebase."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isSimulating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsSimulating(!isSimulating)}
                    className="gap-1"
                  >
                    {isSimulating ? (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Simulating</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3" />
                        <span>Simulate</span>
                      </>
                    )}
                  </Button>
                  {isSimulating && (
                    <select
                      className="h-8 text-xs bg-transparent border rounded px-1"
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="5">5x</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
