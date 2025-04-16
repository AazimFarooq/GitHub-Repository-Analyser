"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, FileCode, Users, GitFork, Star, Code, Bug } from "lucide-react"
import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const AnalyticsDashboard = () => {
  // Simulated data for codebase overview chart
  const [codebaseData, setCodebaseData] = useState([
    { name: "Week 1", linesAdded: 400, linesRemoved: 150 },
    { name: "Week 2", linesAdded: 300, linesRemoved: 100 },
    { name: "Week 3", linesAdded: 200, linesRemoved: 50 },
    { name: "Week 4", linesAdded: 500, linesRemoved: 200 },
  ])

  useEffect(() => {
    // Simulate data updates every 5 seconds
    const interval = setInterval(() => {
      setCodebaseData((prevData) => {
        const newData = prevData.map((item) => ({
          ...item,
          linesAdded: Math.max(0, item.linesAdded + Math.floor(Math.random() * 200 - 100)),
          linesRemoved: Math.max(0, item.linesRemoved + Math.floor(Math.random() * 100 - 50)),
        }))
        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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

            <Card className="bg-purple-100 dark:bg-purple-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Lines of Code</div>
                    <div className="text-2xl font-bold">25,348</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-100 dark:bg-orange-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Open Issues</div>
                    <div className="text-2xl font-bold">72</div>
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
          <p className="text-sm text-muted-foreground">Lines added and removed over time</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={codebaseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="linesAdded" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              <Area type="monotone" dataKey="linesRemoved" stroke="#e45649" fill="#e45649" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
