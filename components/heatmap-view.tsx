"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { TreeNode } from "@/types/github"
import { Thermometer, FileText, FolderTree } from "lucide-react"

type HeatmapViewProps = {
  tree: TreeNode
  activityData: Record<string, number>
}

export function HeatmapView({ tree, activityData }: HeatmapViewProps) {
  const [threshold, setThreshold] = useState(50)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  // Expand root folders by default
  useEffect(() => {
    if (tree.children) {
      const rootFolders = new Set<string>()
      tree.children.forEach((child) => {
        if (child.type === "tree") {
          rootFolders.add(child.path)
        }
      })
      setExpandedFolders(rootFolders)
    }
  }, [tree])

  const renderTree = (node: TreeNode, level = 0) => {
    const isFolder = node.type === "tree"
    const isExpanded = expandedFolders.has(node.path)
    const activity = activityData[node.path] || 0
    const isActive = activity >= threshold

    // Calculate color based on activity level
    const getHeatColor = (activity: number) => {
      if (activity < 20) return "bg-blue-100 dark:bg-blue-900/30"
      if (activity < 40) return "bg-green-100 dark:bg-green-900/30"
      if (activity < 60) return "bg-yellow-100 dark:bg-yellow-900/30"
      if (activity < 80) return "bg-orange-100 dark:bg-orange-900/30"
      return "bg-red-100 dark:bg-red-900/30"
    }

    const getTextColor = (activity: number) => {
      if (activity < 20) return "text-blue-700 dark:text-blue-300"
      if (activity < 40) return "text-green-700 dark:text-green-300"
      if (activity < 60) return "text-yellow-700 dark:text-yellow-300"
      if (activity < 80) return "text-orange-700 dark:text-orange-300"
      return "text-red-700 dark:text-red-300"
    }

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center rounded px-1 py-0.5 cursor-pointer ${
            isFolder ? "hover:bg-muted/50" : isActive ? getHeatColor(activity) : "opacity-40"
          }`}
          onClick={() => isFolder && toggleFolder(node.path)}
          style={{ paddingLeft: `${level * 16}px` }}
        >
          {isFolder ? (
            <FolderTree className="h-4 w-4 mr-2 text-yellow-500 shrink-0" />
          ) : (
            <FileText className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
          )}
          <span className={`truncate ${!isFolder && isActive ? getTextColor(activity) : ""}`}>{node.name}</span>
          {!isFolder && isActive && (
            <div className="ml-auto flex items-center">
              <Thermometer className={`h-3 w-3 mr-1 ${getTextColor(activity)}`} />
              <span className={`text-xs ${getTextColor(activity)}`}>{activity}</span>
            </div>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div>{node.children.map((child) => renderTree(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity Threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Slider
              value={[threshold]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setThreshold(value[0])}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8">{threshold}</span>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Low Activity</span>
            <span>High Activity</span>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 border rounded-lg bg-background">
        <div className="font-mono text-sm">
          <div className="mb-2 font-semibold">Activity Heatmap</div>
          <div className="overflow-auto max-h-[70vh]">{tree.children?.map((child) => renderTree(child))}</div>
        </div>
      </div>
    </div>
  )
}
