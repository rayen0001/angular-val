// services/sseService.js
const EventEmitter = require('events');

class SSEService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // founderId -> Set of response objects
    this.heartbeatInterval = 30000; // 30 seconds
    this.startHeartbeat();
  }

  // Add a new SSE connection for a founder
  addConnection(founderId, res) {
    const founderIdStr = founderId.toString();
    
    if (!this.connections.has(founderIdStr)) {
      this.connections.set(founderIdStr, new Set());
    }
    
    this.connections.get(founderIdStr).add(res);
    
    console.log(`SSE connection added for founder: ${founderIdStr}. Total connections: ${this.connections.get(founderIdStr).size}`);

    // Clean up when connection closes
    res.on('close', () => {
      console.log(`SSE connection closed for founder: ${founderIdStr}`);
      this.removeConnection(founderId, res);
    });

    res.on('error', (error) => {
      console.error(`SSE connection error for founder ${founderIdStr}:`, error.message);
      this.removeConnection(founderId, res);
    });

    // Send initial heartbeat
    this.sendHeartbeat(res);
  }

  // Remove a connection
  removeConnection(founderId, res) {
    const founderIdStr = founderId.toString();
    const connections = this.connections.get(founderIdStr);
    
    if (connections) {
      connections.delete(res);
      console.log(`SSE connection removed for founder: ${founderIdStr}. Remaining connections: ${connections.size}`);
      
      if (connections.size === 0) {
        this.connections.delete(founderIdStr);
        console.log(`All connections removed for founder: ${founderIdStr}`);
      }
    }
  }

  // Send notification to a specific founder
  sendNotificationToFounder(founderId, eventType, data) {
    const founderIdStr = founderId.toString();
    const connections = this.connections.get(founderIdStr);
    
    if (connections && connections.size > 0) {
      const message = JSON.stringify({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
      });

      console.log(`Sending ${eventType} notification to founder ${founderIdStr} (${connections.size} connections)`);

      const deadConnections = new Set();
      
      connections.forEach(res => {
        try {
          res.write(`event: ${eventType}\n`);
          res.write(`data: ${message}\n\n`);
        } catch (error) {
          console.error(`Error sending SSE message to founder ${founderIdStr}:`, error.message);
          deadConnections.add(res);
        }
      });

      // Clean up dead connections
      deadConnections.forEach(res => {
        this.removeConnection(founderId, res);
      });

      return true;
    } else {
      console.log(`No active connections for founder ${founderIdStr}`);
      return false;
    }
  }

  // Send heartbeat to a specific connection
  sendHeartbeat(res) {
    try {
      const heartbeatData = JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      });
      
      res.write(`event: heartbeat\n`);
      res.write(`data: ${heartbeatData}\n\n`);
    } catch (error) {
      console.error('Error sending heartbeat:', error.message);
    }
  }

  // Send heartbeat to all connections
  sendHeartbeatToAll() {
    let totalConnections = 0;
    
    this.connections.forEach((connections, founderId) => {
      const deadConnections = new Set();
      
      connections.forEach(res => {
        try {
          this.sendHeartbeat(res);
          totalConnections++;
        } catch (error) {
          console.error(`Heartbeat failed for founder ${founderId}:`, error.message);
          deadConnections.add(res);
        }
      });

      // Clean up dead connections
      deadConnections.forEach(res => {
        this.removeConnection(founderId, res);
      });
    });

    if (totalConnections > 0) {
      console.log(`Heartbeat sent to ${totalConnections} connections`);
    }
  }

  // Start heartbeat interval
  startHeartbeat() {
    setInterval(() => {
      this.sendHeartbeatToAll();
    }, this.heartbeatInterval);
    
    console.log(`SSE heartbeat started with ${this.heartbeatInterval}ms interval`);
  }

  // Get number of active connections for a founder
  getConnectionCount(founderId) {
    const founderIdStr = founderId.toString();
    const connections = this.connections.get(founderIdStr);
    return connections ? connections.size : 0;
  }

  // Get total number of connections
  getTotalConnections() {
    let total = 0;
    this.connections.forEach(connections => {
      total += connections.size;
    });
    return total;
  }

  // Get all connected founder IDs
  getConnectedFounders() {
    return Array.from(this.connections.keys());
  }

  // Get connection statistics
  getStats() {
    const stats = {
      totalFounders: this.connections.size,
      totalConnections: this.getTotalConnections(),
      founders: {}
    };

    this.connections.forEach((connections, founderId) => {
      stats.founders[founderId] = connections.size;
    });

    return stats;
  }

  // Broadcast to all connected founders (optional utility)
  broadcastToAll(eventType, data) {
    let sentCount = 0;
    
    this.connections.forEach((connections, founderId) => {
      if (this.sendNotificationToFounder(founderId, eventType, data)) {
        sentCount++;
      }
    });

    console.log(`Broadcast ${eventType} sent to ${sentCount} founders`);
    return sentCount;
  }

  // Clean up all connections (for graceful shutdown)
  cleanup() {
    console.log('Cleaning up all SSE connections...');
    
    this.connections.forEach((connections, founderId) => {
      connections.forEach(res => {
        try {
          res.end();
        } catch (error) {
          console.error(`Error closing connection for founder ${founderId}:`, error.message);
        }
      });
    });

    this.connections.clear();
    console.log('All SSE connections cleaned up');
  }
}

// Create singleton instance
const sseService = new SSEService();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up SSE connections...');
  sseService.cleanup();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, cleaning up SSE connections...');
  sseService.cleanup();
});

module.exports = sseService;