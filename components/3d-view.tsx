"use client"

import { useRef, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import type { TreeNode, CodeDependency } from "@/types/github"
import { CuboidIcon as Cube, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer"

type ThreeDViewProps = {
  tree: TreeNode
  dependencies: CodeDependency[]
}

export function ThreeDView({ tree, dependencies }: ThreeDViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const labelRendererRef = useRef<CSS2DRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  const [nodeSize, setNodeSize] = useState(50)
  const [showLabels, setShowLabels] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize scene
    const scene = new THREE.Scene()
    const isDarkMode = document.documentElement.classList.contains("dark")
    scene.background = new THREE.Color(isDarkMode ? 0x1a1a2e : 0xf0f0f0)
    sceneRef.current = scene

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000,
    )
    camera.position.z = 1000
    cameraRef.current = camera

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Initialize label renderer
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    labelRenderer.domElement.style.position = "absolute"
    labelRenderer.domElement.style.top = "0"
    labelRenderer.domElement.style.pointerEvents = "none"
    containerRef.current.appendChild(labelRenderer.domElement)
    labelRendererRef.current = labelRenderer

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1).normalize()
    scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      if (controlsRef.current) controlsRef.current.update()
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
      if (labelRendererRef.current && cameraRef.current && sceneRef.current) {
        labelRendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current || !labelRendererRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()

      rendererRef.current.setSize(width, height)
      labelRendererRef.current.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }

      if (labelRendererRef.current && containerRef.current) {
        containerRef.current.removeChild(labelRendererRef.current.domElement)
      }

      if (controlsRef.current) {
        controlsRef.current.dispose()
      }
    }
  }, [])

  // Build 3D visualization
  useEffect(() => {
    if (!sceneRef.current || !tree || !dependencies) return

    // Clear previous objects
    while (sceneRef.current.children.length > 0) {
      const object = sceneRef.current.children[0]
      if (object instanceof THREE.Light) {
        sceneRef.current.children.shift()
        continue
      }
      sceneRef.current.remove(object)
    }

    // Add ambient and directional lights back
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    sceneRef.current.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1).normalize()
    sceneRef.current.add(directionalLight)

    // Extract all file nodes
    const fileNodes: TreeNode[] = []
    const extractFiles = (node: TreeNode) => {
      if (node.type === "blob") {
        fileNodes.push(node)
      } else if (node.children) {
        node.children.forEach(extractFiles)
      }
    }
    extractFiles(tree)

    // Create a map of file paths to indices
    const filePathMap = new Map<string, number>()
    fileNodes.forEach((node, index) => {
      filePathMap.set(node.path, index)
    })

    // Create a map of file paths to node objects
    const nodeObjects = new Map<string, THREE.Mesh>()

    // Create a force-directed layout
    const positions: THREE.Vector3[] = []
    const forces: THREE.Vector3[] = []

    // Initialize random positions
    for (let i = 0; i < fileNodes.length; i++) {
      const x = (Math.random() - 0.5) * 1000
      const y = (Math.random() - 0.5) * 1000
      const z = (Math.random() - 0.5) * 1000
      positions.push(new THREE.Vector3(x, y, z))
      forces.push(new THREE.Vector3(0, 0, 0))
    }

    // Create file nodes
    fileNodes.forEach((node, index) => {
      const ext = node.name.split(".").pop()?.toLowerCase() || ""

      // Determine color based on file type
      let color = 0x999999 // Default gray
      if (["js", "jsx", "ts", "tsx"].includes(ext))
        color = 0x6366f1 // Purple for JS/TS
      else if (["css", "scss", "less", "sass"].includes(ext))
        color = 0xec4899 // Pink for styles
      else if (["json", "yaml", "yml", "toml"].includes(ext))
        color = 0xf59e0b // Amber for config
      else if (["md", "txt", "pdf"].includes(ext))
        color = 0x10b981 // Green for docs
      else if (["jpg", "png", "svg", "gif"].includes(ext)) color = 0x3b82f6 // Blue for images

      // Create sphere for file
      const geometry = new THREE.SphereGeometry(nodeSize / 10, 16, 16)
      const material = new THREE.MeshLambertMaterial({ color })
      const sphere = new THREE.Mesh(geometry, material)

      sphere.position.copy(positions[index])
      sceneRef.current?.add(sphere)

      nodeObjects.set(node.path, sphere)

      // Add label if enabled
      if (showLabels) {
        const labelDiv = document.createElement("div")
        labelDiv.className = "text-xs bg-background/80 px-1 py-0.5 rounded pointer-events-none"
        labelDiv.textContent = node.name
        labelDiv.style.color = "currentColor"

        const label = new CSS2DObject(labelDiv)
        label.position.set(0, nodeSize / 8, 0)
        sphere.add(label)
      }
    })

    // Create connections between files
    dependencies.forEach((dep) => {
      const sourceIndex = filePathMap.get(dep.source)
      const targetIndex = filePathMap.get(dep.target)

      if (sourceIndex !== undefined && targetIndex !== undefined) {
        const sourcePos = positions[sourceIndex]
        const targetPos = positions[targetIndex]

        // Determine color based on dependency type
        let color = 0x999999 // Default gray
        if (dep.type === "import")
          color = 0x6366f1 // Purple
        else if (dep.type === "export")
          color = 0x10b981 // Green
        else if (dep.type === "reference")
          color = 0xf59e0b // Amber
        else if (dep.type === "extends")
          color = 0xec4899 // Pink
        else if (dep.type === "implements") color = 0x3b82f6 // Blue

        // Create line for connection
        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.6,
          linewidth: dep.weight || 1,
        })

        const points = []
        points.push(sourcePos)
        points.push(targetPos)

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, material)
        sceneRef.current?.add(line)
      }
    })

    // Run force-directed layout simulation
    const simulate = () => {
      // Reset forces
      forces.forEach((force) => force.set(0, 0, 0))

      // Apply repulsive forces between all nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const diff = new THREE.Vector3().subVectors(positions[i], positions[j])
          const dist = diff.length()

          if (dist < 0.1) continue // Avoid division by zero

          const repulsion = 10000 / (dist * dist)
          const force = diff.normalize().multiplyScalar(repulsion)

          forces[i].add(force)
          forces[j].sub(force)
        }
      }

      // Apply attractive forces along edges
      dependencies.forEach((dep) => {
        const sourceIndex = filePathMap.get(dep.source)
        const targetIndex = filePathMap.get(dep.target)

        if (sourceIndex !== undefined && targetIndex !== undefined) {
          const diff = new THREE.Vector3().subVectors(positions[targetIndex], positions[sourceIndex])
          const dist = diff.length()

          const attraction = dist * 0.01 * (dep.weight || 1)
          const force = diff.normalize().multiplyScalar(attraction)

          forces[sourceIndex].add(force)
          forces[targetIndex].sub(force)
        }
      })

      // Apply forces to positions
      for (let i = 0; i < positions.length; i++) {
        positions[i].add(forces[i].multiplyScalar(0.1))

        // Update sphere positions
        const node = fileNodes[i]
        const sphere = nodeObjects.get(node.path)
        if (sphere) {
          sphere.position.copy(positions[i])
        }
      }

      // Update line positions
      dependencies.forEach((dep) => {
        const sourceIndex = filePathMap.get(dep.source)
        const targetIndex = filePathMap.get(dep.target)

        if (sourceIndex !== undefined && targetIndex !== undefined) {
          const sourcePos = positions[sourceIndex]
          const targetPos = positions[targetIndex]

          // Find the line and update its geometry
          sceneRef.current?.children.forEach((child) => {
            if (child instanceof THREE.Line) {
              const geometry = child.geometry as THREE.BufferGeometry
              const positions = geometry.getAttribute("position")

              // Check if this is the right line (very basic check)
              const startPos = new THREE.Vector3().fromBufferAttribute(positions, 0)
              const endPos = new THREE.Vector3().fromBufferAttribute(positions, 1)

              if (startPos.distanceTo(sourcePos) < 0.1 && endPos.distanceTo(targetPos) < 0.1) {
                const points = []
                points.push(sourcePos)
                points.push(targetPos)

                geometry.setFromPoints(points)
                geometry.attributes.position.needsUpdate = true
              }
            }
          })
        }
      })
    }

    // Run simulation for a few iterations
    for (let i = 0; i < 100; i++) {
      simulate()
    }
  }, [tree, dependencies, nodeSize, showLabels])

  // Handle reset view
  const handleReset = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset()
      cameraRef.current.position.z = 1000
    }
  }

  // Handle zoom in
  const handleZoomIn = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.z *= 0.8
      controlsRef.current.update()
    }
  }

  // Handle zoom out
  const handleZoomOut = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.z *= 1.2
      controlsRef.current.update()
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center">
              <Cube className="h-4 w-4 mr-2 text-primary" />
              3D Repository Visualization
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLabels(!showLabels)}>
                {showLabels ? "Hide Labels" : "Show Labels"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm">Node Size:</span>
              <Slider
                value={[nodeSize]}
                min={10}
                max={100}
                step={5}
                onValueChange={(value) => setNodeSize(value[0])}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8">{nodeSize}</span>
            </div>

            <div ref={containerRef} className="w-full h-[500px] border rounded-md bg-muted/20 relative" />

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#6366f1] mr-1"></span>
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
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#3b82f6] mr-1"></span>
                <span>Images</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
