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
