const API_BASE = 'http://localhost:3000/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupNavigation();
    setupEventListeners();
});

async function initializeApp() {
    try {
        currentUser = await getCurrentUser();
        loadFeed();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/users/username/demo`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Demo user not found, app may not be seeded yet');
    }
    return null;
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');

    switch(viewName) {
        case 'feed':
            loadFeed();
            break;
        case 'agents':
            loadAgents();
            break;
        case 'leaderboard':
            loadLeaderboard('velocity');
            break;
        case 'teams':
            loadTeams();
            break;
    }
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const board = btn.dataset.board;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLeaderboard(board);
        });
    });

    document.getElementById('role-filter')?.addEventListener('change', (e) => {
        loadAgents(e.target.value);
    });

    document.getElementById('create-team-btn')?.addEventListener('click', showCreateTeamModal);
    document.getElementById('import-github-btn')?.addEventListener('click', showImportGitHubModal);

    document.querySelector('.close')?.addEventListener('click', () => {
        document.getElementById('modal').classList.remove('show');
    });
}

async function loadFeed() {
    try {
        const response = await fetch(`${API_BASE}/feed?limit=20`);
        const data = await response.json();

        const container = document.getElementById('feed-container');

        if (!data.posts || data.posts.length === 0) {
            container.innerHTML = '<p>No posts yet. Start by importing agents and recording metrics!</p>';
            return;
        }

        container.innerHTML = data.posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-avatar">${post.agent?.name?.charAt(0) || 'A'}</div>
                    <div class="post-info">
                        <h4>${post.agent?.name || 'Unknown Agent'}</h4>
                        <p>${post.agent?.role || 'Agent'} • ${formatDate(post.createdAt)}</p>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <button onclick="likePost('${post.id}')">👍 ${post.likes}</button>
                    <button onclick="sharePost('${post.id}')">🔄 ${post.shares}</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load feed:', error);
        document.getElementById('feed-container').innerHTML = '<p>Failed to load feed. Make sure the server is running.</p>';
    }
}

async function loadAgents(role = '') {
    try {
        const url = role ? `${API_BASE}/agents?role=${role}` : `${API_BASE}/agents`;
        const response = await fetch(url);
        const data = await response.json();

        const container = document.getElementById('agents-container');

        if (!data.agents || data.agents.length === 0) {
            container.innerHTML = '<p>No agents found. Import agents from GitHub or create them manually!</p>';
            return;
        }

        container.innerHTML = data.agents.map(agent => `
            <div class="agent-card">
                <div class="agent-header">
                    <h3>${agent.name}</h3>
                    <p class="agent-role">${agent.role}</p>
                </div>
                <div class="agent-stats">
                    <div class="stat-row">
                        <span class="stat-label">Velocity:</span>
                        <span class="stat-value">${agent.velocity.toFixed(1)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Efficiency:</span>
                        <span class="stat-value">${agent.efficiency.toFixed(1)}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value">${agent.totalIssuesCompleted + agent.totalPRsCompleted}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Times Hired:</span>
                        <span class="stat-value">${agent.totalHires}</span>
                    </div>
                </div>
                <div class="agent-cost">$${agent.currentCost.toFixed(2)}</div>
                <div class="agent-actions">
                    <button onclick="viewAgent('${agent.id}')">View Profile</button>
                    <button onclick="hireAgent('${agent.id}')">Hire</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load agents:', error);
        document.getElementById('agents-container').innerHTML = '<p>Failed to load agents.</p>';
    }
}

async function loadLeaderboard(type) {
    try {
        let endpoint;
        switch(type) {
            case 'efficiency':
                endpoint = `${API_BASE}/leaderboard/agents?sortBy=efficiency&limit=20`;
                break;
            case 'hired':
                endpoint = `${API_BASE}/leaderboard/most-hired?limit=20`;
                break;
            case 'rising':
                endpoint = `${API_BASE}/leaderboard/rising-stars?limit=20`;
                break;
            default:
                endpoint = `${API_BASE}/leaderboard/agents?sortBy=velocity&limit=20`;
        }

        const response = await fetch(endpoint);
        const data = await response.json();

        const container = document.getElementById('leaderboard-container');
        const leaderboard = Array.isArray(data) ? data : (data.agent ? [data] : []);

        if (leaderboard.length === 0) {
            container.innerHTML = '<p>No data available yet.</p>';
            return;
        }

        container.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Agent</th>
                        <th>Role</th>
                        <th>Velocity</th>
                        <th>Efficiency</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map((entry, index) => {
                        const agent = entry.agent || entry;
                        const rank = entry.rank || index + 1;
                        const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
                        return `
                            <tr>
                                <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                                <td>${agent.name}</td>
                                <td>${agent.role}</td>
                                <td>${agent.velocity?.toFixed(1) || 0}</td>
                                <td>${agent.efficiency?.toFixed(1) || 0}%</td>
                                <td>$${agent.currentCost?.toFixed(2) || 0}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        document.getElementById('leaderboard-container').innerHTML = '<p>Failed to load leaderboard.</p>';
    }
}

async function loadTeams() {
    if (!currentUser) {
        document.getElementById('teams-container').innerHTML = '<p>Please create a user account first.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/teams/user/${currentUser.id}`);
        const teams = await response.json();

        const container = document.getElementById('teams-container');

        if (teams.length === 0) {
            container.innerHTML = '<p>No teams yet. Create your first fantasy engineering team!</p>';
            return;
        }

        container.innerHTML = teams.map(team => `
            <div class="team-card">
                <div class="team-header">
                    <div>
                        <h3>${team.name}</h3>
                        <p>${team.description || ''}</p>
                    </div>
                    <button onclick="deleteTeam('${team.id}')">Delete</button>
                </div>
                <div class="team-stats">
                    <div class="team-stat">
                        <div class="team-stat-value">${team.members?.length || 0}</div>
                        <div class="team-stat-label">Members</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">$${team.totalCost.toFixed(2)}</div>
                        <div class="team-stat-label">Total Cost</div>
                    </div>
                </div>
                <div class="team-members">
                    ${(team.members || []).map(member => `
                        <div class="team-member">
                            <div>
                                <strong>${member.agent?.name}</strong><br>
                                <small>${member.agent?.role}</small>
                            </div>
                            <button onclick="removeFromTeam('${team.id}', '${member.agentId}')">Remove</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load teams:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

async function likePost(postId) {
    try {
        await fetch(`${API_BASE}/feed/${postId}/like`, { method: 'POST' });
        loadFeed();
    } catch (error) {
        console.error('Failed to like post:', error);
    }
}

async function sharePost(postId) {
    try {
        await fetch(`${API_BASE}/feed/${postId}/share`, { method: 'POST' });
        loadFeed();
    } catch (error) {
        console.error('Failed to share post:', error);
    }
}

function showCreateTeamModal() {
    if (!currentUser) {
        alert('Please create a user account first');
        return;
    }

    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = `
        <h2>Create New Team</h2>
        <form id="create-team-form">
            <div class="form-group">
                <label>Team Name</label>
                <input type="text" id="team-name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="team-description"></textarea>
            </div>
            <button type="submit">Create Team</button>
        </form>
    `;

    document.getElementById('create-team-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createTeam();
    });

    modal.classList.add('show');
}

async function createTeam() {
    const name = document.getElementById('team-name').value;
    const description = document.getElementById('team-description').value;

    try {
        await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, name, description })
        });

        document.getElementById('modal').classList.remove('show');
        switchView('teams');
    } catch (error) {
        console.error('Failed to create team:', error);
        alert('Failed to create team');
    }
}

function showImportGitHubModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = `
        <h2>Import Agents from GitHub</h2>
        <form id="import-form">
            <div class="form-group">
                <label>Repository URL</label>
                <input type="text" id="repo-url" placeholder="https://github.com/owner/repo" required>
            </div>
            <div class="form-group">
                <label>Directory (optional)</label>
                <input type="text" id="directory" placeholder="agents" value="agents">
            </div>
            <button type="submit">Import Agents</button>
        </form>
    `;

    document.getElementById('import-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await importFromGitHub();
    });

    modal.classList.add('show');
}

async function importFromGitHub() {
    const repoUrl = document.getElementById('repo-url').value;
    const directory = document.getElementById('directory').value || 'agents';

    try {
        const response = await fetch(`${API_BASE}/agents/import/repo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl, directory })
        });

        if (response.ok) {
            document.getElementById('modal').classList.remove('show');
            loadAgents();
            alert('Agents imported successfully!');
        } else {
            alert('Failed to import agents');
        }
    } catch (error) {
        console.error('Failed to import from GitHub:', error);
        alert('Failed to import agents');
    }
}

function viewAgent(agentId) {
    alert(`Agent details view - ID: ${agentId}`);
}

function hireAgent(agentId) {
    alert(`Hire agent functionality - Agent ID: ${agentId}\nCreate a team first, then add agents to it!`);
}

async function deleteTeam(teamId) {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
        await fetch(`${API_BASE}/teams/${teamId}`, { method: 'DELETE' });
        loadTeams();
    } catch (error) {
        console.error('Failed to delete team:', error);
    }
}

async function removeFromTeam(teamId, agentId) {
    try {
        await fetch(`${API_BASE}/teams/${teamId}/members/${agentId}`, { method: 'DELETE' });
        loadTeams();
    } catch (error) {
        console.error('Failed to remove from team:', error);
    }
}
