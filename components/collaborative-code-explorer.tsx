"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { TreeNode } from "@/types/github"
import {
  Users,
  MessageSquare,
  Tag,
  Plus,
  X,
  Edit,
  Save,
  ThumbsUp,
  ThumbsDown,
  Share,
  FileQuestion,
  FileCheck,
  AlertTriangle,
  Lightbulb,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CollaborativeCodeExplorerProps = {
  tree: TreeNode
}

type Annotation = {
  id: string
  filePath: string
  lineNumber?: number
  author: {
    name: string
    avatar: string
    initials: string
  }
  type: "question" | "explanation" | "issue" | "suggestion"
  content: string
  timestamp: Date
  reactions: {
    thumbsUp: number
    thumbsDown: number
  }
  resolved: boolean
  tags: string[]
  replies: Reply[]
}

type Reply = {
  id: string
  author: {
    name: string
    avatar: string
    initials: string
  }
  content: string
  timestamp: Date
  reactions: {
    thumbsUp: number
    thumbsDown: number
  }
}

type FileContent = {
  path: string
  content: string
  language: string
}

export function CollaborativeCodeExplorer({ tree }: CollaborativeCodeExplorerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState({
    type: "question" as "question" | "explanation" | "issue" | "suggestion",
    content: "",
    lineNumber: "",
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")
  const [newReply, setNewReply] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterResolved, setFilterResolved] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"files" | "annotations">("files")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [isEditingAnnotation, setIsEditingAnnotation] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [availableTags, setAvailableTags] = useState<string[]>([
    "needs-review",
    "important",
    "deprecated",
    "bug",
    "feature",
    "documentation",
    "optimization",
  ])
  const [teamMembers, setTeamMembers] = useState([
    { name: "Alice Johnson", avatar: "", initials: "AJ" },
    { name: "Bob Smith", avatar: "", initials: "BS" },
    { name: "Charlie Davis", avatar: "", initials: "CD" },
    { name: "Diana Miller", avatar: "", initials: "DM" },
  ])
  const [currentUser, setCurrentUser] = useState({
    name: "You",
    avatar: "",
    initials: "YO",
  })

  // Initialize with simulated data
  useEffect(() => {
    if (!tree) return

    setIsLoading(true)

    // Simulate loading delay
    setTimeout(() => {
      // Generate simulated file content
      const fileNodes: TreeNode[] = []
      const extractFiles = (node: TreeNode) => {
        if (node.type === "blob") {
          fileNodes.push(node)
        } else if (node.children) {
          node.children.forEach(extractFiles)
        }
      }
      extractFiles(tree)

      // Generate simulated annotations
      const simulatedAnnotations: Annotation[] = []

      // Generate 10-15 random annotations
      const annotationCount = Math.floor(Math.random() * 6) + 10

      for (let i = 0; i < annotationCount; i++) {
        const randomFile = fileNodes[Math.floor(Math.random() * fileNodes.length)]
        const randomAuthor = teamMembers[Math.floor(Math.random() * teamMembers.length)]
        const annotationType: "question" | "explanation" | "issue" | "suggestion" = [
          "question",
          "explanation",
          "issue",
          "suggestion",
        ][Math.floor(Math.random() * 4)] as any

        // Generate random date within the last month
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))

        // Generate random tags
        const tagCount = Math.floor(Math.random() * 3)
        const tags = []
        for (let j = 0; j < tagCount; j++) {
          tags.push(availableTags[Math.floor(Math.random() * availableTags.length)])
        }

        // Generate random replies
        const replyCount = Math.floor(Math.random() * 3)
        const replies: Reply[] = []

        for (let j = 0; j < replyCount; j++) {
          const replyAuthor = teamMembers[Math.floor(Math.random() * teamMembers.length)]
          const replyDate = new Date(date)
          replyDate.setHours(replyDate.getHours() + Math.floor(Math.random() * 48))

          replies.push({
            id: `reply_${i}_${j}`,
            author: replyAuthor,
            content: generateReplyContent(annotationType),
            timestamp: replyDate,
            reactions: {
              thumbsUp: Math.floor(Math.random() * 3),
              thumbsDown: Math.floor(Math.random() * 2),
            },
          })
        }

        simulatedAnnotations.push({
          id: `annotation_${i}`,
          filePath: randomFile.path,
          lineNumber: Math.floor(Math.random() * 100) + 1,
          author: randomAuthor,
          type: annotationType,
          content: generateAnnotationContent(annotationType),
          timestamp: date,
          reactions: {
            thumbsUp: Math.floor(Math.random() * 5),
            thumbsDown: Math.floor(Math.random() * 3),
          },
          resolved: Math.random() > 0.7,
          tags,
          replies,
        })
      }

      setAnnotations(simulatedAnnotations)

      // Auto-expand first level folders
      if (tree.children) {
        const firstLevelFolders = new Set<string>()
        tree.children.forEach((child) => {
          if (child.type === "tree") {
            firstLevelFolders.add(child.path)
          }
        })
        setExpandedFolders(firstLevelFolders)
      }

      setIsLoading(false)
    }, 1500)
  }, [tree])

  // Generate annotation content based on type
  const generateAnnotationContent = (type: string) => {
    switch (type) {
      case "question":
        return [
          "Why are we using this approach instead of the more standard pattern?",
          "Can someone explain how this function works with the rest of the system?",
          "Is this the right place to handle this logic or should it be moved elsewhere?",
          "What's the purpose of this parameter? It doesn't seem to be used anywhere.",
        ][Math.floor(Math.random() * 4)]

      case "explanation":
        return [
          "This code handles edge cases where the input might be null or undefined.",
          "We're using this pattern to ensure backward compatibility with older API versions.",
          "This is an optimization that reduces unnecessary re-renders in the component.",
          "This implementation follows the strategy pattern to make it easier to add new behaviors later.",
        ][Math.floor(Math.random() * 4)]

      case "issue":
        return [
          "This might cause a memory leak because we're not cleaning up the subscription.",
          "There's a potential race condition here if multiple requests happen simultaneously.",
          "This doesn't handle the case where the API returns an error response.",
          "Performance issue: we're recalculating this value on every render.",
        ][Math.floor(Math.random() * 4)]

      case "suggestion":
        return [
          "We could simplify this by using the new utility function from our shared library.",
          "Consider using a memoized selector here to improve performance.",
          "We should add error boundaries around this component to prevent the whole app from crashing.",
          "Let's extract this into a custom hook to make it reusable across components.",
        ][Math.floor(Math.random() * 4)]

      default:
        return "Comment on this code"
    }
  }

  // Generate reply content based on annotation type
  const generateReplyContent = (annotationType: string) => {
    switch (annotationType) {
      case "question":
        return [
          "Good question! This approach was chosen because it offers better performance in our specific use case.",
          "It's related to how we handle asynchronous operations throughout the application.",
          "I've been wondering about this too. Anyone from the backend team who can clarify?",
        ][Math.floor(Math.random() * 3)]

      case "explanation":
        return [
          "Thanks for explaining this! It makes much more sense now.",
          "I'd add that this also helps with type safety across the codebase.",
          "This explanation should be added to our documentation.",
        ][Math.floor(Math.random() * 3)]

      case "issue":
        return [
          "Good catch! I'll create a ticket to fix this.",
          "I think we can solve this by refactoring the state management approach.",
          "This has been an issue in other parts of the codebase too. We should address it systematically.",
        ][Math.floor(Math.random() * 3)]

      case "suggestion":
        return [
          "Great idea! This would definitely improve readability.",
          "I like this approach. Let's discuss it in the next team meeting.",
          "I've implemented something similar in another project and it worked well.",
        ][Math.floor(Math.random() * 3)]

      default:
        return "Thanks for pointing this out!"
    }
  }

  // Generate simulated file content
  const generateFileContent = (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase() || ""
    let language = "text"
    let content = ""

    // Determine language based on extension
    if (["js", "jsx"].includes(extension)) {
      language = "javascript"
      content = `// ${filePath}
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { fetchData } from '../actions/dataActions';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * Component that displays data fetched from an API
 */
function DataDisplay({ data, loading, error, fetchData }) {
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="data-display">
      <input
        type="text"
        value={filter}
        onChange={handleFilterChange}
        placeholder="Filter items..."
        className="filter-input"
      />
      
      {filteredData.length === 0 ? (
        <p>No items found matching your filter.</p>
      ) : (
        <ul className="data-list">
          {filteredData.map(item => (
            <li key={item.id} className="data-item">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const mapStateToProps = state => ({
  data: state.data.items,
  loading: state.data.loading,
  error: state.data.error
});

export default connect(mapStateToProps, { fetchData })(DataDisplay);`
    } else if (["ts", "tsx"].includes(extension)) {
      language = "typescript"
      content = `// ${filePath}
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../actions/dataActions';
import { RootState } from '../store';
import { DataItem } from '../types';

interface DataDisplayProps {
  title: string;
  maxItems?: number;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({ title, maxItems = 10 }) => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state: RootState) => state.data);
  const [filter, setFilter] = useState<string>('');
  
  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };
  
  const filteredData = data
    .filter((item: DataItem) => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    )
    .slice(0, maxItems);
  
  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div className="data-display">
      <h2>{title}</h2>
      <input
        type="text"
        value={filter}
        onChange={handleFilterChange}
        placeholder="Filter items..."
        className="filter-input"
      />
      
      {filteredData.length === 0 ? (
        <p>No items found matching your filter.</p>
      ) : (
        <ul className="data-list">
          {filteredData.map((item: DataItem) => (
            <li key={item.id} className="data-item">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};`
    } else if (["css", "scss"].includes(extension)) {
      language = "css"
      content = `/* ${filePath} */
.data-display {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.filter-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 16px;
}

.data-list {
  list-style: none;
  padding: 0;
}

.data-item {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.data-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.data-item h3 {
  margin-top: 0;
  color: #333;
}

.data-item p {
  color: #666;
  line-height: 1.5;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
}

.error {
  color: #d32f2f;
  padding: 20px;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  background-color: #ffebee;
}`
    } else if (extension === "json") {
      language = "json"
      content = `{
  "name": "project-name",
  "version": "1.0.0",
  "description": "A sample project configuration",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-redux": "^7.2.4",
    "redux": "^4.1.0",
    "redux-thunk": "^2.3.0",
    "axios": "^0.21.1",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^4.3.5",
    "jest": "^27.0.6",
    "eslint": "^7.32.0",
    "prettier": "^2.3.2"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`
    } else if (extension === "md") {
      language = "markdown"
      content = `# Project Documentation

## Overview

This project is a web application that allows users to view and interact with data from our API.

## Features

- Data visualization
- Filtering and sorting
- User authentication
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   \`\`\`
   git clone https://github.com/example/project.git
   \`\`\`

2. Install dependencies
   \`\`\`
   npm install
   \`\`\`

3. Start the development server
   \`\`\`
   npm start
   \`\`\`

## Project Structure

- \`/src\` - Source code
  - \`/components\` - React components
  - \`/actions\` - Redux actions
  - \`/reducers\` - Redux reducers
  - \`/types\` - TypeScript type definitions
  - \`/utils\` - Utility functions
- \`/public\` - Static assets
- \`/docs\` - Additional documentation

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.`
    } else {
      content = `// ${filePath}\n\n// This is a simulated file for demonstration purposes.`
    }

    return {
      path: filePath,
      content,
      language,
    }
  }

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  // Handle file selection
  const handleFileSelect = (file: TreeNode) => {
    setSelectedFile(generateFileContent(file.path))
    setActiveTab("files")
  }

  // Handle annotation selection
  const handleAnnotationSelect = (annotation: Annotation) => {
    setSelectedAnnotation(annotation)

    // If the annotation is for a file, load that file
    if (annotation.filePath) {
      setSelectedFile(generateFileContent(annotation.filePath))
    }

    setActiveTab("annotations")
  }

  // Add new annotation
  const handleAddAnnotation = () => {
    if (!selectedFile || !newAnnotation.content.trim()) return

    const annotation: Annotation = {
      id: `annotation_${Date.now()}`,
      filePath: selectedFile.path,
      lineNumber: newAnnotation.lineNumber ? Number.parseInt(newAnnotation.lineNumber) : undefined,
      author: currentUser,
      type: newAnnotation.type,
      content: newAnnotation.content,
      timestamp: new Date(),
      reactions: {
        thumbsUp: 0,
        thumbsDown: 0,
      },
      resolved: false,
      tags: newAnnotation.tags,
      replies: [],
    }

    setAnnotations([...annotations, annotation])
    setIsAddingAnnotation(false)
    setNewAnnotation({
      type: "question",
      content: "",
      lineNumber: "",
      tags: [],
    })
  }

  // Add tag to new annotation
  const handleAddTag = () => {
    if (!newTag.trim() || newAnnotation.tags.includes(newTag.trim())) return

    setNewAnnotation({
      ...newAnnotation,
      tags: [...newAnnotation.tags, newTag.trim()],
    })

    // Add to available tags if it's new
    if (!availableTags.includes(newTag.trim())) {
      setAvailableTags([...availableTags, newTag.trim()])
    }

    setNewTag("")
  }

  // Remove tag from new annotation
  const handleRemoveTag = (tag: string) => {
    setNewAnnotation({
      ...newAnnotation,
      tags: newAnnotation.tags.filter((t) => t !== tag),
    })
  }

  // Add reply to annotation
  const handleAddReply = () => {
    if (!selectedAnnotation || !newReply.trim()) return

    const reply: Reply = {
      id: `reply_${Date.now()}`,
      author: currentUser,
      content: newReply,
      timestamp: new Date(),
      reactions: {
        thumbsUp: 0,
        thumbsDown: 0,
      },
    }

    const updatedAnnotation = {
      ...selectedAnnotation,
      replies: [...selectedAnnotation.replies, reply],
    }

    setAnnotations(annotations.map((a) => (a.id === selectedAnnotation.id ? updatedAnnotation : a)))

    setSelectedAnnotation(updatedAnnotation)
    setNewReply("")
  }

  // Toggle annotation resolved status
  const handleToggleResolved = () => {
    if (!selectedAnnotation) return

    const updatedAnnotation = {
      ...selectedAnnotation,
      resolved: !selectedAnnotation.resolved,
    }

    setAnnotations(annotations.map((a) => (a.id === selectedAnnotation.id ? updatedAnnotation : a)))

    setSelectedAnnotation(updatedAnnotation)
  }

  // Add reaction to annotation
  const handleReaction = (annotationId: string, type: "thumbsUp" | "thumbsDown") => {
    setAnnotations(
      annotations.map((a) => {
        if (a.id === annotationId) {
          return {
            ...a,
            reactions: {
              ...a.reactions,
              [type]: a.reactions[type] + 1,
            },
          }
        }
        return a
      }),
    )

    if (selectedAnnotation?.id === annotationId) {
      setSelectedAnnotation({
        ...selectedAnnotation,
        reactions: {
          ...selectedAnnotation.reactions,
          [type]: selectedAnnotation.reactions[type] + 1,
        },
      })
    }
  }

  // Add reaction to reply
  const handleReplyReaction = (annotationId: string, replyId: string, type: "thumbsUp" | "thumbsDown") => {
    setAnnotations(
      annotations.map((a) => {
        if (a.id === annotationId) {
          return {
            ...a,
            replies: a.replies.map((r) => {
              if (r.id === replyId) {
                return {
                  ...r,
                  reactions: {
                    ...r.reactions,
                    [type]: r.reactions[type] + 1,
                  },
                }
              }
              return r
            }),
          }
        }
        return a
      }),
    )

    if (selectedAnnotation?.id === annotationId) {
      setSelectedAnnotation({
        ...selectedAnnotation,
        replies: selectedAnnotation.replies.map((r) => {
          if (r.id === replyId) {
            return {
              ...r,
              reactions: {
                ...r.reactions,
                [type]: r.reactions[type] + 1,
              },
            }
          }
          return r
        }),
      })
    }
  }

  // Edit annotation
  const handleEditAnnotation = () => {
    if (!selectedAnnotation || !editedContent.trim()) return

    const updatedAnnotation = {
      ...selectedAnnotation,
      content: editedContent,
    }

    setAnnotations(annotations.map((a) => (a.id === selectedAnnotation.id ? updatedAnnotation : a)))

    setSelectedAnnotation(updatedAnnotation)
    setIsEditingAnnotation(false)
  }

  // Filter annotations
  const filteredAnnotations = annotations.filter((a) => {
    // Filter by search term
    if (
      searchTerm &&
      !a.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !a.filePath.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    // Filter by type
    if (filterType && a.type !== filterType) {
      return false
    }

    // Filter by resolved status
    if (filterResolved !== null && a.resolved !== filterResolved) {
      return false
    }

    return true
  })

  // Render file tree
  const renderTree = (node: TreeNode, level = 0) => {
    const isFolder = node.type === "tree"
    const isExpanded = expandedFolders.has(node.path)
    const isHovered = hoveredNode === node.path

    // Count annotations for this file or folder
    const getAnnotationCount = (path: string) => {
      if (isFolder) {
        return annotations.filter((a) => a.filePath.startsWith(path)).length
      } else {
        return annotations.filter((a) => a.filePath === path).length
      }
    }

    const annotationCount = getAnnotationCount(node.path)

    return (
      <div key={node.path} className="select-none">
        <div
          className={cn(
            "flex items-center rounded-md px-1 py-1 cursor-pointer hover:bg-muted/50",
            isHovered && "bg-muted",
          )}
          onClick={() => (isFolder ? toggleFolder(node.path) : handleFileSelect(node))}
          onMouseEnter={() => setHoveredNode(node.path)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ paddingLeft: `${level * 16}px` }}
        >
          {isFolder ? (
            <>
              <div className="mr-1 w-4 h-4 flex items-center justify-center">
                <svg
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 18l6-6-6-6"
                  />
                </svg>
              </div>
              <svg
                className="h-4 w-4 mr-2 text-amber-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
                />
              </svg>
            </>
          ) : (
            <>
              <span className="w-4 mr-1" />
              <svg
                className="h-4 w-4 mr-2 text-slate-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
                />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </>
          )}
          <span className="truncate">{node.name}</span>

          {annotationCount > 0 && (
            <Badge variant="outline" className="ml-2 text-xs">
              {annotationCount}
            </Badge>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div>{node.children.map((child) => renderTree(child, level + 1))}</div>
        )}
      </div>
    )
  }

  // Get annotation type icon
  const getAnnotationTypeIcon = (type: string) => {
    switch (type) {
      case "question":
        return <FileQuestion className="h-4 w-4 text-blue-500" />
      case "explanation":
        return <FileCheck className="h-4 w-4 text-green-500" />
      case "issue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            Collaborative Code Explorer
          </CardTitle>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="files" className="text-xs px-2 py-1">
                Files
              </TabsTrigger>
              <TabsTrigger value="annotations" className="text-xs px-2 py-1">
                Annotations ({annotations.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-primary border-primary/20 animate-spin"></div>
              </div>
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-10 animate-pulse"></div>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium mb-1">Loading Code Explorer</h3>
              <p className="text-sm text-muted-foreground max-w-md">Fetching repository structure and annotations...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File tree */}
            <div className="md:col-span-1 border rounded-lg p-4 h-[600px] overflow-auto">
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setExpandedFolders(new Set())}>
                    Collapse All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allFolders = new Set<string>()
                      const collectFolders = (node: TreeNode) => {
                        if (node.type === "tree") {
                          allFolders.add(node.path)
                          node.children?.forEach(collectFolders)
                        }
                      }
                      tree.children?.forEach(collectFolders)
                      setExpandedFolders(allFolders)
                    }}
                  >
                    Expand All
                  </Button>
                </div>
              </div>

              <div className="font-mono text-sm">
                <div className="mb-2 font-semibold flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
                    />
                  </svg>
                  <span>{tree.name}</span>
                </div>
                <div className="space-y-0.5">{tree.children?.map((child) => renderTree(child))}</div>
              </div>
            </div>

            {/* Main content area */}
            <div className="md:col-span-2 border rounded-lg p-4 h-[600px] overflow-hidden flex flex-col">
              <TabsContent value="files" className="flex-1 overflow-hidden flex flex-col">
                {selectedFile ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-medium">{selectedFile.path}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Annotation
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {isAddingAnnotation && (
                      <div className="mb-4 p-3 border rounded-lg bg-muted/30">
                        <div className="flex gap-2 mb-2">
                          <select
                            className="text-sm p-1 border rounded"
                            value={newAnnotation.type}
                            onChange={(e) =>
                              setNewAnnotation({
                                ...newAnnotation,
                                type: e.target.value as any,
                              })
                            }
                          >
                            <option value="question">Question</option>
                            <option value="explanation">Explanation</option>
                            <option value="issue">Issue</option>
                            <option value="suggestion">Suggestion</option>
                          </select>
                          <Input
                            type="text"
                            placeholder="Line number (optional)"
                            value={newAnnotation.lineNumber}
                            onChange={(e) =>
                              setNewAnnotation({
                                ...newAnnotation,
                                lineNumber: e.target.value,
                              })
                            }
                            className="w-32 text-sm"
                          />
                        </div>

                        <Textarea
                          placeholder="Add your annotation..."
                          value={newAnnotation.content}
                          onChange={(e) =>
                            setNewAnnotation({
                              ...newAnnotation,
                              content: e.target.value,
                            })
                          }
                          className="mb-2"
                        />

                        <div className="flex flex-wrap gap-1 mb-2">
                          {newAnnotation.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2 mb-2">
                          <Input
                            type="text"
                            placeholder="Add tag"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="text-sm"
                          />
                          <Button size="sm" variant="outline" onClick={handleAddTag}>
                            <Tag className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsAddingAnnotation(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddAnnotation} disabled={!newAnnotation.content.trim()}>
                            Save Annotation
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-auto font-mono text-sm border rounded-lg p-4 bg-muted/30">
                      <pre className="whitespace-pre-wrap">
                        <code>{selectedFile.content}</code>
                      </pre>
                    </div>

                    {/* File annotations */}
                    {annotations.filter((a) => a.filePath === selectedFile.path).length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Annotations for this file</h3>
                        <div className="space-y-2">
                          {annotations
                            .filter((a) => a.filePath === selectedFile.path)
                            .map((annotation) => (
                              <div
                                key={annotation.id}
                                className="p-2 border rounded-lg cursor-pointer hover:bg-muted/30"
                                onClick={() => handleAnnotationSelect(annotation)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">{getAnnotationTypeIcon(annotation.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate">
                                        {annotation.content.length > 60
                                          ? annotation.content.substring(0, 60) + "..."
                                          : annotation.content}
                                      </span>
                                      {annotation.lineNumber && (
                                        <Badge variant="outline" className="text-xs">
                                          Line {annotation.lineNumber}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <span>{annotation.author.name}</span>
                                      <span className="mx-1">•</span>
                                      <span>{formatDate(annotation.timestamp)}</span>
                                      {annotation.resolved && (
                                        <>
                                          <span className="mx-1">•</span>
                                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                                            Resolved
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to view its content</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="annotations" className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-medium">All Annotations ({filteredAnnotations.length})</div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search annotations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                    <select
                      className="h-8 text-sm border rounded px-2"
                      value={filterType || ""}
                      onChange={(e) => setFilterType(e.target.value || null)}
                    >
                      <option value="">All types</option>
                      <option value="question">Questions</option>
                      <option value="explanation">Explanations</option>
                      <option value="issue">Issues</option>
                      <option value="suggestion">Suggestions</option>
                    </select>
                    <select
                      className="h-8 text-sm border rounded px-2"
                      value={filterResolved === null ? "" : filterResolved ? "resolved" : "unresolved"}
                      onChange={(e) => {
                        if (e.target.value === "") setFilterResolved(null)
                        else setFilterResolved(e.target.value === "resolved")
                      }}
                    >
                      <option value="">All status</option>
                      <option value="resolved">Resolved</option>
                      <option value="unresolved">Unresolved</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 overflow-auto">
                  {/* Annotations list */}
                  <div className="border rounded-lg p-3 h-[480px] overflow-auto">
                    {filteredAnnotations.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No annotations found</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredAnnotations.map((annotation) => (
                          <div
                            key={annotation.id}
                            className={cn(
                              "p-3 border rounded-lg cursor-pointer hover:bg-muted/30",
                              selectedAnnotation?.id === annotation.id && "bg-muted/30 border-primary",
                            )}
                            onClick={() => handleAnnotationSelect(annotation)}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{getAnnotationTypeIcon(annotation.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{annotation.content}</div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span className="truncate">{annotation.filePath.split("/").pop()}</span>
                                  {annotation.lineNumber && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span>Line {annotation.lineNumber}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Avatar className="h-4 w-4 mr-1">
                                    <AvatarImage src={annotation.author.avatar} />
                                    <AvatarFallback>{annotation.author.initials}</AvatarFallback>
                                  </Avatar>
                                  <span>{annotation.author.name}</span>
                                  <span className="mx-1">•</span>
                                  <span>{formatDate(annotation.timestamp)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {annotation.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {annotation.resolved && (
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                                      Resolved
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected annotation details */}
                  <div className="border rounded-lg p-3 h-[480px] overflow-auto">
                    {selectedAnnotation ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div>{getAnnotationTypeIcon(selectedAnnotation.type)}</div>
                            <div>
                              <div className="font-medium">
                                {selectedAnnotation.type.charAt(0).toUpperCase() + selectedAnnotation.type.slice(1)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedAnnotation.filePath}
                                {selectedAnnotation.lineNumber && ` (Line ${selectedAnnotation.lineNumber})`}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant={selectedAnnotation.resolved ? "outline" : "default"}
                            size="sm"
                            onClick={handleToggleResolved}
                          >
                            {selectedAnnotation.resolved ? "Mark Unresolved" : "Mark Resolved"}
                          </Button>
                        </div>

                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedAnnotation.author.avatar} />
                            <AvatarFallback>{selectedAnnotation.author.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{selectedAnnotation.author.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(selectedAnnotation.timestamp)}
                              </div>
                            </div>

                            {isEditingAnnotation ? (
                              <div className="mt-2">
                                <Textarea
                                  value={editedContent}
                                  onChange={(e) => setEditedContent(e.target.value)}
                                  className="mb-2"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setIsEditingAnnotation(false)}>
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={handleEditAnnotation}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <p className="text-sm">{selectedAnnotation.content}</p>
                                {selectedAnnotation.author.name === currentUser.name && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-6 text-xs"
                                    onClick={() => {
                                      setEditedContent(selectedAnnotation.content)
                                      setIsEditingAnnotation(true)
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleReaction(selectedAnnotation.id, "thumbsUp")}
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {selectedAnnotation.reactions.thumbsUp}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleReaction(selectedAnnotation.id, "thumbsDown")}
                              >
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                {selectedAnnotation.reactions.thumbsDown}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {selectedAnnotation.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2">Replies</h4>
                          <div className="space-y-3">
                            {selectedAnnotation.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={reply.author.avatar} />
                                  <AvatarFallback>{reply.author.initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-xs">{reply.author.name}</div>
                                    <div className="text-xs text-muted-foreground">{formatDate(reply.timestamp)}</div>
                                  </div>
                                  <p className="text-sm mt-1">{reply.content}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 text-xs"
                                      onClick={() => handleReplyReaction(selectedAnnotation.id, reply.id, "thumbsUp")}
                                    >
                                      <ThumbsUp className="h-3 w-3 mr-1" />
                                      {reply.reactions.thumbsUp}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 text-xs"
                                      onClick={() => handleReplyReaction(selectedAnnotation.id, reply.id, "thumbsDown")}
                                    >
                                      <ThumbsDown className="h-3 w-3 mr-1" />
                                      {reply.reactions.thumbsDown}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="flex items-start gap-3 mt-4">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={currentUser.avatar} />
                                <AvatarFallback>{currentUser.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <Textarea
                                  placeholder="Add a reply..."
                                  value={newReply}
                                  onChange={(e) => setNewReply(e.target.value)}
                                  className="min-h-[80px] text-sm"
                                />
                                <div className="flex justify-end mt-2">
                                  <Button size="sm" onClick={handleAddReply} disabled={!newReply.trim()}>
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select an annotation to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
