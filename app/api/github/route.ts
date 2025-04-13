import { type NextRequest, NextResponse } from "next/server"
import { fetchRepositoryData } from "@/lib/services/github-service"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")

  if (!owner || !repo) {
    return NextResponse.json({ error: "Owner and repo parameters are required" }, { status: 400 })
  }

  try {
    const analysis = await fetchRepositoryData(owner, repo)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error fetching GitHub data:", error)
    return NextResponse.json({ error: "Failed to fetch repository data" }, { status: 500 })
  }
}
