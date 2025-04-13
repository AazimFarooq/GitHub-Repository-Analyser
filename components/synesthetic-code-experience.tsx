"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TreeNode } from "@/types/github"
import { Music, Palette, Waves, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

type SynestheticCodeExperienceProps = {
  tree: TreeNode
}

export function SynestheticCodeExperience({ tree }: SynestheticCodeExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map())
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(50)
  const [colorIntensity, setColorIntensity] = useState(70)
  const [soundComplexity, setSoundComplexity] = useState(50)
  const [patternDensity, setPatternDensity] = useState(60)
  const [viewMode, setViewMode] = useState<"visual" | "auditory" | "combined">("combined")
  const [activeFiles, setActiveFiles] = useState<Set<string>>(new Set())
  const [fileNodes, setFileNodes] = useState<TreeNode[]>([])
  const [colorMap, setColorMap] = useState<Map<string, string>>(new Map())
  const [soundMap, setSoundMap] = useState<Map<string, number[]>>(new Map())
  const animationFrameRef = useRef<number | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  // Initialize audio context and extract file nodes
  useEffect(() => {
    if (!tree) return

    // Extract file nodes
    const nodes: TreeNode[] = []
    const extractFiles = (node: TreeNode) => {
      if (node.type === "blob") {
        nodes.push(node)
      } else if (node.children) {
        node.children.forEach(extractFiles)
      }
    }
    extractFiles(tree)

    // Limit to 100 files for performance
    const limitedNodes = nodes.slice(0, 100)
    setFileNodes(limitedNodes)

    // Generate color mappings for file types
    const colors = new Map<string, string>()
    limitedNodes.forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""

      if (!colors.has(ext)) {
        // Generate a color based on file extension
        let hue
        if (/^(js|jsx|ts|tsx)$/.test(ext)) {
          hue = 240 + Math.random() * 60 // Blue range
        } else if (/^(css|scss|less)$/.test(ext)) {
          hue = 300 + Math.random() * 60 // Purple range
        } else if (/^(html|xml|svg)$/.test(ext)) {
          hue = 0 + Math.random() * 30 // Red range
        } else if (/^(json|yml|yaml)$/.test(ext)) {
          hue = 30 + Math.random() * 30 // Orange range
        } else if (/^(md|txt|pdf)$/.test(ext)) {
          hue = 120 + Math.random() * 60 // Green range
        } else {
          hue = Math.random() * 360 // Random for others
        }

        const saturation = 70 + Math.random() * 30
        const lightness = 50 + Math.random() * 20

        colors.set(ext, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
      }

      // Set color for this specific file
      colors.set(file.path, colors.get(ext) || `hsl(${Math.random() * 360}, 80%, 60%)`)
    })

    setColorMap(colors)

    // Generate sound mappings for file types
    const sounds = new Map<string, number[]>()
    limitedNodes.forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""

      if (!sounds.has(ext)) {
        // Generate base frequency and harmonics based on file extension
        let baseFreq
        if (/^(js|jsx|ts|tsx)$/.test(ext)) {
          baseFreq = 220 + Math.random() * 110 // A3-A4 range
        } else if (/^(css|scss|less)$/.test(ext)) {
          baseFreq = 330 + Math.random() * 110 // E4-A4 range
        } else if (/^(html|xml|svg)$/.test(ext)) {
          baseFreq = 165 + Math.random() * 55 // E3-A3 range
        } else if (/^(json|yml|yaml)$/.test(ext)) {
          baseFreq = 440 + Math.random() * 220 // A4-A5 range
        } else if (/^(md|txt|pdf)$/.test(ext)) {
          baseFreq = 110 + Math.random() * 55 // A2-E3 range
        } else {
          baseFreq = 110 + Math.random() * 330 // A2-E5 range
        }

        // Create harmonics
        const harmonics = [
          baseFreq,
          baseFreq * 1.5, // Perfect fifth
          baseFreq * 2, // Octave
        ]

        sounds.set(ext, harmonics)
      }

      // Set sound for this specific file
      sounds.set(file.path, sounds.get(ext) || [220 + Math.random() * 220])
    })

    setSoundMap(sounds)

    // Initialize audio context
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()

      // Create master gain node
      const masterGain = audioContextRef.current.createGain()
      masterGain.gain.value = volume / 100
      masterGain.connect(audioContextRef.current.destination)
      masterGainRef.current = masterGain
    }

    return () => {
      // Clean up audio context
      if (audioContextRef.current) {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop()
            osc.disconnect()
          } catch (e) {
            // Ignore errors from already stopped oscillators
          }
        })
        oscillatorsRef.current.clear()
        gainNodesRef.current.clear()
      }
    }
  }, [tree])

  // Handle volume changes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Start/stop audio playback
  useEffect(() => {
    if (!audioContextRef.current || fileNodes.length === 0) return

    if (isPlaying) {
      // Resume audio context if suspended
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }

      // Start audio visualization
      startAudioVisualization()
    } else {
      // Stop all oscillators
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop()
          osc.disconnect()
        } catch (e) {
          // Ignore errors from already stopped oscillators
        }
      })
      oscillatorsRef.current.clear()
      gainNodesRef.current.clear()

      // Clear active files
      setActiveFiles(new Set())

      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, fileNodes])

  // Start audio visualization
  const startAudioVisualization = () => {
    if (!audioContextRef.current || !canvasRef.current) return

    const ctx = audioContextRef.current
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext("2d")
    if (!canvasCtx) return

    // Create analyzer node
    const analyzer = ctx.createAnalyser()
    analyzer.fftSize = 2048
    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Connect analyzer to master gain
    if (masterGainRef.current) {
      masterGainRef.current.connect(analyzer)
    }

    // Activate random files over time
    let lastActivationTime = 0
    const activationInterval = 500 // ms

    const animate = (timestamp: number) => {
      if (!canvasCtx || !canvas) return

      // Resize canvas to container
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth
        canvas.height = containerRef.current.clientHeight
      }

      // Clear canvas
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

      // Activate new files periodically
      if (timestamp - lastActivationTime > activationInterval) {
        // Activate 1-3 random files
        const numToActivate = Math.floor(Math.random() * 3) + 1
        const newActiveFiles = new Set(activeFiles)

        for (let i = 0; i < numToActivate; i++) {
          const randomIndex = Math.floor(Math.random() * fileNodes.length)
          const file = fileNodes[randomIndex]

          if (!newActiveFiles.has(file.path)) {
            newActiveFiles.add(file.path)

            // Create oscillators for this file
            if (viewMode !== "visual") {
              createOscillatorsForFile(file)
            }
          }
        }

        // Deactivate some files
        newActiveFiles.forEach((filePath) => {
          if (Math.random() < 0.3) {
            newActiveFiles.delete(filePath)

            // Stop oscillators for this file
            if (oscillatorsRef.current.has(filePath)) {
              const osc = oscillatorsRef.current.get(filePath)
              if (osc) {
                try {
                  osc.stop()
                  osc.disconnect()
                } catch (e) {
                  // Ignore errors from already stopped oscillators
                }
                oscillatorsRef.current.delete(filePath)
              }
            }

            if (gainNodesRef.current.has(filePath)) {
              gainNodesRef.current.delete(filePath)
            }
          }
        })

        setActiveFiles(newActiveFiles)
        lastActivationTime = timestamp
      }

      // Get frequency data
      analyzer.getByteFrequencyData(dataArray)

      // Draw based on view mode
      if (viewMode === "visual" || viewMode === "combined") {
        drawVisualExperience(canvasCtx, canvas.width, canvas.height, dataArray, bufferLength)
      }

      if (viewMode === "auditory" || viewMode === "combined") {
        updateAuditoryExperience(dataArray, bufferLength)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  // Create oscillators for a file
  const createOscillatorsForFile = (file: TreeNode) => {
    if (!audioContextRef.current || !masterGainRef.current) return

    const ctx = audioContextRef.current
    const harmonics = soundMap.get(file.path) || [440]

    // Create gain node for this file
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0
    gainNode.connect(masterGainRef.current)
    gainNodesRef.current.set(file.path, gainNode)

    // Create oscillator
    const oscillator = ctx.createOscillator()

    // Set frequency based on file
    oscillator.frequency.value = harmonics[0]

    // Set waveform based on sound complexity
    if (soundComplexity < 30) {
      oscillator.type = "sine"
    } else if (soundComplexity < 60) {
      oscillator.type = "triangle"
    } else if (soundComplexity < 90) {
      oscillator.type = "sawtooth"
    } else {
      oscillator.type = "square"
    }

    // Connect oscillator to gain node
    oscillator.connect(gainNode)

    // Start oscillator
    oscillator.start()

    // Ramp up gain
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1)

    // Store oscillator reference
    oscillatorsRef.current.set(file.path, oscillator)

    // Add harmonics if complexity is high enough
    if (soundComplexity > 40 && harmonics.length > 1) {
      for (let i = 1; i < harmonics.length; i++) {
        const harmonicOsc = ctx.createOscillator()
        harmonicOsc.frequency.value = harmonics[i]

        // Use simpler waveform for harmonics
        harmonicOsc.type = "sine"

        // Create gain node for harmonic
        const harmonicGain = ctx.createGain()
        harmonicGain.gain.value = 0
        harmonicGain.connect(masterGainRef.current)

        // Connect oscillator to gain node
        harmonicOsc.connect(harmonicGain)

        // Start oscillator
        harmonicOsc.start()

        // Ramp up gain (quieter than fundamental)
        harmonicGain.gain.setValueAtTime(0, ctx.currentTime)
        harmonicGain.gain.linearRampToValueAtTime(0.1 / (i + 1), ctx.currentTime + 0.1)

        // Store references with unique keys
        oscillatorsRef.current.set(`${file.path}_h${i}`, harmonicOsc)
        gainNodesRef.current.set(`${file.path}_h${i}`, harmonicGain)
      }
    }
  }

  // Update auditory experience based on frequency data
  const updateAuditoryExperience = (dataArray: Uint8Array, bufferLength: number) => {
    if (!audioContextRef.current) return

    // Calculate average frequency power in different ranges
    const bassAvg = getAverageFrequency(dataArray, 0, bufferLength / 16)
    const midAvg = getAverageFrequency(dataArray, bufferLength / 16, bufferLength / 4)
    const highAvg = getAverageFrequency(dataArray, bufferLength / 4, bufferLength / 2)

    // Update oscillator parameters based on frequency data
    activeFiles.forEach((filePath) => {
      const gainNode = gainNodesRef.current.get(filePath)
      const oscillator = oscillatorsRef.current.get(filePath)

      if (gainNode && oscillator) {
        // Modulate gain based on frequency data
        const fileIndex = fileNodes.findIndex((f) => f.path === filePath)
        const modulationSource = fileIndex % 3 === 0 ? bassAvg : fileIndex % 3 === 1 ? midAvg : highAvg

        // Apply modulation
        const targetGain = 0.05 + (modulationSource / 255) * 0.15
        gainNode.gain.linearRampToValueAtTime(targetGain, audioContextRef.current.currentTime + 0.1)

        // Modulate detune based on pattern density
        if (patternDensity > 30) {
          const detuneAmount = (Math.sin(audioContextRef.current.currentTime * 2) * patternDensity) / 5
          oscillator.detune.linearRampToValueAtTime(detuneAmount, audioContextRef.current.currentTime + 0.1)
        }
      }
    })
  }

  // Helper to get average frequency in a range
  const getAverageFrequency = (dataArray: Uint8Array, start: number, end: number) => {
    let sum = 0
    for (let i = Math.floor(start); i < Math.floor(end); i++) {
      sum += dataArray[i]
    }
    return sum / (Math.floor(end) - Math.floor(start))
  }

  // Draw visual experience
  const drawVisualExperience = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dataArray: Uint8Array,
    bufferLength: number,
  ) => {
    // Create background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, "rgba(10, 10, 30, 0.8)")
    bgGradient.addColorStop(1, "rgba(5, 5, 20, 0.9)")
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Draw frequency spectrum as a background element
    if (viewMode === "combined") {
      drawFrequencySpectrum(ctx, width, height, dataArray, bufferLength)
    }

    // Calculate layout
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4

    // Draw active files
    activeFiles.forEach((filePath) => {
      const file = fileNodes.find((f) => f.path === filePath)
      if (!file) return

      // Get file properties
      const fileIndex = fileNodes.findIndex((f) => f.path === filePath)
      const fileColor = colorMap.get(filePath) || `hsl(${Math.random() * 360}, 80%, 60%)`

      // Calculate position based on file index
      const angle = (fileIndex / fileNodes.length) * Math.PI * 2
      const radius = maxRadius * (0.5 + Math.random() * 0.5)
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      // Get frequency data for this file's range
      const freqStart = Math.floor(((fileIndex / fileNodes.length) * bufferLength) / 4)
      const freqEnd = Math.floor((((fileIndex + 1) / fileNodes.length) * bufferLength) / 4)
      const avgFreq = getAverageFrequency(dataArray, freqStart, freqEnd)

      // Calculate size based on frequency data and color intensity
      const baseSize = 10 + (file.size ? Math.log(file.size) : 5)
      const size = baseSize * (1 + (avgFreq / 255) * (colorIntensity / 50))

      // Draw file representation
      drawFileShape(ctx, x, y, size, fileColor, file, avgFreq)

      // Draw connections between files
      if (patternDensity > 30) {
        const connectionCount = Math.floor((patternDensity / 100) * 3) + 1

        for (let i = 0; i < connectionCount; i++) {
          // Connect to another random active file
          const otherFilePaths = Array.from(activeFiles).filter((p) => p !== filePath)

          if (otherFilePaths.length > 0) {
            const otherFilePath = otherFilePaths[Math.floor(Math.random() * otherFilePaths.length)]
            const otherFile = fileNodes.find((f) => f.path === otherFilePath)

            if (otherFile) {
              const otherIndex = fileNodes.findIndex((f) => f.path === otherFilePath)
              const otherAngle = (otherIndex / fileNodes.length) * Math.PI * 2
              const otherRadius = maxRadius * (0.5 + Math.random() * 0.5)
              const otherX = centerX + Math.cos(otherAngle) * otherRadius
              const otherY = centerY + Math.sin(otherAngle) * otherRadius

              // Draw connection
              drawConnection(ctx, x, y, otherX, otherY, fileColor, colorMap.get(otherFilePath) || fileColor, avgFreq)
            }
          }
        }
      }
    })
  }

  // Draw frequency spectrum
  const drawFrequencySpectrum = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dataArray: Uint8Array,
    bufferLength: number,
  ) => {
    const barWidth = width / (bufferLength / 4)
    let x = 0

    for (let i = 0; i < bufferLength / 4; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.5

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
      gradient.addColorStop(0, `hsla(${(i / (bufferLength / 4)) * 360}, 80%, 60%, 0.2)`)
      gradient.addColorStop(1, `hsla(${(i / (bufferLength / 4)) * 360}, 80%, 40%, 0.05)`)

      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)

      x += barWidth
    }
  }

  // Draw file shape
  const drawFileShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    file: TreeNode,
    intensity: number,
  ) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const normalizedIntensity = intensity / 255

    // Extract color components
    const colorMatch = color.match(/hsl$$(\d+),\s*(\d+)%,\s*(\d+)%$$/)
    const hue = colorMatch ? Number.parseInt(colorMatch[1]) : 0
    const saturation = colorMatch ? Number.parseInt(colorMatch[2]) : 80
    const lightness = colorMatch ? Number.parseInt(colorMatch[3]) : 60

    // Adjust color based on intensity and colorIntensity setting
    const adjustedLightness = lightness + (normalizedIntensity * colorIntensity) / 2
    const adjustedColor = `hsl(${hue}, ${saturation}%, ${adjustedLightness}%)`

    // Create glow effect
    const glowSize = size * (1 + normalizedIntensity * (colorIntensity / 100))
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
    glowGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${adjustedLightness}%, 0.8)`)
    glowGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${adjustedLightness}%, 0.3)`)
    glowGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${adjustedLightness}%, 0)`)

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(x, y, glowSize, 0, Math.PI * 2)
    ctx.fill()

    // Draw shape based on file type
    ctx.fillStyle = adjustedColor
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${adjustedLightness + 20}%, 0.8)`
    ctx.lineWidth = 1

    if (/^(js|jsx|ts|tsx)$/.test(ext)) {
      // JavaScript/TypeScript: Hexagon
      drawPolygon(ctx, x, y, size, 6)
    } else if (/^(css|scss|less)$/.test(ext)) {
      // CSS: Square
      ctx.fillRect(x - size / 2, y - size / 2, size, size)
      ctx.strokeRect(x - size / 2, y - size / 2, size, size)
    } else if (/^(html|xml|svg)$/.test(ext)) {
      // HTML/XML: Diamond
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x + size / 2, y)
      ctx.lineTo(x, y + size / 2)
      ctx.lineTo(x - size / 2, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (/^(json|yml|yaml)$/.test(ext)) {
      // Config files: Triangle
      ctx.beginPath()
      ctx.moveTo(x, y - size / 2)
      ctx.lineTo(x + size / 2, y + size / 2)
      ctx.lineTo(x - size / 2, y + size / 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else {
      // Other files: Circle
      ctx.beginPath()
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Add texture based on pattern density
    if (patternDensity > 50) {
      const patternCount = Math.floor(patternDensity / 20)

      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 90%, 0.3)`
      ctx.lineWidth = 0.5

      for (let i = 0; i < patternCount; i++) {
        const patternSize = size * (0.3 + (i / patternCount) * 0.7)

        if (i % 3 === 0) {
          // Circle pattern
          ctx.beginPath()
          ctx.arc(x, y, patternSize / 2, 0, Math.PI * 2)
          ctx.stroke()
        } else if (i % 3 === 1) {
          // Cross pattern
          ctx.beginPath()
          ctx.moveTo(x - patternSize / 2, y)
          ctx.lineTo(x + patternSize / 2, y)
          ctx.moveTo(x, y - patternSize / 2)
          ctx.lineTo(x, y + patternSize / 2)
          ctx.stroke()
        } else {
          // Dot pattern
          const dotCount = 8
          for (let j = 0; j < dotCount; j++) {
            const dotAngle = (j / dotCount) * Math.PI * 2
            const dotX = x + (Math.cos(dotAngle) * patternSize) / 2
            const dotY = y + (Math.sin(dotAngle) * patternSize) / 2

            ctx.beginPath()
            ctx.arc(dotX, dotY, 1, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    // Add file name label if large enough
    if (size > 20) {
      ctx.font = `${Math.min(12, size / 3)}px sans-serif`
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"
      ctx.fillText(file.name, x, y + size / 2 + 15)
    }
  }

  // Helper to draw regular polygon
  const drawPolygon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sides: number) => {
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2
      const pointX = x + (Math.cos(angle) * size) / 2
      const pointY = y + (Math.sin(angle) * size) / 2

      if (i === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  // Draw connection between files
  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color1: string,
    color2: string,
    intensity: number,
  ) => {
    // Create gradient for connection
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)

    // Draw line with varying opacity based on intensity
    ctx.strokeStyle = gradient
    ctx.lineWidth = 1 + (intensity / 255) * 2
    ctx.globalAlpha = 0.3 + (intensity / 255) * 0.4

    // Draw bezier curve
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const controlX = midX + (Math.random() - 0.5) * 100
    const controlY = midY + (Math.random() - 0.5) * 100

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo(controlX, controlY, x2, y2)
    ctx.stroke()

    // Reset opacity
    ctx.globalAlpha = 1

    // Add particles along the connection if pattern density is high
    if (patternDensity > 70) {
      const particleCount = Math.floor(patternDensity / 20)

      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount

        // Calculate position along bezier curve
        const bezierX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * controlX + t * t * x2
        const bezierY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * controlY + t * t * y2

        // Draw particle
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(bezierX, bezierY, 1 + (intensity / 255) * 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Palette className="h-4 w-4 mr-2 text-primary" />
            Synesthetic Code Experience
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="visual" className="text-xs px-2 py-1 flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  <span className="hidden sm:inline">Visual</span>
                </TabsTrigger>
                <TabsTrigger value="auditory" className="text-xs px-2 py-1 flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  <span className="hidden sm:inline">Auditory</span>
                </TabsTrigger>
                <TabsTrigger value="combined" className="text-xs px-2 py-1 flex items-center gap-1">
                  <Waves className="h-3 w-3" />
                  <span className="hidden sm:inline">Combined</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          <div
            ref={containerRef}
            className={cn(
              "relative w-full h-[500px] bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 from-gray-100 to-gray-200 overflow-hidden",
              isFullscreen && "fixed inset-0 z-50",
            )}
          >
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs">Color Intensity</label>
                    <span className="text-xs font-medium">{colorIntensity}%</span>
                  </div>
                  <Slider
                    value={[colorIntensity]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(value) => setColorIntensity(value[0])}
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs">Sound Complexity</label>
                    <span className="text-xs font-medium">{soundComplexity}%</span>
                  </div>
                  <Slider
                    value={[soundComplexity]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(value) => setSoundComplexity(value[0])}
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs">Pattern Density</label>
                    <span className="text-xs font-medium">{patternDensity}%</span>
                  </div>
                  <Slider
                    value={[patternDensity]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={(value) => setPatternDensity(value[0])}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-gray-300">
                  <p className="italic">
                    {viewMode === "visual" && "Visual mode: Experience your code as colors, shapes, and patterns."}
                    {viewMode === "auditory" && "Auditory mode: Listen to your code as a unique soundscape."}
                    {viewMode === "combined" && "Combined mode: Full synesthetic experience of your codebase."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="gap-1"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-3 w-3" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Play</span>
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) => setVolume(value[0])}
                      className="w-24"
                      disabled={isMuted}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
