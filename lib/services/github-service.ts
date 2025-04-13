import type { RepositoryAnalysis, TreeNode } from "@/lib/types"
import { analyzeRepository, analyzeFileTypes, calculateRepoStats } from "@/lib/services/code-analyzer"

/**
 * Fetch repository data from GitHub API
 */
export async function fetchRepositoryData(owner: string, repo: string): Promise<RepositoryAnalysis> {
  try {
    // Fetch the repository tree from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!response.ok) {
      // Check if the error is due to rate limiting
      if (response.status === 403) {
        const resetTime = response.headers.get("X-RateLimit-Reset")
        if (resetTime) {
          const resetDate = new Date(Number.parseInt(resetTime) * 1000)
          const now = new Date()
          const timeLeft = resetDate.getTime() - now.getTime()
          const timeLeftMinutes = Math.ceil(timeLeft / (1000 * 60))
          throw new Error(`GitHub API rate limit exceeded. Please wait ${timeLeftMinutes} minutes before trying again.`)
        } else {
          throw new Error("GitHub API rate limit exceeded.")
        }
      }

      // Try with 'master' branch if 'main' fails
      const masterResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })

      if (!masterResponse.ok) {
        if (masterResponse.status === 403) {
          const resetTime = masterResponse.headers.get("X-RateLimit-Reset")
          if (resetTime) {
            const resetDate = new Date(Number.parseInt(resetTime) * 1000)
            const now = new Date()
            const timeLeft = resetDate.getTime() - now.getTime()
            const timeLeftMinutes = Math.ceil(timeLeft / (1000 * 60))
            throw new Error(
              `GitHub API rate limit exceeded. Please wait ${timeLeftMinutes} minutes before trying again.`,
            )
          } else {
            throw new Error("GitHub API rate limit exceeded.")
          }
        }
        throw new Error(`Failed to fetch repository data: ${masterResponse.statusText}`)
      }

      const data = await masterResponse.json()
      const tree = buildTree(data.tree, repo)

      // Analyze repository
      const fileTypes = analyzeFileTypes(tree)
      const stats = calculateRepoStats(tree, fileTypes)
      const dependencies = await analyzeRepository(tree)

      return {
        tree,
        dependencies,
        fileTypes,
        stats,
      }
    }

    const data = await response.json()
    const tree = buildTree(data.tree, repo)

    // Analyze repository
    const fileTypes = analyzeFileTypes(tree)
    const stats = calculateRepoStats(tree, fileTypes)
    const dependencies = await analyzeRepository(tree)

    return {
      tree,
      dependencies,
      fileTypes,
      stats,
    }
  } catch (error: any) {
    console.error("Error fetching GitHub data:", error)
    throw new Error(`Failed to fetch repository data: ${error.message}`)
  }
}

/**
 * Build a tree structure from GitHub API response
 */
function buildTree(items: any[], repoName: string): TreeNode {
  // Create root node
  const root: TreeNode = {
    name: repoName,
    path: "",
    type: "tree",
    children: [],
  }

  // First, ensure all directories exist in the tree
  const allPaths = new Set<string>()

  // Add all paths and their parent paths to the set
  for (const item of items) {
    const pathParts = item.path.split("/")

    // Add all parent paths
    for (let i = 1; i <= pathParts.length; i++) {
      const path = pathParts.slice(0, i).join("/")
      allPaths.add(path)
    }
  }

  // Map to store all nodes by path
  const nodeMap = new Map<string, TreeNode>()
  nodeMap.set("", root)

  // Create all directory nodes first
  for (const path of allPaths) {
    if (nodeMap.has(path)) continue

    const pathParts = path.split("/")
    const name = pathParts[pathParts.length - 1]
    const parentPath = pathParts.slice(0, -1).join("/")

    // Create node for current path
    const node: TreeNode = {
      name,
      path,
      type: "tree", // Assume it's a directory first
      children: [],
    }

    // Add node to map
    nodeMap.set(path, node)

    // Add node to parent
    const parent = nodeMap.get(parentPath)
    if (parent && parent.children) {
      parent.children.push(node)
    }
  }

  // Now add all file nodes and update directory types
  for (const item of items) {
    const node = nodeMap.get(item.path)

    if (node) {
      // Update the type if it's a file
      node.type = item.type

      // If it's a file, it shouldn't have children
      if (item.type === "blob") {
        delete node.children
      }
    } else {
      // This should not happen if we processed all paths correctly
      const pathParts = item.path.split("/")
      const name = pathParts.pop() || ""
      const parentPath = pathParts.join("/")

      // Create node for current item
      const newNode: TreeNode = {
        name,
        path: item.path,
        type: item.type,
      }

      if (item.type === "tree") {
        newNode.children = []
      }

      // Add node to map
      nodeMap.set(item.path, newNode)

      // Add node to parent
      const parent = nodeMap.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(newNode)
      }
    }
  }

  // Sort children of all nodes
  for (const node of nodeMap.values()) {
    if (node.children) {
      node.children.sort((a, b) => {
        // Directories first
        if (a.type === "tree" && b.type !== "tree") return -1
        if (a.type !== "tree" && b.type === "tree") return 1
        // Then alphabetically
        return a.name.localeCompare(b.name)
      })
    }
  }

  return root
}

/**
 * Fetch repository details from GitHub API
 */
export async function fetchRepositoryDetails(owner: string, repo: string) {
  try {
    // Fetch repository details
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!repoResponse.ok) {
      throw new Error("Failed to fetch repository details")
    }

    const repoData = await repoResponse.json()

    // Fetch contributors
    const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    let contributors = []
    if (contributorsResponse.ok) {
      contributors = await contributorsResponse.json()
    }

    // Fetch languages
    const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    let languages = {}
    if (languagesResponse.ok) {
      languages = await languagesResponse.json()
    }

    // Fetch commit activity
    const commitActivityResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    let commitActivity = []
    if (commitActivityResponse.ok) {
      commitActivity = await commitActivityResponse.json()
    }

    return {
      details: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        defaultBranch: repoData.default_branch,
        license: repoData.license?.name,
        homepage: repoData.homepage,
      },
      contributors,
      languages,
      commitActivity,
    }
  } catch (error) {
    console.error("Error fetching GitHub details:", error)
    throw new Error("Failed to fetch repository details")
  }
}
