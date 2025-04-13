import type { TreeNode, CodeDependency } from "@/types/github"

export type ImpactLevel = "direct" | "indirect" | "potential" | "safe"

export type ImpactNode = {
  id: string
  path: string
  name: string
  type: string
  impactLevel: ImpactLevel
  distance: number
  weight: number
  dependencyPath: string[]
}

/**
 * Analyzes the impact of changing a specific file by tracing dependency chains
 */
export function analyzeFileImpact(
  filePath: string,
  dependencies: CodeDependency[],
  tree: TreeNode,
): {
  impactedFiles: ImpactNode[]
  metrics: {
    directImpact: number
    indirectImpact: number
    potentialImpact: number
    totalImpact: number
    maxChainLength: number
    criticalPaths: string[][]
  }
} {
  // Create a dependency graph for efficient traversal
  const dependencyGraph: Record<string, { targets: string[]; sources: string[] }> = {}

  // Initialize the graph
  dependencies.forEach((dep) => {
    if (!dependencyGraph[dep.source]) {
      dependencyGraph[dep.source] = { targets: [], sources: [] }
    }
    if (!dependencyGraph[dep.target]) {
      dependencyGraph[dep.target] = { targets: [], sources: [] }
    }

    dependencyGraph[dep.source].targets.push(dep.target)
    dependencyGraph[dep.target].sources.push(dep.source)
  })

  // Find all files that depend on the changed file (forward impact)
  const forwardImpact = traverseDependencyChain(filePath, "forward", dependencyGraph, dependencies)

  // Find all files that the changed file depends on (backward impact)
  const backwardImpact = traverseDependencyChain(filePath, "backward", dependencyGraph, dependencies)

  // Combine both impacts, but exclude the file itself from backward impact
  const impactedFiles = [...forwardImpact, ...backwardImpact.filter((node) => node.path !== filePath)]

  // Calculate metrics
  const directImpact = impactedFiles.filter((file) => file.impactLevel === "direct").length
  const indirectImpact = impactedFiles.filter((file) => file.impactLevel === "indirect").length
  const potentialImpact = impactedFiles.filter((file) => file.impactLevel === "potential").length

  // Find the longest dependency chain
  const maxChainLength = Math.max(...impactedFiles.map((file) => file.distance), 0)

  // Identify critical paths (chains with high impact weight)
  const criticalPaths = impactedFiles
    .filter((file) => file.weight > 0.7)
    .map((file) => file.dependencyPath)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3) // Top 3 critical paths

  return {
    impactedFiles,
    metrics: {
      directImpact,
      indirectImpact,
      potentialImpact,
      totalImpact: impactedFiles.length,
      maxChainLength,
      criticalPaths,
    },
  }
}

/**
 * Traverses the dependency chain in either forward or backward direction
 */
function traverseDependencyChain(
  startPath: string,
  direction: "forward" | "backward",
  dependencyGraph: Record<string, { targets: string[]; sources: string[] }>,
  dependencies: CodeDependency[],
  maxDepth = 10,
): ImpactNode[] {
  const visited = new Set<string>()
  const result: ImpactNode[] = []

  // Queue for BFS traversal with [path, distance, dependencyPath]
  const queue: [string, number, string[]][] = [[startPath, 0, [startPath]]]

  while (queue.length > 0) {
    const [currentPath, distance, depPath] = queue.shift()!

    if (visited.has(currentPath) || distance > maxDepth) {
      continue
    }

    visited.add(currentPath)

    // Determine impact level based on distance
    let impactLevel: ImpactLevel = "safe"
    if (distance === 0) {
      impactLevel = "direct" // The file itself
    } else if (distance === 1) {
      impactLevel = "direct" // Directly connected
    } else if (distance <= 3) {
      impactLevel = "indirect" // Indirectly connected (2-3 hops)
    } else {
      impactLevel = "potential" // Potentially connected (4+ hops)
    }

    // Calculate impact weight (decreases with distance)
    const weight = Math.max(0, 1 - distance * 0.2)

    // Get file name from path
    const name = currentPath.split("/").pop() || currentPath

    // Determine file type from extension
    const ext = name.split(".").pop()?.toLowerCase() || ""
    const type = getFileType(ext)

    // Add to result
    result.push({
      id: currentPath,
      path: currentPath,
      name,
      type,
      impactLevel,
      distance,
      weight,
      dependencyPath: [...depPath],
    })

    // Get next nodes based on direction
    const nextNodes =
      direction === "forward"
        ? dependencyGraph[currentPath]?.targets || []
        : dependencyGraph[currentPath]?.sources || []

    // Add next nodes to queue
    for (const nextNode of nextNodes) {
      if (!visited.has(nextNode)) {
        queue.push([nextNode, distance + 1, [...depPath, nextNode]])
      }
    }
  }

  return result
}

/**
 * Determines file type based on extension
 */
function getFileType(extension: string): string {
  if (["js", "jsx", "ts", "tsx"].includes(extension)) return "script"
  if (["css", "scss", "less", "sass"].includes(extension)) return "style"
  if (["html", "xml", "svg"].includes(extension)) return "markup"
  if (["json", "yml", "yaml", "toml"].includes(extension)) return "config"
  if (["md", "txt", "pdf"].includes(extension)) return "document"
  if (["jpg", "png", "gif", "svg"].includes(extension)) return "image"
  return "unknown"
}

/**
 * Calculates the risk score for changing a file based on its impact
 */
export function calculateChangeRiskScore(impactMetrics: {
  directImpact: number
  indirectImpact: number
  potentialImpact: number
  totalImpact: number
  maxChainLength: number
}): {
  score: number // 0-100
  level: "low" | "medium" | "high" | "critical"
  factors: string[]
} {
  // Base score starts at 0
  let score = 0
  const factors: string[] = []

  // Direct impact has the highest weight
  score += impactMetrics.directImpact * 10
  if (impactMetrics.directImpact > 5) {
    factors.push(`High direct impact (${impactMetrics.directImpact} files)`)
  }

  // Indirect impact has medium weight
  score += impactMetrics.indirectImpact * 3
  if (impactMetrics.indirectImpact > 10) {
    factors.push(`Significant indirect impact (${impactMetrics.indirectImpact} files)`)
  }

  // Potential impact has low weight
  score += impactMetrics.potentialImpact * 1

  // Long dependency chains increase risk
  if (impactMetrics.maxChainLength > 5) {
    score += impactMetrics.maxChainLength * 2
    factors.push(`Deep dependency chain (${impactMetrics.maxChainLength} levels)`)
  }

  // Cap score at 100
  score = Math.min(100, score)

  // Determine risk level
  let level: "low" | "medium" | "high" | "critical"
  if (score < 25) level = "low"
  else if (score < 50) level = "medium"
  else if (score < 75) level = "high"
  else level = "critical"

  // Add default factor if none were added
  if (factors.length === 0) {
    if (level === "low") {
      factors.push("Limited impact on other components")
    } else {
      factors.push(`Affects ${impactMetrics.totalImpact} components in total`)
    }
  }

  return { score, level, factors }
}
