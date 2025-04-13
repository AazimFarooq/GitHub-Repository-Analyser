"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TreeNode } from "@/types/github"
import { Filter, Search, X } from "lucide-react"

type SearchFilterProps = {
  tree: TreeNode
  onFilterChange: (filteredTree: TreeNode) => void
}

export function SearchFilter({ tree, onFilterChange }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [fileTypes, setFileTypes] = useState<Record<string, boolean>>({})
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Extract all file extensions on component mount
  useEffect(() => {
    const extensions: Record<string, boolean> = {}

    // Update the extractExtensions function to add proper null checks
    const extractExtensions = (node: TreeNode) => {
      if (!node) return // Add null check for node

      if (node.type === "blob") {
        const ext = node.name.split(".").pop()?.toLowerCase() || "unknown"
        extensions[ext] = true
      } else if (node.children) {
        node.children.forEach((child) => {
          if (child) extractExtensions(child) // Add null check for child
        })
      }
    }

    // Only call extractExtensions if tree is defined
    if (tree) {
      extractExtensions(tree)
    }
    setFileTypes(extensions)
  }, [tree])

  // Apply filters when search term or active filters change
  useEffect(() => {
    const applyFilters = () => {
      // If no filters are active, return the original tree
      if (searchTerm === "" && activeFilters.length === 0) {
        onFilterChange(tree)
        return
      }

      // Clone the tree and filter it
      const filteredTree = filterTree(tree)
      onFilterChange(filteredTree)
    }

    applyFilters()
  }, [searchTerm, activeFilters, tree, onFilterChange])

  // Filter tree based on search term and active filters
  const filterTree = (node: TreeNode): TreeNode => {
    // Create a new node to avoid mutating the original
    const newNode: TreeNode = { ...node }

    // If it's a file, check if it matches the filters
    if (node.type === "blob") {
      const ext = node.name.split(".").pop()?.toLowerCase() || "unknown"
      const matchesFilter = activeFilters.length === 0 || activeFilters.includes(ext)
      const matchesSearch = searchTerm === "" || node.name.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesFilter && matchesSearch ? newNode : null
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
    }

    return newNode
  }

  // Toggle a file type filter
  const toggleFileType = (ext: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(ext)) {
        return prev.filter((item) => item !== ext)
      } else {
        return [...prev, ext]
      }
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setActiveFilters([])
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9"
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {activeFilters.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter by file type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.keys(fileTypes)
            .sort()
            .map((ext) => (
              <DropdownMenuCheckboxItem
                key={ext}
                checked={activeFilters.includes(ext)}
                onCheckedChange={() => toggleFileType(ext)}
              >
                {ext === "unknown" ? "No extension" : `.${ext}`}
              </DropdownMenuCheckboxItem>
            ))}
          {activeFilters.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <Button variant="ghost" size="sm" className="w-full justify-center" onClick={clearFilters}>
                Clear filters
              </Button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
