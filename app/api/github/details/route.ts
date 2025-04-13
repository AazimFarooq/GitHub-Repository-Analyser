import { type NextRequest, NextResponse } from "next/server"
import { fetchRepositoryDetails } from "@/lib/services/github-service"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")

  if (!owner || !repo) {
    return NextResponse.json({ error: "Owner and repo parameters are required" }, { status: 400 })
  }

  try {
    const details = await fetchRepositoryDetails(owner, repo)
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error fetching GitHub details:", error)
    return NextResponse.json({ error: "Failed to fetch repository details" }, { status: 500 })
  }
}
