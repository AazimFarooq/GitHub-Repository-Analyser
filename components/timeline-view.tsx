"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CommitActivity } from "@/types/github"
import { Calendar, GitCommit, GitPullRequest } from "lucide-react"
import { format, fromUnixTime } from "date-fns"

type TimelineViewProps = {
  commitActivity: CommitActivity[]
}

export function TimelineView({ commitActivity }: TimelineViewProps) {
  const [timeframe, setTimeframe] = useState("month")

  // Process commit activity data
  const processedActivity = commitActivity.map((week) => ({
    date: fromUnixTime(week.week),
    commits: week.commits,
    additions: week.additions,
    deletions: week.deletions,
  }))

  // Calculate totals
  const totalCommits = processedActivity.reduce((sum, week) => sum + week.commits, 0)
  const totalAdditions = processedActivity.reduce((sum, week) => sum + week.additions, 0)
  const totalDeletions = processedActivity.reduce((sum, week) => sum + week.deletions, 0)

  // Get data for the selected timeframe
  const getTimeframeData = () => {
    switch (timeframe) {
      case "week":
        return processedActivity.slice(-1)
      case "month":
        return processedActivity.slice(-4)
      case "quarter":
        return processedActivity.slice(-13)
      case "year":
        return processedActivity.slice(-52)
      default:
        return processedActivity
    }
  }

  const timeframeData = getTimeframeData()

  // Find max values for scaling
  const maxCommits = Math.max(...timeframeData.map((week) => week.commits))
  const maxChanges = Math.max(...timeframeData.map((week) => Math.max(week.additions, week.deletions)))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GitCommit className="h-4 w-4 mr-2 text-primary" />
              Total Commits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GitPullRequest className="h-4 w-4 mr-2 text-green-500" />
              Lines Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{totalAdditions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GitPullRequest className="h-4 w-4 mr-2 text-red-500" />
              Lines Removed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-{totalDeletions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Commit Activity
            </CardTitle>
            <Tabs value={timeframe} onValueChange={setTimeframe} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-2 py-1">
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-2 py-1">
                  Month
                </TabsTrigger>
                <TabsTrigger value="quarter" className="text-xs px-2 py-1">
                  Quarter
                </TabsTrigger>
                <TabsTrigger value="year" className="text-xs px-2 py-1">
                  Year
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {timeframeData.map((week, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-36">
                    <div className="font-medium">{format(week.date, "MMM d, yyyy")}</div>
                    <div className="flex justify-between">
                      <span>Commits:</span>
                      <span>{week.commits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Added:</span>
                      <span className="text-green-500">+{week.additions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Removed:</span>
                      <span className="text-red-500">-{week.deletions}</span>
                    </div>
                  </div>

                  {/* Commit bar */}
                  <div
                    className="w-full bg-primary/80 rounded-t"
                    style={{
                      height: `${(week.commits / maxCommits) * 100}%`,
                      minHeight: week.commits > 0 ? "4px" : "0",
                    }}
                  />

                  {/* Additions/Deletions bars */}
                  <div className="w-full flex justify-center mt-1">
                    <div
                      className="w-1/3 bg-green-500 rounded-t mr-px"
                      style={{
                        height: `${(week.additions / maxChanges) * 60}%`,
                        minHeight: week.additions > 0 ? "2px" : "0",
                      }}
                    />
                    <div
                      className="w-1/3 bg-red-500 rounded-t ml-px"
                      style={{
                        height: `${(week.deletions / maxChanges) * 60}%`,
                        minHeight: week.deletions > 0 ? "2px" : "0",
                      }}
                    />
                  </div>
                </div>

                {/* Date label */}
                <div className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                  {format(week.date, timeframe === "week" ? "MMM d" : "MMM d")}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary/80 rounded mr-1" />
              <span>Commits</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1" />
              <span>Additions</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-1" />
              <span>Deletions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
