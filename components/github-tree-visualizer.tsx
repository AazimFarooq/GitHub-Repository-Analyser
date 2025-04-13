"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, File, Folder, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeNode } from "@/types/github"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

type GitHubTreeVisualizerProps = {
  data: TreeNode | null
}

export function GitHubTreeVisualizer({ data }: GitHubTreeVisualizerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredData, setFilteredData] = useState<TreeNode | null>(data)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-expand first two levels
  useEffect(() => {
    if (!data) return

    const paths = new Set<string>()

    const expandFirstTwoLevels = (node: TreeNode, level = 0) => {
      if (level < 2 && node.type === "tree") {
        paths.add(node.path)

        if (node.children) {
          node.children.forEach((child) => {
            expandFirstTwoLevels(child, level + 1)
          })
        }
      }
    }

    expandFirstTwoLevels(data)
    setExpandedPaths(paths)
  }, [data])

  // Filter data based on search term
  useEffect(() => {
    if (!data) {
      setFilteredData(null)
      return
    }

    if (!searchTerm) {
      setFilteredData(data)
      return
    }

    // Clone the tree and filter it
    const filterTree = (node: TreeNode): TreeNode | null => {
      // Create a new node to avoid mutating the original
      const newNode: TreeNode = { ...node }

      // If it's a file, check if it matches the search
      if (node.type === "blob") {
        return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ? newNode : null
      }

      // If it's a folder, filter its children
      if (node.children) {
        const filteredChildren = node.children.map((child) => filterTree(child)).filter(Boolean) as TreeNode[]

        newNode.children = filteredChildren

        // If the folder has no children after filtering and doesn't match the search term itself,
        // don't include it in the results
        if (filteredChildren.length === 0 && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return null
        }

        return newNode
      }

      return newNode
    }

    const filtered = filterTree(data)
    setFilteredData(filtered)

    // Auto-expand all folders when searching
    if (filtered) {
      const paths = new Set<string>()

      const expandAllFolders = (node: TreeNode) => {
        if (node.type === "tree") {
          paths.add(node.path)

          if (node.children) {
            node.children.forEach(expandAllFolders)
          }
        }
      }

      expandAllFolders(filtered)
      setExpandedPaths(paths)
    }
  }, [data, searchTerm])

  const toggleFolder = (path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleExpandAll = () => {
    if (!filteredData) return

    const paths = new Set<string>()

    const expandAllFolders = (node: TreeNode) => {
      if (node.type === "tree") {
        paths.add(node.path)

        if (node.children) {
          node.children.forEach(expandAllFolders)
        }
      }
    }

    expandAllFolders(filteredData)
    setExpandedPaths(paths)
  }

  const handleCollapseAll = () => {
    setExpandedPaths(new Set())
  }

  if (!filteredData) return null

  return (
    <div className="font-mono text-sm" ref={containerRef}>
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 bg-background"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll} className="text-xs">
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll} className="text-xs">
            Collapse All
          </Button>
        </div>
      </div>

      <div className="overflow-auto max-h-[70vh] custom-scrollbar pr-2">
        <div className="mb-2 font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5 folder-icon" />
          <span>{filteredData.name}</span>
        </div>
        <div className="space-y-0.5">
          {filteredData.children?.map((child, index) => (
            <TreeNodeComponent
              key={`${child.path}-${index}`}
              node={child}
              level={0}
              isExpanded={expandedPaths.has(child.path)}
              toggleFolder={toggleFolder}
              hoveredNode={hoveredNode}
              setHoveredNode={setHoveredNode}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type TreeNodeProps = {
  node: TreeNode
  level: number
  isExpanded: boolean
  toggleFolder: (path: string) => void
  hoveredNode: string | null
  setHoveredNode: (path: string | null) => void
  searchTerm: string
}

function TreeNodeComponent({
  node,
  level,
  isExpanded,
  toggleFolder,
  hoveredNode,
  setHoveredNode,
  searchTerm,
}: TreeNodeProps) {
  const isFolder = node.type === "tree"
  const isHovered = hoveredNode === node.path

  // Highlight search matches
  const highlightMatch = (text: string) => {
    if (!searchTerm) return text

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"))

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    )
  }

  return (
    <div className="select-none">
      <motion.div
        className={cn("flex items-center rounded-md px-1 py-1 cursor-pointer tree-node-hover", isHovered && "bg-muted")}
        onClick={() => isFolder && toggleFolder(node.path)}
        onMouseEnter={() => setHoveredNode(node.path)}
        onMouseLeave={() => setHoveredNode(null)}
        style={{ paddingLeft: `${level * 16}px` }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        {isFolder ? (
          <>
            <div className="mr-1 w-4 h-4 flex items-center justify-center">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </motion.div>
            </div>
            <Folder className="h-4 w-4 mr-2 folder-icon node-icon shrink-0" />
          </>
        ) : (
          <>
            <span className="w-4 mr-1" />
            <File className="h-4 w-4 mr-2 file-icon node-icon shrink-0" />
          </>
        )}
        <span className="truncate">{highlightMatch(node.name)}</span>

        {/* File extension badge */}
        {!isFolder && node.name.includes(".") && (
          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
            {node.name.split(".").pop()}
          </span>
        )}
      </motion.div>

      <AnimatePresence>
        {isExpanded && isFolder && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child, index) => (
              <TreeNodeComponent
                key={`${child.path}-${index}`}
                node={child}
                level={level + 1}
                isExpanded={isExpanded && expandedPaths.has(child.path)}
                toggleFolder={toggleFolder}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                searchTerm={searchTerm}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Keep track of expanded paths
const expandedPaths = new Set<string>()
