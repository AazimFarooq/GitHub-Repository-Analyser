"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RepositoryAnalysis } from "@/types/github"
import { Calendar, Code, FileText, FolderTree, GitFork, Star } from "lucide-react"
import { format, parseISO } from "date-fns"

type RepoOverviewProps = {
  data: RepositoryAnalysis
  repoDetails: {
    name: string
    fullName: string
    description?: string
    stars: number
    forks: number
    openIssues: number
    createdAt: string
    updatedAt: string
    defaultBranch: string
    license?: string
    homepage?: string
  }
}

export function RepoOverview({ data, repoDetails }: RepoOverviewProps) {
  // Calculate language percentages
  const totalBytes = Object.values(data.languages || {}).reduce((sum, bytes) => sum + bytes, 0)
  const languagePercentages = Object.entries(data.languages || {})
    .map(([name, bytes]) => ({
      name,
      percentage: Math.round((bytes / totalBytes) * 100),
      bytes,
    }))
    .sort((a, b) => b.percentage - a.percentage)

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Get language color
  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: "#f7df1e",
      TypeScript: "#3178c6",
      Python: "#3572A5",
      Java: "#b07219",
      "C#": "#178600",
      PHP: "#4F5D95",
      Ruby: "#CC342D",
      Go: "#00ADD8",
      Rust: "#DEA584",
      HTML: "#e34c26",
      CSS: "#563d7c",
      Shell: "#89e051",
    }

    return colors[language] || "#6e7781"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{repoDetails.name}</h2>
              <p className="text-muted-foreground">{repoDetails.description || "No description provided"}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {repoDetails.license && (
                <Badge variant="outline" className="text-xs">
                  {repoDetails.license}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {repoDetails.defaultBranch}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{repoDetails.stars.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">stars</span>
              </div>

              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{repoDetails.forks.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">forks</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="font-medium">{data.stats.totalFiles.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">files</span>
              </div>

              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{data.stats.totalFolders.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">folders</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="text-sm">{format(parseISO(repoDetails.createdAt), "MMM d, yyyy")}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Last updated</div>
                  <div className="text-sm">{format(parseISO(repoDetails.updatedAt), "MMM d, yyyy")}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-2 text-primary" />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full rounded-full overflow-hidden bg-muted flex">
              {languagePercentages.map((lang, i) => (
                <div
                  key={i}
                  className="h-full"
                  style={{
                    width: `${lang.percentage}%`,
                    backgroundColor: getLanguageColor(lang.name),
                    minWidth: lang.percentage > 0 ? "3px" : "0",
                  }}
                  title={`${lang.name}: ${lang.percentage}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
              {languagePercentages.map((lang, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: getLanguageColor(lang.name) }}
                  />
                  <span className="text-sm">{lang.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {lang.percentage}% ({formatBytes(lang.bytes)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
