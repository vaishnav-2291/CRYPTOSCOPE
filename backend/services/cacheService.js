/**
 * In-Memory TTL Cache Service
 * Provides lightweight caching for blockchain data and crypto market prices
 */

class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
        };

        // Periodic cleanup every 2 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Get cached item if not expired
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    /**
     * Set cache key with TTL in seconds
     * @param {string} key
     * @param {any} value
     * @param {number} ttlSeconds - Default 300s (5 minutes)
     */
    set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry, createdAt: Date.now() });
        this.stats.sets++;
        return value;
    }

    /**
     * Delete a specific key
     */
    del(key) {
        return this.cache.delete(key);
    }

    /**
     * Check if key exists and is valid
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Clear all cached items
     */
    flush() {
        this.cache.clear();
    }

    /**
     * Purge expired items
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache diagnostics
     */
    getStats() {
        return {
            size: this.cache.size,
            ...this.stats,
            hitRate:
                this.stats.hits + this.stats.misses > 0
                    ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + "%"
                    : "0%",
        };
    }
}

const cacheService = new MemoryCache();

module.exports = cacheService;
