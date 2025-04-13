"use client"

import type { TreeNode } from "@/types/github"

export type ConceptNode = {
  id: string
  label: string
  type: "concept" | "file" | "component" | "function" | "class" | "api" | "hook" | "context" | "util"
  description: string
  category: string
  weight: number
  files: string[]
  related: string[]
}

export type ConceptEdge = {
  source: string
  target: string
  type: "implements" | "uses" | "extends" | "defines" | "related" | "depends"
  weight: number
}

export type KnowledgeGraph = {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
}

/**
 * Extracts concepts from file content based on patterns and naming conventions
 */
function extractConcepts(
  filePath: string,
  fileContent: string,
  fileType: string,
): { concepts: string[]; types: string[] } {
  const concepts: string[] = []
  const types: string[] = []

  // Extract React components (PascalCase exports)
  const componentRegex = /export\s+(default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/g
  let match
  while ((match = componentRegex.exec(fileContent)) !== null) {
    concepts.push(match[2])
    types.push("component")
  }

  // Extract hooks (useSomething functions)
  const hookRegex = /export\s+(default\s+)?(?:function|const)\s+(use[A-Z][a-zA-Z0-9]*)/g
  while ((match = hookRegex.exec(fileContent)) !== null) {
    concepts.push(match[2])
    types.push("hook")
  }

  // Extract utility functions (camelCase exports)
  const utilRegex = /export\s+(const|function)\s+([a-z][a-zA-Z0-9]*)/g
  while ((match = utilRegex.exec(fileContent)) !== null) {
    concepts.push(match[2])
    types.push("function")
  }

  // Extract classes
  const classRegex = /export\s+(default\s+)?class\s+([A-Z][a-zA-Z0-9]*)/g
  while ((match = classRegex.exec(fileContent)) !== null) {
    concepts.push(match[2])
    types.push("class")
  }

  // Extract types and interfaces
  const typeRegex = /export\s+(type|interface)\s+([A-Z][a-zA-Z0-9]*)/g
  while ((match = typeRegex.exec(fileContent)) !== null) {
    concepts.push(match[2])
    types.push("type")
  }

  // Extract API routes from Next.js route handlers
  if (filePath.includes("/api/") || filePath.includes("/app/api/")) {
    const routeName = filePath
      .split("/")
      .pop()
      ?.replace(/\.(js|ts|jsx|tsx)$/, "")
      ?.replace(/^route$/, filePath.split("/").slice(-2)[0])
    if (routeName && routeName !== "index") {
      concepts.push(`API:${routeName}`)
      types.push("api")
    }
  }

  // Extract contexts
  const contextRegex = /([A-Z][a-zA-Z0-9]*Context)/g
  while ((match = contextRegex.exec(fileContent)) !== null) {
    concepts.push(match[1])
    types.push("context")
  }

  // Extract high-level domain concepts based on file naming and content
  const domainConcepts = extractDomainConcepts(filePath, fileContent)
  concepts.push(...domainConcepts.map((c) => `Domain:${c}`))
  types.push(...domainConcepts.map(() => "concept"))

  return { concepts, types }
}

/**
 * Extracts high-level domain concepts from file naming and content
 */
function extractDomainConcepts(filePath: string, fileContent: string): string[] {
  const concepts: string[] = []
  const fileName = filePath.split("/").pop() || ""
  const dirName = filePath.split("/").slice(-2, -1)[0] || ""

  // Common domain concepts in web applications
  const domainPatterns = [
    "auth",
    "user",
    "profile",
    "account",
    "payment",
    "billing",
    "subscription",
    "product",
    "cart",
    "checkout",
    "order",
    "dashboard",
    "analytics",
    "report",
    "notification",
    "message",
    "chat",
    "comment",
    "post",
    "article",
    "blog",
    "content",
    "media",
    "upload",
    "search",
    "filter",
    "sort",
    "pagination",
    "settings",
    "preference",
    "theme",
    "layout",
    "navigation",
    "menu",
    "sidebar",
    "header",
    "footer",
    "modal",
    "dialog",
    "form",
    "validation",
    "error",
    "success",
    "warning",
    "info",
    "toast",
    "notification",
    "alert",
    "confirm",
    "prompt",
  ]

  // Check file name for domain concepts
  domainPatterns.forEach((pattern) => {
    if (
      fileName.toLowerCase().includes(pattern) ||
      dirName.toLowerCase().includes(pattern) ||
      fileContent.toLowerCase().includes(`"${pattern}"`) ||
      fileContent.toLowerCase().includes(`'${pattern}'`)
    ) {
      // Capitalize first letter
      const concept = pattern.charAt(0).toUpperCase() + pattern.slice(1)
      if (!concepts.includes(concept)) {
        concepts.push(concept)
      }
    }
  })

  return concepts
}

/**
 * Analyzes relationships between concepts
 */
function analyzeConceptRelationships(concepts: ConceptNode[], fileContents: Map<string, string>): ConceptEdge[] {
  const edges: ConceptEdge[] = []
  const conceptsById = new Map(concepts.map((c) => [c.id, c]))

  // For each concept, check if it's mentioned in files of other concepts
  for (const concept of concepts) {
    for (const otherConcept of concepts) {
      if (concept.id === otherConcept.id) continue

      // Check if concepts share files
      const sharedFiles = concept.files.filter((file) => otherConcept.files.includes(file))
      if (sharedFiles.length > 0) {
        let relationshipType: ConceptEdge["type"] = "related"
        let weight = 0.5 + Math.min(sharedFiles.length / 5, 0.5) // Base weight + bonus for more shared files

        // Check for more specific relationships based on file content
        for (const file of sharedFiles) {
          const content = fileContents.get(file) || ""

          // Check if one concept uses/imports the other
          if (
            content.includes(`import { ${otherConcept.label} }`) ||
            content.includes(`import ${otherConcept.label}`) ||
            content.includes(`from '${otherConcept.label}'`) ||
            content.includes(`from "${otherConcept.label}"`)
          ) {
            relationshipType = "uses"
            weight += 0.2
          }

          // Check for inheritance/extension patterns
          if (
            content.includes(`extends ${otherConcept.label}`) ||
            content.includes(`implements ${otherConcept.label}`)
          ) {
            relationshipType = "extends"
            weight += 0.3
          }

          // Check for definition patterns
          if (
            content.includes(`const ${otherConcept.label} =`) ||
            content.includes(`function ${otherConcept.label}(`)
          ) {
            relationshipType = "defines"
            weight += 0.4
          }
        }

        // Add edge with determined relationship type and weight
        edges.push({
          source: concept.id,
          target: otherConcept.id,
          type: relationshipType,
          weight: Math.min(weight, 1.0), // Cap weight at 1.0
        })
      }

      // Check if one concept is mentioned in the other's files
      else {
        let mentioned = false
        let weight = 0.3 // Base weight for mentions

        for (const file of concept.files) {
          const content = fileContents.get(file) || ""
          if (
            content.includes(otherConcept.label) ||
            content.toLowerCase().includes(otherConcept.label.toLowerCase())
          ) {
            mentioned = true
            weight += 0.1
            break
          }
        }

        if (mentioned) {
          edges.push({
            source: concept.id,
            target: otherConcept.id,
            type: "depends",
            weight: weight,
          })
        }
      }
    }
  }

  return edges
}

/**
 * Categorizes concepts into logical groups
 */
function categorizeConceptsByType(concepts: ConceptNode[]): ConceptNode[] {
  return concepts.map((concept) => {
    let category = "Other"

    if (concept.type === "component") {
      category = "UI Components"
    } else if (concept.type === "hook") {
      category = "Hooks"
    } else if (concept.type === "api") {
      category = "API Endpoints"
    } else if (concept.type === "function" || concept.type === "util") {
      category = "Utilities"
    } else if (concept.type === "class") {
      category = "Classes"
    } else if (concept.type === "context") {
      category = "Contexts"
    } else if (concept.type === "concept") {
      category = "Domain Concepts"
    }

    return {
      ...concept,
      category,
    }
  })
}

/**
 * Generates a description for a concept based on its type and related files
 */
function generateConceptDescription(
  concept: string,
  type: string,
  files: string[],
  fileContents: Map<string, string>,
): string {
  // Default description template
  let description = `${type.charAt(0).toUpperCase() + type.slice(1)} found in ${files.length} file${
    files.length !== 1 ? "s" : ""
  }`

  // For domain concepts, provide more context
  if (type === "concept" && concept.startsWith("Domain:")) {
    const domainName = concept.replace("Domain:", "")
    description = `Domain concept related to ${domainName} functionality`
  }

  // For components, try to extract a better description
  if (type === "component") {
    for (const file of files) {
      const content = fileContents.get(file) || ""

      // Look for JSDoc comments above the component
      const jsdocRegex = new RegExp(
        `\\/\\*\\*[\\s\\S]*?\\*\\/\\s*export\\s+(?:default\\s+)?(?:function|const)\\s+${concept}\\b`,
        "m",
      )
      const jsdocMatch = content.match(jsdocRegex)

      if (jsdocMatch) {
        const jsdoc = jsdocMatch[0]
        const descriptionMatch = jsdoc.match(/@description\s+([^\n]+)/) || jsdoc.match(/\*\s+([^\n@]+)/)

        if (descriptionMatch && descriptionMatch[1].trim()) {
          description = descriptionMatch[1].trim()
          break
        }
      }
    }
  }

  // For API endpoints, provide more context
  if (type === "api" && concept.startsWith("API:")) {
    const endpoint = concept.replace("API:", "")
    description = `API endpoint for ${endpoint} operations`
  }

  return description
}

/**
 * Builds a knowledge graph from the repository tree
 */
export function buildKnowledgeGraph(tree: TreeNode): KnowledgeGraph {
  // Simulate file contents (in a real implementation, this would come from the API)
  const fileContents = new Map<string, string>()
  const conceptsMap = new Map<string, { concept: string; type: string; files: string[] }>()

  // Traverse the tree to extract concepts from each file
  function traverseTree(node: TreeNode) {
    if (node.type === "blob") {
      // Skip non-code files
      const ext = node.path.split(".").pop()?.toLowerCase() || ""
      if (!["js", "jsx", "ts", "tsx", "css", "scss", "html", "md"].includes(ext)) {
        return
      }

      // Simulate file content based on file path and name
      // In a real implementation, this would fetch actual file content
      const fileName = node.path.split("/").pop() || ""
      let simulatedContent = ""

      if (ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx") {
        // Simulate React component
        if (/^[A-Z]/.test(fileName.split(".")[0])) {
          const componentName = fileName.split(".")[0]
          simulatedContent = `
import React from 'react'
import { useEffect, useState } from 'react'
import { ${componentName}Props } from '../types'
import { formatData } from '../utils/formatters'

/**
 * ${componentName} component for displaying ${componentName.toLowerCase()} information
 * @description A reusable ${componentName.toLowerCase()} component
 */
export function ${componentName}({ data }) {
  const [state, setState] = useState(null)
  
  useEffect(() => {
    // Component logic
  }, [])
  
  return (
    <div className="${componentName.toLowerCase()}-container">
      {/* Component JSX */}
    </div>
  )
}
`
        }
        // Simulate hook
        else if (fileName.startsWith("use")) {
          const hookName = fileName.split(".")[0]
          simulatedContent = `
import { useState, useEffect } from 'react'
import { ${hookName}Options } from '../types'
import { fetchData } from '../utils/api'

/**
 * Custom hook for ${hookName.replace("use", "").toLowerCase()} functionality
 */
export function ${hookName}(options) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Hook logic
  }, [options])
  
  return { data, loading }
}
`
        }
        // Simulate utility
        else if (node.path.includes("/utils/") || node.path.includes("/lib/")) {
          simulatedContent = `
/**
 * Utility functions for ${fileName.split(".")[0]}
 */
export function format${fileName.split(".")[0]}(data) {
  // Formatting logic
  return data
}

export function validate${fileName.split(".")[0]}(input) {
  // Validation logic
  return true
}
`
        }
        // Simulate API route
        else if (node.path.includes("/api/")) {
          const routeName = fileName.split(".")[0]
          simulatedContent = `
import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/db'
import { authenticate } from '../../../lib/auth'

/**
 * API handler for ${routeName} operations
 */
export default async function handler(req, res) {
  const { method } = req
  
  switch (method) {
    case 'GET':
      // Handle GET request
      break
    case 'POST':
      // Handle POST request
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(\`Method \${method} Not Allowed\`)
  }
}
`
        }
      }

      fileContents.set(node.path, simulatedContent)

      // Extract concepts from the file
      const fileType = node.path.split(".").pop() || ""
      const { concepts, types } = extractConcepts(node.path, simulatedContent, fileType)

      // Store concepts with their files
      concepts.forEach((concept, index) => {
        const type = types[index]
        if (!conceptsMap.has(concept)) {
          conceptsMap.set(concept, { concept, type, files: [node.path] })
        } else {
          conceptsMap.get(concept)?.files.push(node.path)
        }
      })
    }

    // Recursively process children
    if (node.children) {
      node.children.forEach(traverseTree)
    }
  }

  traverseTree(tree)

  // Convert concepts map to array of concept nodes
  const conceptNodes: ConceptNode[] = Array.from(conceptsMap.entries()).map(([id, { concept, type, files }]) => ({
    id,
    label: concept.replace(/^(Domain:|API:)/, ""),
    type: type as ConceptNode["type"],
    description: generateConceptDescription(concept, type, files, fileContents),
    category: "",
    weight: Math.min(1, 0.3 + files.length * 0.1), // Base weight + bonus for more files
    files,
    related: [],
  }))

  // Categorize concepts
  const categorizedConcepts = categorizeConceptsByType(conceptNodes)

  // Analyze relationships between concepts
  const edges = analyzeConceptRelationships(categorizedConcepts, fileContents)

  // Update related concepts based on edges
  edges.forEach((edge) => {
    const sourceNode = categorizedConcepts.find((n) => n.id === edge.source)
    const targetNode = categorizedConcepts.find((n) => n.id === edge.target)

    if (sourceNode && targetNode) {
      if (!sourceNode.related.includes(edge.target)) {
        sourceNode.related.push(edge.target)
      }
      if (!targetNode.related.includes(edge.source)) {
        targetNode.related.push(edge.source)
      }
    }
  })

  return {
    nodes: categorizedConcepts,
    edges,
  }
}

/**
 * Finds the most central concepts in the knowledge graph
 */
export function findCentralConcepts(graph: KnowledgeGraph, limit = 10): ConceptNode[] {
  // Calculate centrality based on number of connections
  const centralityScores = new Map<string, number>()

  // Initialize with zero
  graph.nodes.forEach((node) => {
    centralityScores.set(node.id, 0)
  })

  // Count connections for each node
  graph.edges.forEach((edge) => {
    centralityScores.set(edge.source, (centralityScores.get(edge.source) || 0) + edge.weight)
    centralityScores.set(edge.target, (centralityScores.get(edge.target) || 0) + edge.weight)
  })

  // Sort nodes by centrality score
  return [...graph.nodes]
    .sort((a, b) => (centralityScores.get(b.id) || 0) - (centralityScores.get(a.id) || 0))
    .slice(0, limit)
}

/**
 * Finds concepts related to a given concept
 */
export function findRelatedConcepts(
  graph: KnowledgeGraph,
  conceptId: string,
  limit = 10,
): {
  directlyRelated: ConceptNode[]
  indirectlyRelated: ConceptNode[]
} {
  const directlyRelated: ConceptNode[] = []
  const indirectlyRelated: ConceptNode[] = []

  // Find directly related concepts
  const directEdges = graph.edges.filter((edge) => edge.source === conceptId || edge.target === conceptId)
  const directlyRelatedIds = new Set(directEdges.map((edge) => (edge.source === conceptId ? edge.target : edge.source)))

  // Find indirectly related concepts (2 hops away)
  const indirectlyRelatedIds = new Set<string>()
  directlyRelatedIds.forEach((relatedId) => {
    const secondHopEdges = graph.edges.filter(
      (edge) =>
        (edge.source === relatedId || edge.target === relatedId) &&
        edge.source !== conceptId &&
        edge.target !== conceptId,
    )

    secondHopEdges.forEach((edge) => {
      const secondHopId = edge.source === relatedId ? edge.target : edge.source
      if (!directlyRelatedIds.has(secondHopId) && secondHopId !== conceptId) {
        indirectlyRelatedIds.add(secondHopId)
      }
    })
  })

  // Get the actual concept nodes
  graph.nodes.forEach((node) => {
    if (directlyRelatedIds.has(node.id)) {
      directlyRelated.push(node)
    } else if (indirectlyRelatedIds.has(node.id)) {
      indirectlyRelated.push(node)
    }
  })

  // Sort by weight and limit results
  return {
    directlyRelated: directlyRelated.sort((a, b) => b.weight - a.weight).slice(0, limit),
    indirectlyRelated: indirectlyRelated.sort((a, b) => b.weight - a.weight).slice(0, limit),
  }
}

/**
 * Searches for concepts matching a query
 */
export function searchConcepts(graph: KnowledgeGraph, query: string): ConceptNode[] {
  if (!query.trim()) return []

  const lowerQuery = query.toLowerCase().trim()

  return graph.nodes.filter((node) => {
    // Check if query matches concept label
    if (node.label.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check if query matches concept description
    if (node.description.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check if query matches concept category
    if (node.category.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check if query matches any of the files
    if (node.files.some((file) => file.toLowerCase().includes(lowerQuery))) {
      return true
    }

    return false
  })
}

/**
 * Gets concepts by category
 */
export function getConceptsByCategory(graph: KnowledgeGraph): Record<string, ConceptNode[]> {
  const categories: Record<string, ConceptNode[]> = {}

  graph.nodes.forEach((node) => {
    if (!categories[node.category]) {
      categories[node.category] = []
    }
    categories[node.category].push(node)
  })

  // Sort concepts within each category by weight
  Object.keys(categories).forEach((category) => {
    categories[category].sort((a, b) => b.weight - a.weight)
  })

  return categories
}
