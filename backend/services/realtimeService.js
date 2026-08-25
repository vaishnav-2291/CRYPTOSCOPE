/**
 * CryptoScope AI — Multi-User Isolated Server-Sent Events (SSE) Realtime Broadcaster
 */
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwtConfig");

class RealtimeService {
    constructor() {
        this.clients = new Set();
        this.eventsEmittedCount = 0;
        this.startHeartbeat();
    }

    /**
     * Authenticate and register a new SSE client connection
     */
    addClient(req, res, user = null) {
        // If user wasn't populated by middleware, try extracting token from query
        let authenticatedUser = user;

        if (!authenticatedUser && req.query.token) {
            try {
                const secret = getJwtSecret();
                const decoded = jwt.verify(req.query.token, secret);
                authenticatedUser = decoded;
            } catch {
                // Keep as guest
            }
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders?.();

        const client = {
            id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            res,
            userId: authenticatedUser?.id || null,
            email: authenticatedUser?.email || null,
            role: authenticatedUser?.role || "guest",
            connectedAt: new Date(),
        };

        this.clients.add(client);

        // Send initial connection handshake
        this.sendToClient(client, "connected", {
            clientId: client.id,
            status: "Real-time SSE Stream Established 🛡️",
            authenticated: !!client.userId,
            user: client.userId ? { id: client.userId, email: client.email, role: client.role } : null,
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
            this.eventsEmittedCount++;
        } catch {
            this.clients.delete(client);
        }
    }

    /**
     * Broadcast event to all clients or filter by userId for strict Multi-User Isolation
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
     * Specific typed emitters triggered strictly AFTER successful database writes
     */
    emitScanCompleted(scan) {
        const targetUserId = scan.user?.toString() || null;
        // Broadcast to user who scanned, or all if public
        this.broadcast(
            "scan_completed",
            {
                scanId: scan._id?.toString() || scan.scanId,
                address: scan.address,
                riskScore: scan.riskScore,
                riskLevel: scan.riskLevel,
                balance: scan.balance,
                userId: targetUserId,
                scannedAt: scan.scannedAt || new Date(),
            },
            targetUserId
        );
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
        // High severity security alerts are broadcasted to all active SOC monitors
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
        const targetUserId = activity.userId?.toString() || null;
        this.broadcast(
            "activity_logged",
            {
                id: activity._id?.toString(),
                userId: targetUserId,
                userEmail: activity.userEmail,
                action: activity.action,
                resourceType: activity.resourceType,
                resourceId: activity.resourceId,
                status: activity.status,
                timestamp: activity.createdAt || new Date(),
            },
            targetUserId
        );
    }

    emitPasswordChanged(userId) {
        const targetUserId = userId?.toString() || null;
        this.broadcast(
            "password_changed",
            {
                userId: targetUserId,
                action: "PASSWORD_CHANGED",
                message: "Your password was recently changed. Existing sessions have been terminated. Please log in again.",
                timestamp: new Date().toISOString(),
            },
            targetUserId
        );
    }

    /**
     * Heartbeat keep-alive every 15 seconds
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
        }, 15000);
    }

    getClientCount() {
        return this.clients.size;
    }

    getDiagnostics() {
        let authCount = 0;
        this.clients.forEach((c) => {
            if (c.userId) authCount++;
        });

        return {
            totalClients: this.clients.size,
            authenticatedClients: authCount,
            guestClients: this.clients.size - authCount,
            eventsEmittedCount: this.eventsEmittedCount,
        };
    }
}

module.exports = new RealtimeService();
