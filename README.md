# GitHub Repository Visualizer

## Overview

The GitHub Repository Visualizer is a web application designed to help developers, teams, and curious minds explore and understand GitHub repositories through interactive visualizations. By transforming complex codebases into intuitive visual representations, it makes it easier to grasp the structure and relationships within any repository.

## Features

-   **Interactive Tree View:** Explore the repository structure with an intuitive, expandable tree visualization. Search for specific files and navigate complex codebases with ease.
-   **Dependency Graph:** Visualize code relationships and dependencies with an interactive network graph. Understand how different parts of the codebase are connected.
-   **AI-Powered Code Relationship Analysis:** Discover hidden relationships, code smells, and architectural patterns in your codebase using our advanced AI analysis.
-   **Predictive Code Health Analysis:** Identify potential issues, measure code health metrics, and predict future trends.
-   **Collaborative Code Explorer:** Add annotations, ask questions, and make suggestions directly within the code visualization.
-   **Neuromorphic Code Mapping:** Experience your codebase as a neural network, with connections and activity patterns that reflect code dependencies.
-   **Synesthetic Code Experience:** Transform your code into a multi-sensory experience, with visual and auditory representations that bring your codebase to life.
-   **Advanced Search:** Find specific files and dependencies with powerful search capabilities. Filter by file type, name, or content to quickly locate what you need.
-   **Export Options:** Download visualizations as images or copy the folder structure as text for documentation and sharing.
-   **Filtering & Customization:** Filter dependencies by type, adjust visualization parameters, and customize the view to focus on what matters most to you.
-   **Performance Insights:** Get valuable statistics and insights about the repository structure, file types, and code organization to better understand the codebase.
-   **Dark & Light Themes:** Switch between dark and light themes for comfortable viewing in any environment. All visualizations adapt automatically to your preferred theme.
-   **GitHub Integration:** Seamlessly connect to any public GitHub repository. Just enter the URL and start exploring the codebase visually.

## Technologies Used

-   **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion
-   **Visualization:** D3.js, Three.js
-   **UI Components:** shadcn/ui, Radix UI primitives
-   **Other:** html-to-image, next-themes, lucide-react

## Setup Instructions

1.  Clone the repository:

    \`\`\`bash
    git clone https://github.com/your-username/github-repository-visualizer.git
    \`\`\`

2.  Navigate to the project directory:

    \`\`\`bash
    cd github-repository-visualizer
    \`\`\`

3.  Install dependencies:

    \`\`\`bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    \`\`\`

4.  Run the development server:

    \`\`\`bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    \`\`\`

5.  Open your browser and navigate to `http://localhost:3000`.

## Usage Examples

1.  Enter a GitHub repository URL in the search bar (e.g., `https://github.com/vercel/next.js`).
2.  Click "Visualize" to analyze the repository structure and dependencies.
3.  Switch between tabs to explore different visualizations and insights.
4.  Use the search bar and filters to find specific files and dependencies.
5.  Customize the visualization using the settings panel.
6.  Download the visualization as an image or copy the folder structure as text for documentation.

## Project Architecture

The project follows a modular architecture with clear separation of concerns. Here's a high-level overview of the key components:

-   **`app/page.tsx`:** The main entry point for the application. It contains the repository form, visualization tabs, and other UI elements.
-   **`components/`:** This directory contains all the React components used in the application, including:
    -   `github-tree-visualizer.tsx`: Renders the interactive tree view of the repository structure.
    -   `dependency-graph.tsx`: Renders the dependency graph visualization.
    -   `repo-stats.tsx`: Displays statistics about the repository, such as the number of files, folders, and main language.
    -   `repo-form.tsx`: The form used to enter the GitHub repository URL.
    -   `theme-toggle.tsx`: A component that allows users to switch between light and dark themes.
-   **`lib/`:** This directory contains utility functions and services used throughout the application, including:
    -   `github-service.ts`: Fetches repository data from the GitHub API.
    -   `code-analyzer.ts`: Analyzes the repository code to extract dependencies, file types, and other information.
    -   `utils.ts`: Contains utility functions for class name manipulation, tree traversal, and other common tasks.
-   **`types/`:** This directory contains TypeScript type definitions for the data structures used in the application.
-   **`styles/globals.css`:** Contains global CSS styles for the application, including Tailwind CSS directives and custom styles.

## Data Flow

1.  The user enters a GitHub repository URL in the `RepoForm` component and submits the form.
2.  The `handleRepoSubmit` function in `app/page.tsx` is called with the URL.
3.  The `handleRepoSubmit` function extracts the owner and repository name from the URL using the `extractRepoInfo` function.
4.  The `handleRepoSubmit` function calls the `fetchRepositoryData` function in `lib/github-service.ts` to fetch the repository data from the GitHub API.
5.  The `fetchRepositoryData` function returns a `RepositoryAnalysis` object containing the repository tree, dependencies, file types, and statistics.
6.  The `handleRepoSubmit` function sets the `repoData` state variable with the `RepositoryAnalysis` object.
7.  The `GitHubTreeVisualizer` component receives the `repoData.tree` object and renders the interactive tree view.
8.  The `DependencyGraph` component receives the `repoData.dependencies` object and renders the dependency graph visualization.
9.  The `RepoStats` component receives the `repoData.stats` and `repoData.fileTypes` objects and displays the repository statistics.

## Contribution Guidelines

We welcome contributions to the GitHub Repository Visualizer project! To contribute, please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise messages.
4.  Test your changes thoroughly.
5.  Submit a pull request with a detailed description of your changes.

Please ensure that your code follows the project's coding style and conventions. We use ESLint and Prettier to enforce code quality and consistency.

## License

This project is licensed under the [MIT License](LICENSE).
