"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, FolderTree, Code, FileCode } from "lucide-react"
import { motion } from "framer-motion"

type RepoStatsProps = {
  stats: {
    totalFiles: number
    totalFolders: number
    totalSize?: number
    mainLanguage?: string
  }
  fileTypes: Record<string, number>
}

export function RepoStats({ stats, fileTypes }: RepoStatsProps) {
  // Get top 5 file types
  const topFileTypes = Object.entries(fileTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card className="overflow-hidden card-hover-effect">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg"></div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Files</div>
                <div className="text-3xl font-bold">{stats.totalFiles.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden card-hover-effect">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-lg"></div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <FolderTree className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Folders</div>
                <div className="text-3xl font-bold">{stats.totalFolders.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden card-hover-effect">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-amber-500/5 rounded-lg"></div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30">
                <Code className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Main Language</div>
                <div className="text-3xl font-bold capitalize">{stats.mainLanguage || "Unknown"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden card-hover-effect">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-blue-500/5 rounded-lg"></div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <FileCode className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Top File Types</div>
                <div className="space-y-1 mt-2">
                  {topFileTypes.map(([ext, count]) => (
                    <div key={ext} className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: getExtensionColor(ext),
                          }}
                        ></div>
                        <span className="text-sm font-medium">.{ext}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function getExtensionColor(ext: string): string {
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
