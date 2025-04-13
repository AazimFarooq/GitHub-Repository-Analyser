"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Github, FolderTreeIcon as FileTree, Network, Download, Search, Filter, Zap, Moon } from "lucide-react"

type InfoModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">GitHub Repository Visualizer</DialogTitle>
          <DialogDescription>
            Explore GitHub repositories with an immersive, interactive visualization experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="features" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="usage">How to Use</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <FileTree className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Interactive Tree View</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Explore the repository structure with an intuitive, expandable tree visualization. Search for
                      specific files and navigate complex codebases with ease.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Dependency Graph</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Visualize code relationships and dependencies with an interactive network graph. Understand how
                      different parts of the codebase are connected.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Advanced Search</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Find specific files and dependencies with powerful search capabilities. Filter by file type, name,
                      or content to quickly locate what you need.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Export Options</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download visualizations as images or copy the folder structure as text for documentation and
                      sharing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Filtering & Customization</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Filter dependencies by type, adjust visualization parameters, and customize the view to focus on
                      what matters most to you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Performance Insights</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get valuable statistics and insights about the repository structure, file types, and code
                      organization to better understand the codebase.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Dark & Light Themes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Switch between dark and light themes for comfortable viewing in any environment. All
                      visualizations adapt automatically to your preferred theme.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">GitHub Integration</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seamlessly connect to any public GitHub repository. Just enter the URL and start exploring the
                      codebase visually.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div>
              <h3 className="text-lg font-medium mb-2">Getting Started</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <span>Enter a GitHub repository URL in the search bar (e.g., https://github.com/vercel/next.js)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <span>Click "Visualize" to analyze the repository structure and dependencies</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <span>Switch between "Structure" and "Dependencies" tabs to explore different visualizations</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Tree View Navigation</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Click on folders to expand or collapse them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the search box to find specific files or folders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use "Expand All" or "Collapse All" buttons to quickly navigate large repositories</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Dependency Graph</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Drag nodes to rearrange the graph for better visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Hover over nodes to highlight connected files and dependencies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the zoom controls to focus on specific areas of the graph</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Filter dependencies by type using the filter dropdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Adjust link distance and node repulsion to optimize the visualization</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Exporting & Sharing</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Click "Download as Image" to save the current visualization as a PNG file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use "Copy as Text" to copy the folder structure in a text format for documentation</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div>
              <h3 className="text-lg font-medium mb-2">About This Project</h3>
              <p className="text-sm text-muted-foreground">
                GitHub Repository Visualizer is a powerful tool designed to help developers, teams, and curious minds
                explore and understand GitHub repositories through interactive visualizations. By transforming complex
                codebases into intuitive visual representations, it makes it easier to grasp the structure and
                relationships within any repository.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Technology Stack</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Frontend:</strong> Next.js, React, TypeScript, Tailwind CSS
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Visualization:</strong> D3.js for dependency graphs, Framer Motion for animations
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>API Integration:</strong> GitHub API for repository data
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>UI Components:</strong> shadcn/ui, Radix UI primitives
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Privacy & Data Usage</h3>
              <p className="text-sm text-muted-foreground">
                This tool only accesses public GitHub repositories. No data is stored permanently, and all processing
                happens in your browser. Your visualizations remain private to your session.
              </p>
            </div>

            <div className="pt-4">
              <Button className="w-full" variant="outline">
                <Github className="mr-2 h-4 w-4" />
                View Project on GitHub
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
