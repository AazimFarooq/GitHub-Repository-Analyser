"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { Contributor } from "@/types/github"
import { Users } from "lucide-react"

type ContributorsViewProps = {
  contributors: Contributor[]
}

export function ContributorsView({ contributors }: ContributorsViewProps) {
  // Calculate total contributions
  const totalContributions = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0)

  // Sort contributors by contributions (descending)
  const sortedContributors = [...contributors].sort((a, b) => b.contributions - a.contributions)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{contributors.length}</div>
          <div className="text-xs text-muted-foreground">Total contributors: {contributors.length}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sortedContributors.map((contributor) => {
          const percentage = Math.round((contributor.contributions / totalContributions) * 100)

          return (
            <Card key={contributor.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                    <AvatarFallback>{contributor.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <div className="font-medium">{contributor.login}</div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {contributor.contributions} commit{contributor.contributions !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
