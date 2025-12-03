import matter from 'gray-matter';

export interface ParsedAgent {
  name: string;
  role: string;
  description: string;
  tools: string[];
  content: string;
  metadata: Record<string, any>;
}

export function parseAgentMarkdown(markdownContent: string): ParsedAgent {
  const { data, content } = matter(markdownContent);

  const name = data.name || extractNameFromContent(content);
  const role = data.role || extractRoleFromName(name);
  const description = data.description || extractDescriptionFromContent(content);
  const tools = data.tools || [];

  return {
    name,
    role,
    description,
    tools,
    content,
    metadata: data
  };
}

function extractNameFromContent(content: string): string {
  const nameMatch = content.match(/^#\s+(.+)/m);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  return 'Unknown Agent';
}

function extractRoleFromName(name: string): string {
  const roleMatch = name.match(/\(([^)]+)\)/);
  if (roleMatch) {
    return roleMatch[1].trim();
  }
  return 'General Agent';
}

function extractDescriptionFromContent(content: string): string {
  const paragraphs = content.split('\n\n');
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
      return trimmed.substring(0, 500);
    }
  }
  return 'No description available';
}
