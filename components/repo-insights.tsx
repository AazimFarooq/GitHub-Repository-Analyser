"use client"
import { GitHubTreeVisualizer } from "@/components/github-tree-visualizer"
import { RepoStats } from "@/components/repo-stats"
import type { RepositoryAnalysis } from "@/types/github"
import { motion, AnimatePresence } from "framer-motion"
import CodeSandbox from "@/components/code-sandbox"

type RepoInsightsProps = {
  data: RepositoryAnalysis
  activeTab?: string
}

export function RepoInsights({ data, activeTab = "structure" }: RepoInsightsProps) {
  // Extract all file paths for the dependency graph
  const allFilePaths = getAllFilePaths(data.tree)

  return (
    <div className="p-6 space-y-6">
      <RepoStats stats={data.stats} fileTypes={data.fileTypes} />

      <AnimatePresence mode="wait">
        {activeTab === "structure" && (
          <motion.div
            key="structure"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GitHubTreeVisualizer data={data.tree} />
          </motion.div>
        )}

        {activeTab === "sandbox" && (
          <motion.div
            key="sandbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CodeSandbox />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper function to get all file paths
function getAllFilePaths(node: any): string[] {
  const paths: string[] = []

  function traverse(node: any) {
    if (!node) return // Add null check

    if (node.type === "blob") {
      paths.push(node.path)
    } else if (node.children) {
      node.children.forEach((child: any) => {
        if (child) traverse(child) // Add null check
      })
    }
  }

  traverse(node)
  return paths
}
