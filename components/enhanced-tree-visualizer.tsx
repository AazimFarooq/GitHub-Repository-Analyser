"use client"

import { useState, useEffect, useCallback } from "react"
import { FolderIcon, FileIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronRight, Settings } from "lucide-react"
import { SettingsModal } from "@/components/settings-modal"
import { cn } from "@/lib/utils"

interface TreeNode {
  name: string
  path: string
  type: "tree" | "blob"
  children?: TreeNode[]
}

interface EnhancedTreeVisualizerProps {
  data: TreeNode
  initialExpandedLevel?: number
}

export function EnhancedTreeVisualizer({ data, initialExpandedLevel = 2 }: EnhancedTreeVisualizerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState<TreeNode | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState({
    expandLevel: initialExpandedLevel,
    showFileIcons: true,
    showFileSize: true,
    theme: "system",
    codeHighlightTheme: "github",
  })

  // Initialize expanded nodes based on level
  useEffect(() => {
    const nodesToExpand = new Set<string>()

    const expandToLevel = (node: TreeNode, currentLevel: number) => {
      if (currentLevel <= settings.expandLevel && node.type === "tree") {
        nodesToExpand.add(node.path)
        node.children?.forEach((child) => expandToLevel(child, currentLevel + 1))
      }
    }

    expandToLevel(data, 1)
    setExpandedNodes(nodesToExpand)
  }, [data, settings.expandLevel])

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(null)
      return
    }

    const query = searchQuery.toLowerCase()

    const filterNode = (node: TreeNode): TreeNode | null => {
      if (node.name.toLowerCase().includes(query)) {
        return { ...node }
      }

      if (node.children) {
        const filteredChildren = node.children.map(filterNode).filter((child): child is TreeNode => child !== null)

        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          }
        }
      }

      return null
    }

    const result = filterNode(data)
    setFilteredData(result)

    // Expand all nodes in the filtered result
    if (result) {
      const nodesToExpand = new Set<string>()

      const collectPaths = (node: TreeNode) => {
        if (node.type === "tree") {
          nodesToExpand.add(node.path)
          node.children?.forEach(collectPaths)
        }
      }

      collectPaths(result)
      setExpandedNodes(nodesToExpand)
    }
  }, [searchQuery, data])

  const toggleNode = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const nodesToExpand = new Set<string>()

    const collectPaths = (node: TreeNode) => {
      if (node.type === "tree") {
        nodesToExpand.add(node.path)
        node.children?.forEach(collectPaths)
      }
    }

    collectPaths(filteredData || data)
    setExpandedNodes(nodesToExpand)
  }, [data, filteredData])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  const renderTree = (node: TreeNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.path)
    const isFolder = node.type === "tree"
    const hasChildren = isFolder && node.children && node.children.length > 0

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center py-1 px-2 rounded-md hover:bg-accent/50 ${level === 0 ? "font-medium" : ""}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.path)}
              className="mr-1 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {settings.showFileIcons && (
            <span className="mr-2">
              {isFolder ? (
                <FolderIcon className="h-4 w-4 text-amber-400" />
              ) : (
                <FileIcon className="h-4 w-4 text-slate-400" />
              )}
            </span>
          )}

          <span className={`truncate ${isFolder ? "font-medium" : ""}`}>{node.name}</span>
        </div>

        {isExpanded && hasChildren && <div>{node.children?.map((child) => renderTree(child, level + 1))}</div>}
      </div>
    )
  }

  const dataToRender = filteredData || data

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files and folders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "w-10 h-10 p-0 rounded-full",
              "bg-background hover:bg-accent hover:text-accent-foreground",
              "border border-input shadow-sm",
              "transition-colors duration-200",
            )}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-md bg-background p-2 max-h-[600px] overflow-auto">
        {dataToRender ? (
          renderTree(dataToRender)
        ) : (
          <div className="p-4 text-center text-muted-foreground">No data available</div>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  )
}
