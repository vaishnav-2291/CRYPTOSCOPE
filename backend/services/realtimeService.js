/**
 * CryptoScope AI — Server-Sent Events (SSE) Real-time Event Broadcaster
 */

class RealtimeService {
    constructor() {
        this.clients = new Set();
        this.startHeartbeat();
    }

    /**
     * Register a new SSE client connection
     */
    addClient(req, res, user = null) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders?.();

        const client = {
            id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            res,
            userId: user?.id || null,
            email: user?.email || null,
            role: user?.role || "guest",
            connectedAt: new Date(),
        };

        this.clients.add(client);

        // Send initial connection handshake
        this.sendToClient(client, "connected", {
            clientId: client.id,
            status: "Real-time SSE Stream Established 🛡️",
            timestamp: new Date().toISOString(),
        });

        req.on("close", () => {
            this.clients.delete(client);
        });

        return client;
    }

    /**
     * Send event to a single client
     */
    sendToClient(client, event, data) {
        try {
            client.res.write(`event: ${event}\n`);
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
            this.clients.delete(client);
        }
    }

    /**
     * Broadcast event to all connected clients (or filter by userId)
     */
    broadcast(event, data, targetUserId = null) {
        const payload = {
            ...data,
            _eventTimestamp: new Date().toISOString(),
        };

        this.clients.forEach((client) => {
            if (!targetUserId || client.userId === targetUserId) {
                this.sendToClient(client, event, payload);
            }
        });
    }

    /**
     * Specific typed emitters triggered AFTER successful database writes
     */
    emitScanCompleted(scan) {
        this.broadcast("scan_completed", {
            scanId: scan._id?.toString() || scan.scanId,
            address: scan.address,
            riskScore: scan.riskScore,
            riskLevel: scan.riskLevel,
            balance: scan.balance,
            userId: scan.user?.toString() || null,
        });
    }

    emitWatchlistUpdated(userId, action, item) {
        this.broadcast(
            "watchlist_updated",
            {
                userId,
                action,
                item,
            },
            userId
        );
    }

    emitAlertTriggered(alert) {
        this.broadcast("alert_triggered", {
            incidentId: alert.incidentId,
            address: alert.address,
            threatCategory: alert.threatCategory,
            severity: alert.severity,
            riskScore: alert.riskScore,
            status: alert.status,
            ruleTrigger: alert.ruleTrigger,
            amount: alert.amount,
            details: alert.details,
            timestamp: alert.createdAt || new Date(),
        });
    }

    emitActivityLogged(activity) {
        this.broadcast("activity_logged", {
            id: activity._id?.toString(),
            userId: activity.userId?.toString() || null,
            userEmail: activity.userEmail,
            action: activity.action,
            resourceType: activity.resourceType,
            resourceId: activity.resourceId,
            status: activity.status,
            timestamp: activity.createdAt || new Date(),
        });
    }

    /**
     * Heartbeat keeper
     */
    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach((client) => {
                try {
                    client.res.write(": heartbeat\n\n");
                } catch {
                    this.clients.delete(client);
                }
            });
        }, 20000);
    }

    getClientCount() {
        return this.clients.size;
    }
}

module.exports = new RealtimeService();
