"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, FileCode, Users, GitFork, Star } from "lucide-react"

const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Repository Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-100 dark:bg-blue-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Files</div>
                    <div className="text-2xl font-bold">1,234</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-100 dark:bg-green-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contributors</div>
                    <div className="text-2xl font-bold">42</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-100 dark:bg-yellow-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Forks</div>
                    <div className="text-2xl font-bold">567</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-100 dark:bg-red-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Stars</div>
                    <div className="text-2xl font-bold">8,901</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Codebase Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for a more detailed analytics dashboard.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
