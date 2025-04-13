import type { CodeDependency, TreeNode } from "@/lib/types"

// Common file extensions and their potential dependencies
const FILE_EXTENSIONS: Record<string, boolean> = {
  js: true,
  jsx: true,
  ts: true,
  tsx: true,
  py: true,
  java: true,
  rb: true,
  php: true,
  go: true,
  rs: true,
  cs: true,
  cpp: true,
  c: true,
  html: true,
  css: true,
  scss: true,
  json: true,
  md: true,
}

/**
 * Analyzes repository files to extract dependencies
 */
export async function analyzeRepository(
  tree: TreeNode,
  fileContents: Record<string, string> = {},
): Promise<CodeDependency[]> {
  const dependencies: CodeDependency[] = []
  const fileNodes: TreeNode[] = []

  // Collect all file nodes
  const collectFiles = (node: TreeNode) => {
    if (node.type === "blob") {
      fileNodes.push(node)
    } else if (node.children) {
      node.children.forEach(collectFiles)
    }
  }

  collectFiles(tree)

  // For demo purposes, generate some sample dependencies
  // In a real implementation, we would analyze actual file contents

  // Create a map of files by extension
  const filesByExt: Record<string, TreeNode[]> = {}
  fileNodes.forEach((file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "unknown"
    if (!filesByExt[ext]) {
      filesByExt[ext] = []
    }
    filesByExt[ext].push(file)
  })

  // Generate dependencies between similar file types
  Object.entries(filesByExt).forEach(([ext, files]) => {
    if (files.length > 1 && FILE_EXTENSIONS[ext as keyof typeof FILE_EXTENSIONS]) {
      // Create connections between files of the same type
      for (let i = 0; i < files.length; i++) {
        const sourceFile = files[i]

        // Connect to 1-3 other files of the same type
        const connectionCount = Math.min(Math.floor(Math.random() * 3) + 1, files.length - 1)
        const connectedIndices = new Set<number>()

        while (connectedIndices.size < connectionCount) {
          const targetIndex = Math.floor(Math.random() * files.length)
          if (targetIndex !== i) {
            connectedIndices.add(targetIndex)
          }
        }

        connectedIndices.forEach((targetIndex) => {
          const targetFile = files[targetIndex]
          dependencies.push({
            source: sourceFile.path,
            target: targetFile.path,
            type: Math.random() > 0.7 ? "reference" : "import",
            weight: Math.floor(Math.random() * 5) + 1,
          })
        })
      }
    }
  })

  // Connect some config files to source files
  const configFiles = fileNodes.filter(
    (file) =>
      file.name.includes("config") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".yml") ||
      file.name.startsWith("."),
  )

  const sourceFiles = fileNodes.filter(
    (file) =>
      file.name.endsWith(".js") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".tsx"),
  )

  configFiles.forEach((configFile) => {
    // Connect each config file to 1-5 source files
    const connectionCount = Math.min(Math.floor(Math.random() * 5) + 1, sourceFiles.length)
    const connectedIndices = new Set<number>()

    while (connectedIndices.size < connectionCount) {
      const targetIndex = Math.floor(Math.random() * sourceFiles.length)
      connectedIndices.add(targetIndex)
    }

    connectedIndices.forEach((targetIndex) => {
      const targetFile = sourceFiles[targetIndex]
      dependencies.push({
        source: targetFile.path,
        target: configFile.path,
        type: "reference",
        weight: Math.floor(Math.random() * 3) + 1,
      })
    })
  })

  return dependencies
}

/**
 * Analyzes file types in the repository
 */
export function analyzeFileTypes(tree: TreeNode): Record<string, number> {
  const fileTypes: Record<string, number> = {}

  const countFileTypes = (node: TreeNode) => {
    if (node.type === "blob") {
      const ext = node.name.split(".").pop()?.toLowerCase() || "unknown"
      fileTypes[ext] = (fileTypes[ext] || 0) + 1
    } else if (node.children) {
      node.children.forEach(countFileTypes)
    }
  }

  countFileTypes(tree)
  return fileTypes
}

/**
 * Calculates repository statistics
 */
export function calculateRepoStats(tree: TreeNode, fileTypes: Record<string, number>) {
  let totalFiles = 0
  let totalFolders = 0

  const countItems = (node: TreeNode) => {
    if (node.type === "blob") {
      totalFiles++
    } else {
      totalFolders++
      if (node.children) {
        node.children.forEach(countItems)
      }
    }
  }

  countItems(tree)

  // Determine main language
  let mainLanguage = "unknown"
  let maxCount = 0

  Object.entries(fileTypes).forEach(([ext, count]) => {
    if (count > maxCount && ext !== "unknown" && ext !== "md" && ext !== "json") {
      maxCount = count
      mainLanguage = ext
    }
  })

  return {
    totalFiles,
    totalFolders,
    mainLanguage,
  }
}
