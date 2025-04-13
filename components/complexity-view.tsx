"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FileComplexity } from "@/types/github"
import { AlertTriangle, Code, FileCode, FileText } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type ComplexityViewProps = {
  fileComplexity: FileComplexity[]
}

export function ComplexityView({ fileComplexity }: ComplexityViewProps) {
  const [sortBy, setSortBy] = useState("complexity")

  // Sort files by selected metric
  const sortedFiles = [...fileComplexity]
    .sort((a, b) => {
      if (sortBy === "complexity") return b.complexity - a.complexity
      if (sortBy === "lines") return b.lines - a.lines
      if (sortBy === "functions") return b.functions - a.functions
      if (sortBy === "classes" && a.classes && b.classes) return b.classes - a.classes
      return 0
    })
    .slice(0, 10) // Show top 10

  // Calculate max values for scaling
  const maxComplexity = Math.max(...fileComplexity.map((f) => f.complexity))
  const maxLines = Math.max(...fileComplexity.map((f) => f.lines))
  const maxFunctions = Math.max(...fileComplexity.map((f) => f.functions))
  const maxClasses = Math.max(...fileComplexity.filter((f) => f.classes !== undefined).map((f) => f.classes || 0))

  // Calculate averages
  const avgComplexity = Math.round(fileComplexity.reduce((sum, f) => sum + f.complexity, 0) / fileComplexity.length)
  const avgLines = Math.round(fileComplexity.reduce((sum, f) => sum + f.lines, 0) / fileComplexity.length)

  // Count files with high complexity
  const highComplexityCount = fileComplexity.filter((f) => f.complexity > 15).length

  // Get complexity color
  const getComplexityColor = (value: number) => {
    if (value < 10) return "text-green-500"
    if (value < 20) return "text-yellow-500"
    return "text-red-500"
  }

  // Get complexity background
  const getComplexityBg = (value: number) => {
    if (value < 10) return "bg-green-500"
    if (value < 20) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Code className="h-4 w-4 mr-2 text-primary" />
              Average Complexity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplexityColor(avgComplexity)}`}>{avgComplexity}</div>
            <div className="text-xs text-muted-foreground">Cyclomatic complexity per file</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              Average File Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLines} lines</div>
            <div className="text-xs text-muted-foreground">Lines of code per file</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              Complex Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highComplexityCount}</div>
            <div className="text-xs text-muted-foreground">Files with high complexity</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileCode className="h-4 w-4 mr-2 text-primary" />
              File Complexity
            </CardTitle>
            <Tabs value={sortBy} onValueChange={setSortBy} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="complexity" className="text-xs px-2 py-1">
                  Complexity
                </TabsTrigger>
                <TabsTrigger value="lines" className="text-xs px-2 py-1">
                  Lines
                </TabsTrigger>
                <TabsTrigger value="functions" className="text-xs px-2 py-1">
                  Functions
                </TabsTrigger>
                <TabsTrigger value="classes" className="text-xs px-2 py-1">
                  Classes
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedFiles.map((file, index) => {
              const fileName = file.path.split("/").pop() || file.path
              const folderPath = file.path.split("/").slice(0, -1).join("/")

              // Calculate percentages for progress bars
              const complexityPercent = Math.min(100, (file.complexity / maxComplexity) * 100)
              const linesPercent = Math.min(100, (file.lines / maxLines) * 100)
              const functionsPercent = Math.min(100, (file.functions / maxFunctions) * 100)
              const classesPercent = file.classes ? Math.min(100, (file.classes / maxClasses) * 100) : 0

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{fileName}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
                        {folderPath}
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <div className="flex flex-col items-end">
                        <span className={getComplexityColor(file.complexity)}>{file.complexity}</span>
                        <span className="text-muted-foreground text-[10px]">complexity</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span>{file.lines}</span>
                        <span className="text-muted-foreground text-[10px]">lines</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span>{file.functions}</span>
                        <span className="text-muted-foreground text-[10px]">functions</span>
                      </div>
                      {file.classes !== undefined && (
                        <div className="flex flex-col items-end">
                          <span>{file.classes}</span>
                          <span className="text-muted-foreground text-[10px]">classes</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Progress
                      value={complexityPercent}
                      className="h-1"
                      indicatorClassName={getComplexityBg(file.complexity)}
                    />
                    <div className="flex gap-1">
                      <Progress value={linesPercent} className="h-1 flex-1" />
                      <Progress value={functionsPercent} className="h-1 flex-1" />
                      {file.classes !== undefined && <Progress value={classesPercent} className="h-1 flex-1" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
