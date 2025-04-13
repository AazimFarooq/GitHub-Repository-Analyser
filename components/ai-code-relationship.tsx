"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import type { TreeNode } from "@/types/github"
import { Brain, Search, Zap, Network, FileCode, ArrowRight, Lightbulb, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type AICodeRelationshipProps = {
  tree: TreeNode
}

// Simulated AI analysis results
const generateAIInsights = (tree: TreeNode) => {
  // Extract file nodes
  const fileNodes: TreeNode[] = []
  const extractFiles = (node: TreeNode) => {
    if (node.type === "blob") {
      fileNodes.push(node)
    } else if (node.children) {
      node.children.forEach(extractFiles)
    }
  }
  extractFiles(tree)

  // Filter to only include code files
  const codeFiles = fileNodes.filter((file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    return ["js", "jsx", "ts", "tsx", "py", "java", "rb", "go", "php", "c", "cpp", "cs"].includes(ext)
  })

  // Generate semantic relationships
  const relationships = []
  for (let i = 0; i < codeFiles.length; i++) {
    const file = codeFiles[i]
    const relatedFiles = []

    // Add 1-3 related files
    const numRelated = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < numRelated; j++) {
      const randomIndex = Math.floor(Math.random() * codeFiles.length)
      if (randomIndex !== i) {
        relatedFiles.push({
          file: codeFiles[randomIndex],
          relationshipType: getRandomRelationshipType(),
          confidence: 0.5 + Math.random() * 0.5, // 0.5-1.0
          description: getRandomRelationshipDescription(codeFiles[randomIndex].name, file.name),
        })
      }
    }

    relationships.push({
      file,
      relatedFiles,
    })
  }

  // Generate code smells
  const codeSmells = codeFiles
    .filter(() => Math.random() > 0.7) // Only some files have code smells
    .map((file) => ({
      file,
      type: getRandomCodeSmellType(),
      severity: Math.random() > 0.5 ? "high" : "medium",
      description: getRandomCodeSmellDescription(file.name),
      suggestion: getRandomRefactoringAdvice(file.name),
    }))

  // Generate architectural insights
  const architecturalPatterns = [
    {
      name: "MVC Pattern",
      confidence: 0.7 + Math.random() * 0.3,
      description:
        "The codebase appears to follow the Model-View-Controller pattern, with clear separation of concerns.",
      files: codeFiles.filter(() => Math.random() > 0.7).slice(0, 5),
    },
    {
      name: "Repository Pattern",
      confidence: 0.6 + Math.random() * 0.3,
      description: "Data access is abstracted through repository classes, providing a clean API for data operations.",
      files: codeFiles.filter(() => Math.random() > 0.8).slice(0, 3),
    },
    {
      name: "Factory Pattern",
      confidence: 0.5 + Math.random() * 0.3,
      description: "Object creation is handled through factory methods, allowing for flexible instantiation.",
      files: codeFiles.filter(() => Math.random() > 0.85).slice(0, 2),
    },
  ]

  return {
    relationships,
    codeSmells,
    architecturalPatterns,
    summary: generateCodebaseSummary(tree.name),
  }
}

// Helper functions for generating realistic AI insights
const getRandomRelationshipType = () => {
  const types = [
    "imports",
    "extends",
    "implements",
    "uses",
    "depends on",
    "calls",
    "references",
    "inherits from",
    "composes",
  ]
  return types[Math.floor(Math.random() * types.length)]
}

const getRandomRelationshipDescription = (file1: string, file2: string) => {
  const descriptions = [
    `${file1} ${getRandomRelationshipType()} ${file2} for handling data processing.`,
    `${file1} provides utility functions that are used by ${file2}.`,
    `${file1} and ${file2} share similar functionality and could be refactored.`,
    `${file1} depends on interfaces defined in ${file2}.`,
    `${file1} and ${file2} have high semantic coupling but low structural coupling.`,
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

const getRandomCodeSmellType = () => {
  const types = [
    "Long Method",
    "Large Class",
    "Duplicate Code",
    "Feature Envy",
    "Shotgun Surgery",
    "Divergent Change",
    "God Class",
    "Data Class",
  ]
  return types[Math.floor(Math.random() * types.length)]
}

const getRandomCodeSmellDescription = (fileName: string) => {
  const descriptions = [
    `${fileName} contains methods that are too long and complex.`,
    `${fileName} has too many responsibilities and should be split.`,
    `${fileName} contains duplicated code that should be extracted.`,
    `${fileName} accesses data from other classes excessively.`,
    `${fileName} requires changes in multiple places when modified.`,
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

const getRandomRefactoringAdvice = (fileName: string) => {
  const advice = [
    `Extract methods in ${fileName} to improve readability.`,
    `Split ${fileName} into smaller, more focused classes.`,
    `Create a common utility function to eliminate duplication.`,
    `Move methods to the classes that own the data they manipulate.`,
    `Apply the Strategy pattern to make ${fileName} more maintainable.`,
  ]
  return advice[Math.floor(Math.random() * advice.length)]
}

const generateCodebaseSummary = (repoName: string) => {
  return `The ${repoName} codebase appears to be a well-structured application with clear separation of concerns. The code follows modern development practices with a focus on maintainability.

Key observations:
- Modular architecture with clear component boundaries
- Consistent coding style across most files
- Good use of design patterns in core functionality
- Some technical debt in older modules
- Test coverage could be improved in certain areas

Recommendation: Consider refactoring the identified code smells and improving test coverage for critical components.`
}

export function AICodeRelationship({ tree }: AICodeRelationshipProps) {
  const [insights, setInsights] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("relationships")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Simulate AI analysis
  const runAnalysis = () => {
    setIsAnalyzing(true)

    // Simulate AI processing time
    setTimeout(() => {
      const results = generateAIInsights(tree)
      setInsights(results)
      setIsAnalyzing(false)
    }, 2500)
  }

  // Filter results based on search term
  const getFilteredResults = () => {
    if (!insights) return null

    if (!searchTerm) return insights

    const term = searchTerm.toLowerCase()

    return {
      ...insights,
      relationships: insights.relationships.filter(
        (rel: any) =>
          rel.file.name.toLowerCase().includes(term) ||
          rel.relatedFiles.some(
            (related: any) =>
              related.file.name.toLowerCase().includes(term) || related.description.toLowerCase().includes(term),
          ),
      ),
      codeSmells: insights.codeSmells.filter(
        (smell: any) =>
          smell.file.name.toLowerCase().includes(term) ||
          smell.type.toLowerCase().includes(term) ||
          smell.description.toLowerCase().includes(term),
      ),
      architecturalPatterns: insights.architecturalPatterns.filter(
        (pattern: any) =>
          pattern.name.toLowerCase().includes(term) ||
          pattern.description.toLowerCase().includes(term) ||
          pattern.files.some((file: any) => file.name.toLowerCase().includes(term)),
      ),
    }
  }

  const filteredResults = getFilteredResults()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Brain className="h-4 w-4 mr-2 text-primary" />
            AI-Powered Code Relationship Analysis
          </CardTitle>

          {insights && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="relationships" className="text-xs px-2 py-1">
                  <Network className="h-3 w-3 mr-1" />
                  Relationships
                </TabsTrigger>
                <TabsTrigger value="smells" className="text-xs px-2 py-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Code Smells
                </TabsTrigger>
                <TabsTrigger value="patterns" className="text-xs px-2 py-1">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Patterns
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-lg font-medium">AI Code Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Discover hidden relationships, code smells, and architectural patterns in your codebase using our
                advanced AI analysis.
              </p>
            </div>
            <Button onClick={runAnalysis} className="gap-2">
              <Zap className="h-4 w-4" />
              Run AI Analysis
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Analyzing Code Relationships</h3>
              <p className="text-sm text-muted-foreground">
                Our AI is examining your codebase to identify semantic relationships, code smells, and architectural
                patterns...
              </p>
            </div>
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files, patterns, or code smells..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>

            {/* Summary */}
            {activeTab === "relationships" && !searchTerm && (
              <div className="p-4 bg-muted/30 rounded-lg text-sm">
                <p className="whitespace-pre-line">{insights.summary}</p>
              </div>
            )}

            {/* Content based on active tab */}
            <AnimatePresence mode="wait">
              {activeTab === "relationships" && filteredResults && (
                <motion.div
                  key="relationships"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {filteredResults.relationships.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No relationships found matching your search.
                    </div>
                  ) : (
                    filteredResults.relationships.map((rel: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span className="font-medium">{rel.file.name}</span>
                        </div>

                        <div className="pl-6 space-y-2">
                          {rel.relatedFiles.map((related: any, j: number) => (
                            <div key={j} className="flex items-start gap-2 text-sm">
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{related.file.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {related.relationshipType}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      related.confidence > 0.8
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : related.confidence > 0.6
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                          : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                                    )}
                                  >
                                    {Math.round(related.confidence * 100)}% confidence
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-xs mt-1">{related.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === "smells" && filteredResults && (
                <motion.div
                  key="smells"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {filteredResults.codeSmells.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No code smells found matching your search.
                    </div>
                  ) : (
                    filteredResults.codeSmells.map((smell: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-primary" />
                            <span className="font-medium">{smell.file.name}</span>
                          </div>
                          <Badge
                            className={cn("text-white", smell.severity === "high" ? "bg-red-500" : "bg-orange-500")}
                          >
                            {smell.severity}
                          </Badge>
                        </div>

                        <div className="pl-6 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{smell.type}</div>
                              <p className="text-muted-foreground text-xs mt-1">{smell.description}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
                            <div>
                              <div className="font-medium text-sm">Suggestion</div>
                              <p className="text-muted-foreground text-xs mt-1">{smell.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === "patterns" && filteredResults && (
                <motion.div
                  key="patterns"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {filteredResults.architecturalPatterns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No architectural patterns found matching your search.
                    </div>
                  ) : (
                    filteredResults.architecturalPatterns.map((pattern: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{pattern.name}</span>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              pattern.confidence > 0.8
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : pattern.confidence > 0.6
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                            )}
                          >
                            {Math.round(pattern.confidence * 100)}% confidence
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{pattern.description}</p>

                        <div>
                          <div className="text-xs font-medium mb-1">Related Files</div>
                          <div className="flex flex-wrap gap-1">
                            {pattern.files.map((file: any, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {file.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
