// Log panel override
export function setupLogPanel(logPanelId = 'logPanel') {
  const logPanel = document.getElementById(logPanelId);
  if (logPanel) {
    const origLog = console.log;
    console.log = function(...args) {
      origLog.apply(console, args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
      const line = document.createElement('div');
      line.textContent = msg;
      logPanel.appendChild(line);
      logPanel.scrollTop = logPanel.scrollHeight;
    };
  }
}
