"use client"
import { GitHubTreeVisualizer } from "@/components/visualization/github-tree-visualizer"
import { DependencyGraph } from "@/components/visualization/dependency-graph"
import { RepoStats } from "@/components/visualization/repo-stats"
import type { RepositoryAnalysis } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { getAllFilePaths } from "@/lib/utils"

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

        {activeTab === "dependencies" && (
          <motion.div
            key="dependencies"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <DependencyGraph dependencies={data.dependencies} files={allFilePaths} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
