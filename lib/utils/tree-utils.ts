import type { TreeNode } from "@/types/github"

/**
 * Converts a tree structure to a formatted text representation
 */
export function treeToText(node: TreeNode, level = 0, isLast = true, prefix = ""): string {
  // Skip the root node's own representation but process its children
  if (level === 0) {
    let result = `${node.name}\n`
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        const isLastChild = i === node.children.length - 1
        result += treeToText(child, level + 1, isLastChild, "")
      }
    }
    return result
  }

  // For non-root nodes
  const indent = prefix + (isLast ? "└── " : "├── ")
  const childPrefix = prefix + (isLast ? "    " : "│   ")

  let result = `${indent}${node.name}\n`

  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const isLastChild = i === node.children.length - 1
      result += treeToText(child, level + 1, isLastChild, childPrefix)
    }
  }

  return result
}

/**
 * Gets all file paths from a tree structure
 */
export function getAllFilePaths(node: TreeNode | null): string[] {
  const paths: string[] = []

  function traverse(node: TreeNode | null) {
    if (!node) return

    if (node.type === "blob") {
      paths.push(node.path)
    } else if (node.children) {
      node.children.forEach((child) => {
        if (child) traverse(child)
      })
    }
  }

  traverse(node)
  return paths
}

/**
 * Chunks a large tree into smaller pieces for lazy loading
 * @param tree The full tree structure
 * @param maxNodesPerChunk Maximum number of nodes to include in each chunk
 * @returns An object with the root tree (with first level folders) and a map of chunks by path
 */
export function chunkTreeForLazyLoading(
  tree: TreeNode,
  maxNodesPerChunk = 500,
): {
  rootTree: TreeNode
  chunks: Record<string, TreeNode[]>
} {
  // Create a copy of the root tree with only first level folders
  const rootTree: TreeNode = {
    ...tree,
    children: tree.children
      ? tree.children.map((child) => ({
          ...child,
          children: child.type === "tree" ? [] : undefined,
        }))
      : undefined,
  }

  // Create chunks for each top-level folder
  const chunks: Record<string, TreeNode[]> = {}

  if (tree.children) {
    tree.children.forEach((child) => {
      if (child.type === "tree" && child.children) {
        // Count nodes in this subtree
        let nodeCount = 0
        const countNodes = (node: TreeNode) => {
          nodeCount++
          if (node.children) {
            node.children.forEach(countNodes)
          }
        }

        child.children.forEach(countNodes)

        // If subtree is small enough, keep it as one chunk
        if (nodeCount <= maxNodesPerChunk) {
          chunks[child.path] = child.children
        } else {
          // Otherwise, split into multiple chunks
          const currentChunk: TreeNode[] = []
          let currentChunkSize = 0
          let chunkIndex = 0

          const processNode = (node: TreeNode) => {
            if (currentChunkSize >= maxNodesPerChunk) {
              // Start a new chunk
              chunks[`${child.path}_${chunkIndex}`] = [...currentChunk]
              currentChunk.length = 0
              currentChunkSize = 0
              chunkIndex++
            }

            currentChunk.push(node)
            currentChunkSize++

            // If this is a folder with many children, we might need to split it
            if (node.type === "tree" && node.children && node.children.length > 0) {
              const childrenCopy = [...node.children]
              node.children = []

              // Add a special marker to indicate this folder has more content
              node.hasMore = true
              chunks[node.path] = childrenCopy
            }
          }

          child.children.forEach(processNode)

          // Save the last chunk if not empty
          if (currentChunk.length > 0) {
            chunks[`${child.path}_${chunkIndex}`] = [...currentChunk]
          }
        }
      }
    })
  }

  return { rootTree, chunks }
}

/**
 * Calculates statistics about a tree structure
 */
export function calculateTreeStats(tree: TreeNode): {
  totalFiles: number
  totalFolders: number
  totalSize: number
  maxDepth: number
  fileTypes: Record<string, number>
} {
  let totalFiles = 0
  let totalFolders = 0
  let totalSize = 0
  let maxDepth = 0
  const fileTypes: Record<string, number> = {}

  const traverse = (node: TreeNode, depth = 0) => {
    // Update max depth
    maxDepth = Math.max(maxDepth, depth)

    if (node.type === "blob") {
      totalFiles++
      totalSize += node.size || 0

      // Count file types
      const ext = node.name.split(".").pop()?.toLowerCase() || "no-extension"
      fileTypes[ext] = (fileTypes[ext] || 0) + 1
    } else {
      totalFolders++
      if (node.children) {
        node.children.forEach((child) => traverse(child, depth + 1))
      }
    }
  }

  traverse(tree)

  return {
    totalFiles,
    totalFolders,
    totalSize,
    maxDepth,
    fileTypes,
  }
}
