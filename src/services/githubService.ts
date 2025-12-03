import axios from 'axios';
import { parseAgentMarkdown, ParsedAgent } from './agentParser';

export class GitHubService {
  private baseUrl = 'https://api.github.com';
  private rawUrl = 'https://raw.githubusercontent.com';
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  async fetchAgentFromGitHub(repoUrl: string, filePath?: string): Promise<ParsedAgent> {
    const { owner, repo, path } = this.parseGitHubUrl(repoUrl, filePath);
    const rawContent = await this.fetchRawContent(owner, repo, path);
    return parseAgentMarkdown(rawContent);
  }

  async fetchAgentsFromRepo(repoUrl: string, directory: string = 'agents'): Promise<ParsedAgent[]> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const files = await this.listDirectoryFiles(owner, repo, directory);

    const agents: ParsedAgent[] = [];
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        try {
          const content = await this.fetchRawContent(owner, repo, file.path);
          const agent = parseAgentMarkdown(content);
          agents.push(agent);
        } catch (error) {
          console.error(`Failed to parse agent ${file.name}:`, error);
        }
      }
    }

    return agents;
  }

  private parseGitHubUrl(url: string, filePath?: string): { owner: string; repo: string; path: string } {
    const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/[^/]+\/(.+))?/;
    const match = url.match(regex);

    if (!match) {
      throw new Error('Invalid GitHub URL');
    }

    const owner = match[1];
    const repo = match[2].replace('.git', '');
    const path = filePath || match[3] || '';

    return { owner, repo, path };
  }

  private async fetchRawContent(owner: string, repo: string, path: string): Promise<string> {
    const url = `${this.rawUrl}/${owner}/${repo}/main/${path}`;
    const response = await axios.get(url);
    return response.data;
  }

  private async listDirectoryFiles(owner: string, repo: string, path: string): Promise<any[]> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`;
    const response = await axios.get(url, { headers });
    return response.data;
  }
}
