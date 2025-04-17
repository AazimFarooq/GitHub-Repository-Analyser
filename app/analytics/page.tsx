"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, FileCode, Users, GitFork, Star, Code, Bug } from "lucide-react"
import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const AnalyticsDashboard = () => {
  // Simulated data for codebase overview chart
  const [codebaseData, setCodebaseData] = useState([
    { name: "Week 1", linesAdded: 400, linesRemoved: 150 },
    { name: "Week 2", linesAdded: 300, linesRemoved: 100 },
    { name: "Week 3", linesAdded: 200, linesRemoved: 50 },
    { name: "Week 4", linesAdded: 500, linesRemoved: 200 },
  ])

  // Simulated data for file types distribution
  const [fileTypeData, setFileTypeData] = useState([
    { name: "JavaScript", value: 400, color: "#F7DF1E" },
    { name: "CSS", value: 300, color: "#264DE4" },
    { name: "HTML", value: 200, color: "#E34C26" },
    { name: "JSON", value: 100, color: "#000000" },
  ])

  // Simulated data for additional metrics
  const [additionalMetrics, setAdditionalMetrics] = useState({
    avgCommitSize: 150,
    numContributors: 25,
    numDependencies: 500,
    linesOfCodePerFile: 200,
  })

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

      // Simulate updates for additional metrics
      setAdditionalMetrics((prevMetrics) => ({
        avgCommitSize: Math.max(0, prevMetrics.avgCommitSize + Math.floor(Math.random() * 50 - 25)),
        numContributors: Math.max(0, prevMetrics.numContributors + Math.floor(Math.random() * 10 - 5)),
        numDependencies: Math.max(0, prevMetrics.numDependencies + Math.floor(Math.random() * 100 - 50)),
        linesOfCodePerFile: Math.max(0, prevMetrics.linesOfCodePerFile + Math.floor(Math.random() * 50 - 25)),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6 // Adjust label position
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

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
                    <div className="text-2xl font-bold">{additionalMetrics.numContributors}</div>
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

            <Card className="bg-pink-100 dark:bg-pink-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Avg. Commit Size</div>
                    <div className="text-2xl font-bold">{additionalMetrics.avgCommitSize}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-teal-100 dark:bg-teal-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Dependencies</div>
                    <div className="text-2xl font-bold">{additionalMetrics.numDependencies}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-lime-100 dark:bg-lime-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">LOC per File</div>
                    <div className="text-2xl font-bold">{additionalMetrics.linesOfCodePerFile}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 bg-gray-100 border-none">
        <CardHeader>
          <CardTitle>Codebase Overview</CardTitle>
          <p className="text-sm text-muted-foreground">Lines added and removed over time</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={codebaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip
                contentStyle={{ background: "#333", color: "#fff", borderRadius: "4px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="linesAdded" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              <Area type="monotone" dataKey="linesRemoved" stroke="#e45649" fill="#e45649" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 bg-gray-100 border-none">
        <CardHeader>
          <CardTitle>File Types Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">Distribution of file types in the repository</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {" "}
              {/* Added margin */}
              <Pie
                dataKey="value"
                data={fileTypeData}
                cx="50%"
                cy="50%"
                innerRadius={70} // Increased innerRadius for a donut chart
                outerRadius={90} // Increased outerRadius for larger slices
                fill="#8884d8"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {fileTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#333", color: "#fff", borderRadius: "4px" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-4">
            {fileTypeData.map((entry, index) => (
              <div key={index} className="flex items-center mr-4">
                <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
                <span className="text-sm">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
