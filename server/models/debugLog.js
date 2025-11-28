// A simple in-memory log store for debugging purposes
const logs = [];

const DebugLog = {
  add: (log) => {
    const timestamp = new Date().toISOString();
    logs.unshift({ timestamp, ...log }); // Add to the beginning of the array
    // Keep the log size manageable
    if (logs.length > 100) {
      logs.pop();
    }
  },
  
  getAll: () => {
    return logs;
  },
  
  clear: () => {
    logs.length = 0;
  }
};

module.exports = DebugLog;
