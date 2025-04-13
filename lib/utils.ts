import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TreeNode } from "@/lib/types"

// Class utilities
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tree utilities
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

// File utilities
/**
 * Get color for a file extension
 */
export function getExtensionColor(ext: string): string {
  const colors: Record<string, string> = {
    js: "#f7df1e",
    jsx: "#61dafb",
    ts: "#3178c6",
    tsx: "#3178c6",
    css: "#264de4",
    scss: "#cc6699",
    html: "#e34c26",
    json: "#292929",
    md: "#083fa1",
    py: "#3572A5",
    rb: "#CC342D",
    java: "#b07219",
    php: "#4F5D95",
    go: "#00ADD8",
    rs: "#DEA584",
    c: "#555555",
    cpp: "#f34b7d",
    cs: "#178600",
  }

  return colors[ext] || "#64748b"
}

/**
 * Get file group based on extension
 */
export function getFileGroup(path: string | any): number {
  // If path is an object with an id property (which happens during D3 simulation)
  if (path && typeof path === "object" && "id" in path) {
    path = path.id
  }

  // Ensure path is a string before trying to split it
  if (typeof path !== "string") {
    return 0 // Default group for invalid paths
  }

  const ext = path.split(".").pop()?.toLowerCase() || ""

  if (["js", "jsx", "ts", "tsx"].includes(ext)) return 1 // JavaScript/TypeScript
  if (["css", "scss", "less", "sass"].includes(ext)) return 2 // Styles
  if (["json", "yaml", "yml", "toml"].includes(ext)) return 3 // Config
  if (["md", "txt", "pdf"].includes(ext)) return 4 // Docs
  if (["jpg", "png", "svg", "gif"].includes(ext)) return 5 // Images
  return 0 // Other
}

/**
 * Get color for a node based on its group
 */
export function getNodeColor(group: number): string {
  const colors = [
    "#64748b", // Other
    "#3b82f6", // JS/TS
    "#ec4899", // Styles
    "#f59e0b", // Config
    "#10b981", // Docs
    "#8b5cf6", // Images
  ]
  return colors[group] || colors[0]
}

/**
 * Get color for a dependency link type
 */
export function getLinkColor(type: string): string {
  switch (type) {
    case "import":
      return "#3b82f6"
    case "export":
      return "#10b981"
    case "reference":
      return "#f59e0b"
    case "extends":
      return "#ec4899"
    case "implements":
      return "#8b5cf6"
    default:
      return "#64748b"
  }
}
