export type TreeNode = {
  name: string
  path: string
  type: "blob" | "tree"
  size?: number
  lastModified?: string
  children?: TreeNode[]
}

export type CodeDependency = {
  source: string
  target: string
  type: "import" | "export" | "reference" | "extends" | "implements"
  weight?: number
}

export type RepositoryAnalysis = {
  tree: TreeNode
  dependencies: CodeDependency[]
  fileTypes: Record<string, number>
  stats: {
    totalFiles: number
    totalFolders: number
    totalSize?: number
    mainLanguage?: string
    createdAt?: string
    lastUpdated?: string
    openIssues?: number
    stars?: number
    forks?: number
  }
  languages?: LanguageStats
}

export type Contributor = {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  contributions: number
}

export type LanguageStats = {
  [language: string]: number
}

export type CommitActivity = {
  total: number
  weeks: {
    a: number
    d: number
    c: number
    w: number
  }[]
  week: number
  days: number[]
  additions: number
  deletions: number
  commits: number
}

export type FileComplexity = {
  path: string
  complexity: number
  lines: number
  functions: number
  classes?: number
}
