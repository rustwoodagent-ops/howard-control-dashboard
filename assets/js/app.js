// Howard Dashboard V1 - Static JSON-driven frontend
// No backend dependencies. GitHub Pages compatible.

const DATA_FILES = {
  projects: './data/projects.json',
  activity: './data/activity.json',
  milestones: './data/milestones.json',
  logs: './data/logs.json',
  assignments: './data/assignments.json'
};

const state = {
  projects: [],
  activity: [],
  milestones: [],
  logs: [],
  assignments: []
};

const el = {
  timestamp: document.getElementById('timestamp'),
  workforceStatus: document.getElementById('workforceStatus'),
  projectsPanel: document.getElementById('projectsPanel'),
  milestonesPanel: document.getElementById('milestonesPanel'),
  activityPanel: document.getElementById('activityPanel'),
  logsPanel: document.getElementById('logsPanel'),
  projectCount: document.getElementById('projectCount'),
  milestoneCount: document.getElementById('milestoneCount'),
  activityCount: document.getElementById('activityCount'),
  logCount: document.getElementById('logCount'),
  assignmentSelect: document.getElementById('assignmentSelect'),
  dispatchBtn: document.getElementById('dispatchBtn'),
  runAuditBtn: document.getElementById('runAuditBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  consoleOutput: document.getElementById('consoleOutput'),
  auditOutput: document.getElementById('auditOutput')
};

function nowIso() {
  return new Date().toISOString();
}

function setTimestamp() {
  el.timestamp.textContent = `Last refresh: ${new Date().toLocaleString()}`;
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function logConsole(message, level = 'INFO') {
  const row = document.createElement('div');
  row.innerHTML = `<span class="text-slate-500">[${new Date().toLocaleTimeString()}]</span> <span class="text-cyan-300">${level}</span> ${escapeHtml(message)}`;
  el.consoleOutput.prepend(row);
}

function renderProjects() {
  el.projectCount.textContent = state.projects.length;
  el.projectsPanel.innerHTML = state.projects.map(p => {
    const statusClass = p.status === 'on-track'
      ? 'text-emerald-300 bg-emerald-500/10'
      : p.status === 'at-risk'
        ? 'text-amber-300 bg-amber-500/10'
        : 'text-slate-300 bg-slate-700/40';

    return `
      <article class="rounded-lg border border-slate-700 p-3 bg-slate-900/40">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-semibold text-sm">${escapeHtml(p.name)}</h3>
            <p class="text-xs text-slate-400 mt-1">Owner: ${escapeHtml(p.ownerAgent)} • Domain: ${escapeHtml(p.domain)}</p>
          </div>
          <span class="px-2 py-1 text-xs rounded ${statusClass}">${escapeHtml(p.status)}</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">${escapeHtml(p.summary)}</p>
        <div class="mt-2">
          <div class="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Completion</span><span>${p.progress}%</span>
          </div>
          <div class="w-full h-2 bg-slate-800 rounded">
            <div class="h-2 bg-cyan-400/80 rounded" style="width:${Math.max(0, Math.min(100, p.progress))}%"></div>
          </div>
        </div>
      </article>
    `;
  }).join('') || '<p class="text-slate-400 text-sm">No project data.</p>';
}

function renderMilestones() {
  el.milestoneCount.textContent = state.milestones.length;
  el.milestonesPanel.innerHTML = state.milestones.map(m => {
    return `
      <article class="rounded-lg border border-slate-700 p-3 bg-slate-900/40">
        <div class="flex justify-between items-center gap-2">
          <h3 class="font-semibold text-sm">${escapeHtml(m.title)}</h3>
          <span class="text-xs ${m.completed ? 'text-emerald-300' : 'text-amber-300'}">${m.completed ? 'Completed' : 'Pending'}</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">Project: ${escapeHtml(m.projectId)} • Due: ${escapeHtml(m.dueDate)}</p>
      </article>
    `;
  }).join('') || '<p class="text-slate-400 text-sm">No milestone data.</p>';
}

function renderActivity() {
  el.activityCount.textContent = state.activity.length;
  el.activityPanel.innerHTML = state.activity.map(a => `
    <article class="rounded-lg border border-slate-700 p-3 bg-slate-900/40">
      <div class="flex justify-between gap-2 text-xs text-slate-400">
        <span>${escapeHtml(a.timestamp)}</span>
        <span class="text-cyan-300">${escapeHtml(a.agent)}</span>
      </div>
      <p class="text-sm mt-1">${escapeHtml(a.action)}</p>
      <p class="text-xs text-slate-400 mt-1">${escapeHtml(a.context)}</p>
    </article>
  `).join('') || '<p class="text-slate-400 text-sm">No activity feed items.</p>';
}

function renderLogs() {
  el.logCount.textContent = state.logs.length;
  el.logsPanel.innerHTML = state.logs.map(l => {
    const levelColor = l.level === 'ERROR' ? 'text-rose-300' : l.level === 'WARN' ? 'text-amber-300' : 'text-slate-300';
    return `
      <div class="rounded border border-slate-800 px-2 py-1 bg-slate-950/70">
        <span class="text-slate-500">${escapeHtml(l.timestamp)}</span>
        <span class="${levelColor} ml-2">${escapeHtml(l.level)}</span>
        <span class="text-cyan-300 ml-2">${escapeHtml(l.source)}</span>
        <span class="ml-2">${escapeHtml(l.message)}</span>
      </div>
    `;
  }).join('') || '<p class="text-slate-400 text-sm font-sans">No log entries.</p>';
}

function renderAssignments() {
  el.assignmentSelect.innerHTML = state.assignments.map(a => `
    <option value="${escapeHtml(a.id)}">${escapeHtml(a.id)} — ${escapeHtml(a.title)} (${escapeHtml(a.priority)})</option>
  `).join('');
}

function renderAuditOutput(summary) {
  el.auditOutput.innerHTML = `
    <p><strong>Status:</strong> <span class="text-cyan-300">${escapeHtml(summary.status)}</span></p>
    <p><strong>Active Projects:</strong> ${summary.activeProjects}</p>
    <p><strong>Pending Milestones:</strong> ${summary.pendingMilestones}</p>
    <p><strong>Error Logs:</strong> ${summary.errorLogs}</p>
    <p><strong>Open Assignments:</strong> ${summary.openAssignments}</p>
    <p class="text-xs text-slate-400 mt-2">Audit Timestamp: ${escapeHtml(summary.timestamp)}</p>
  `;
}

function runSystemAudit() {
  const summary = {
    status: 'Validated',
    activeProjects: state.projects.filter(p => p.status !== 'archived').length,
    pendingMilestones: state.milestones.filter(m => !m.completed).length,
    errorLogs: state.logs.filter(l => l.level === 'ERROR').length,
    openAssignments: state.assignments.filter(a => a.status !== 'completed').length,
    timestamp: nowIso()
  };

  renderAuditOutput(summary);
  logConsole('System Auditor executed validation across projects, milestones, logs, and assignments.', 'AUDIT');
}

function dispatchAssignment() {
  const id = el.assignmentSelect.value;
  const assignment = state.assignments.find(a => a.id === id);
  if (!assignment) return;

  logConsole(`Assignment dispatched: ${assignment.id} (${assignment.title}) to ${assignment.assignedTo.join(', ')}`, 'EXEC');

  state.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: nowIso(),
    agent: assignment.assignedTo[0],
    action: `Started assignment ${assignment.id}`,
    context: assignment.title
  });

  state.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: nowIso(),
    level: 'INFO',
    source: 'CommandConsole',
    message: `Dispatched ${assignment.id} (${assignment.title})`
  });

  renderActivity();
  renderLogs();
}

async function loadAllData() {
  const [projects, activity, milestones, logs, assignments] = await Promise.all([
    loadJson(DATA_FILES.projects),
    loadJson(DATA_FILES.activity),
    loadJson(DATA_FILES.milestones),
    loadJson(DATA_FILES.logs),
    loadJson(DATA_FILES.assignments)
  ]);

  state.projects = projects.data || [];
  state.activity = activity.data || [];
  state.milestones = milestones.data || [];
  state.logs = logs.data || [];
  state.assignments = assignments.data || [];

  renderProjects();
  renderMilestones();
  renderActivity();
  renderLogs();
  renderAssignments();
  runSystemAudit();
  setTimestamp();
  el.workforceStatus.textContent = 'Operational';
  logConsole('Dashboard data loaded successfully.', 'INFO');
}

function bindEvents() {
  el.dispatchBtn.addEventListener('click', dispatchAssignment);
  el.runAuditBtn.addEventListener('click', runSystemAudit);
  el.refreshBtn.addEventListener('click', async () => {
    try {
      await loadAllData();
    } catch (err) {
      logConsole(`Refresh failed: ${err.message}`, 'ERROR');
    }
  });
}

async function init() {
  bindEvents();
  try {
    await loadAllData();
  } catch (err) {
    el.workforceStatus.textContent = 'Degraded';
    logConsole(`Initialization failed: ${err.message}`, 'ERROR');
  }
}

init();
