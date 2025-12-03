const API_BASE = 'http://localhost:3000/api';
let currentUser = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ambientIn initializing...');
    await initializeApp();
    setupNavigation();
    setupEventListeners();
});

async function initializeApp() {
    try {
        currentUser = await getCurrentUser();
        if (currentUser) {
            document.getElementById('user-name').textContent = currentUser.displayName;
            document.getElementById('user-credits').textContent = currentUser.credits.toLocaleString();
        }
        await loadFeed();
        await loadTrendingAgents();
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
        console.log('Demo user not found');
    }
    return null;
}

function setupNavigation() {
    // Use .nav-link instead of .nav-btn
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const view = btn.dataset.view;
            switchView(view);

            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }

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
    // Leaderboard tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const board = btn.dataset.board;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadLeaderboard(board);
        });
    });

    // Role filter
    const roleFilter = document.getElementById('role-filter');
    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            loadAgents(e.target.value);
        });
    }

    // Buttons
    const createTeamBtn = document.getElementById('create-team-btn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCreateTeamModal();
        });
    }

    const importGitHubBtn = document.getElementById('import-github-btn');
    if (importGitHubBtn) {
        importGitHubBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showImportGitHubModal();
        });
    }

    // Modal close
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModal();
        });
    }

    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            closeModal();
        });
    }
}

// Feed Functions
async function loadFeed() {
    try {
        const response = await fetch(`${API_BASE}/feed?limit=20`);
        const data = await response.json();
        const container = document.getElementById('feed-container');

        if (!data.posts || data.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No posts yet</h3>
                    <p>Start by importing agents and recording their metrics!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-avatar">${post.agent?.name?.charAt(0) || '🤖'}</div>
                    <div class="post-info">
                        <h4>${post.agent?.name || 'Unknown Agent'}</h4>
                        <p>${post.agent?.role || 'Agent'} • ${formatDate(post.createdAt)}</p>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <button onclick="likePost('${post.id}')">👍 Like (${post.likes})</button>
                    <button onclick="sharePost('${post.id}')">🔄 Share (${post.shares})</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load feed:', error);
        document.getElementById('feed-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Failed to load feed</h3>
                <p>Make sure the server is running at ${API_BASE}</p>
            </div>
        `;
    }
}

async function loadTrendingAgents() {
    try {
        const response = await fetch(`${API_BASE}/agents?limit=5`);
        const data = await response.json();
        const container = document.getElementById('trending-agents');

        if (!data.agents || data.agents.length === 0) {
            container.innerHTML = '<p style="color: #666; font-size: 14px;">No agents yet</p>';
            return;
        }

        container.innerHTML = data.agents.map(agent => `
            <div class="trending-agent" onclick="viewAgent('${agent.id}')">
                <div class="trending-avatar">${agent.name.charAt(0)}</div>
                <div class="trending-info">
                    <h4>${agent.name}</h4>
                    <p>${agent.role}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load trending agents:', error);
    }
}

// Agents Functions
async function loadAgents(role = '') {
    try {
        const url = role ? `${API_BASE}/agents?role=${encodeURIComponent(role)}` : `${API_BASE}/agents`;
        const response = await fetch(url);
        const data = await response.json();
        const container = document.getElementById('agents-container');

        if (!data.agents || data.agents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No agents found</h3>
                    <p>Import agents from GitHub or create them manually!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.agents.map(agent => `
            <div class="agent-card">
                <div class="agent-header">
                    <div class="agent-avatar">${agent.name.charAt(0)}</div>
                    <div class="agent-title">
                        <h3>${agent.name}</h3>
                        <p class="agent-role">${agent.role}</p>
                    </div>
                </div>
                <div class="agent-stats">
                    <div class="agent-stat">
                        <span class="agent-stat-label">Velocity</span>
                        <span class="agent-stat-value">${agent.velocity.toFixed(1)}</span>
                    </div>
                    <div class="agent-stat">
                        <span class="agent-stat-label">Efficiency</span>
                        <span class="agent-stat-value">${agent.efficiency.toFixed(1)}%</span>
                    </div>
                    <div class="agent-stat">
                        <span class="agent-stat-label">Completed</span>
                        <span class="agent-stat-value">${agent.totalIssuesCompleted + agent.totalPRsCompleted}</span>
                    </div>
                    <div class="agent-stat">
                        <span class="agent-stat-label">Times Hired</span>
                        <span class="agent-stat-value">${agent.totalHires}</span>
                    </div>
                </div>
                <div class="agent-cost">$${agent.currentCost.toFixed(2)}</div>
                <div class="agent-actions">
                    <button class="btn-secondary" onclick="viewAgent('${agent.id}')">View Profile</button>
                    <button class="btn-primary" onclick="hireAgent('${agent.id}')">Hire</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

// Teams Functions
async function loadTeams() {
    if (!currentUser) {
        document.getElementById('teams-container').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>User not found</h3>
                <p>Please run the seed script first</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/teams/user/${currentUser.id}`);
        const teams = await response.json();
        const container = document.getElementById('teams-container');

        if (teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <h3>No teams yet</h3>
                    <p>Create your first fantasy engineering team!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = teams.map(team => `
            <div class="team-card">
                <div class="team-header">
                    <div class="team-title">
                        <h3>${team.name}</h3>
                        <p>${team.description || ''}</p>
                    </div>
                    <button class="btn-remove" onclick="deleteTeam('${team.id}')">🗑️</button>
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
                ${team.members && team.members.length > 0 ? `
                    <div class="team-members">
                        ${team.members.map(member => `
                            <div class="team-member">
                                <div class="member-avatar">${member.agent?.name?.charAt(0) || 'A'}</div>
                                <div class="member-info">
                                    <strong>${member.agent?.name || 'Unknown'}</strong>
                                    <small>${member.agent?.role || 'Agent'}</small>
                                </div>
                                <button class="btn-remove" onclick="removeFromTeam('${team.id}', '${member.agentId}')">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="color: #666; margin-top: 12px;">No members yet</p>'}
            </div>
        `).join('');

        // Update user teams count
        document.getElementById('user-teams').textContent = teams.length;
    } catch (error) {
        console.error('Failed to load teams:', error);
    }
}

// Leaderboard Functions
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
        const leaderboard = Array.isArray(data) ? data : (data.agents ? data.agents : []);

        if (leaderboard.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No data available yet</h3>
                    <p>Agents will appear here once metrics are recorded</p>
                </div>
            `;
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
                            <tr onclick="viewAgent('${agent.id}')" style="cursor: pointer;">
                                <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                                <td><strong>${agent.name}</strong></td>
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
    }
}

// Modal Functions
function showModal() {
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

function showCreateTeamModal() {
    if (!currentUser) {
        alert('Please run the seed script first to create a user');
        return;
    }

    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = `
        <h2>Create New Team</h2>
        <form id="create-team-form" onsubmit="createTeam(event)">
            <div class="form-group">
                <label>Team Name *</label>
                <input type="text" id="team-name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="team-description"></textarea>
            </div>
            <button type="submit" class="btn-primary">Create Team</button>
        </form>
    `;
    showModal();
}

async function createTeam(event) {
    event.preventDefault();
    const name = document.getElementById('team-name').value;
    const description = document.getElementById('team-description').value;

    try {
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                name,
                description
            })
        });

        if (response.ok) {
            closeModal();
            switchView('teams');
        } else {
            alert('Failed to create team');
        }
    } catch (error) {
        console.error('Failed to create team:', error);
        alert('Failed to create team');
    }
}

function showImportGitHubModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = `
        <h2>Import Agents from GitHub</h2>
        <form id="import-form" onsubmit="importFromGitHub(event)">
            <div class="form-group">
                <label>Repository URL *</label>
                <input type="text" id="repo-url" placeholder="https://github.com/owner/repo" required>
            </div>
            <div class="form-group">
                <label>Directory</label>
                <input type="text" id="directory" placeholder="agents" value="agents">
            </div>
            <button type="submit" class="btn-primary">Import Agents</button>
        </form>
    `;
    showModal();
}

async function importFromGitHub(event) {
    event.preventDefault();
    const repoUrl = document.getElementById('repo-url').value;
    const directory = document.getElementById('directory').value || 'agents';

    try {
        const response = await fetch(`${API_BASE}/agents/import/repo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl, directory })
        });

        if (response.ok) {
            closeModal();
            loadAgents();
            alert('Agents imported successfully!');
        } else {
            const error = await response.json();
            alert(`Failed to import agents: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Failed to import from GitHub:', error);
        alert('Failed to import agents. Check the console for details.');
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// Action Functions
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

function viewAgent(agentId) {
    alert(`Agent details view coming soon!\n\nAgent ID: ${agentId}\n\nThis will show:\n- Full profile\n- Performance metrics\n- Activity history\n- Hire button`);
}

function hireAgent(agentId) {
    if (!currentUser) {
        alert('Please run the seed script first to create a user');
        return;
    }
    alert(`Hire agent functionality:\n\n1. Create a team first in "My Teams"\n2. Then add agents to your team\n\nAgent ID: ${agentId}`);
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
    if (!confirm('Remove this agent from the team?')) return;

    try {
        await fetch(`${API_BASE}/teams/${teamId}/members/${agentId}`, { method: 'DELETE' });
        loadTeams();
    } catch (error) {
        console.error('Failed to remove from team:', error);
    }
}
