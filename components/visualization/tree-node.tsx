"use client"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeNode } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { FolderIcon, FileIcon } from "@/components/ui/icons"

type TreeNodeProps = {
  node: TreeNode
  level: number
  isExpanded: boolean
  toggleFolder: (path: string) => void
  hoveredNode: string | null
  setHoveredNode: (path: string | null) => void
  searchTerm: string
}

export function TreeNodeComponent({
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
            <FolderIcon className="h-4 w-4 mr-2 folder-icon node-icon shrink-0" />
          </>
        ) : (
          <>
            <span className="w-4 mr-1" />
            <FileIcon className="h-4 w-4 mr-2 file-icon node-icon shrink-0" />
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
