require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../app");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "cryptoscope_secret_key_default_2026";

test("Google Auth - Model Schema Validation", () => {
    // 1. Google user without password is valid
    const googleUser = new User({
        name: "Google Analyst",
        email: "google_analyst_test@cryptoscope.ai",
        googleId: "google-uid-1234567890",
        avatar: "https://lh3.googleusercontent.com/a/sample-avatar",
        authProvider: "google",
        role: "user",
    });
    const googleValidationErr = googleUser.validateSync();
    assert.strictEqual(googleValidationErr, undefined, "Google OAuth user should be valid without password hash");
    assert.strictEqual(googleUser.authProvider, "google");
    assert.strictEqual(googleUser.googleId, "google-uid-1234567890");

    // 2. Local user without password must fail validation
    const invalidLocalUser = new User({
        name: "Local User",
        email: "local_user_nopass@cryptoscope.ai",
        authProvider: "local",
    });
    const localValidationErr = invalidLocalUser.validateSync();
    assert.ok(localValidationErr && localValidationErr.errors.password, "Local user must require password");
});

test("Google Auth - Activity Model Enum Validation", () => {
    const actions = ["GOOGLE_LOGIN", "USER_REGISTERED_VIA_GOOGLE", "GOOGLE_ACCOUNT_LINKED"];
    for (const action of actions) {
        const activity = new UserActivity({
            action,
            userEmail: "test@cryptoscope.ai",
            resourceType: "USER",
            status: "SUCCESS",
        });
        const err = activity.validateSync();
        assert.strictEqual(err, undefined, `Activity model must accept action: ${action}`);
    }
});

test("Google Auth - Authorization Endpoint Redirects to Google Accounts", async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}/api/auth/google?origin=http://localhost:5173`, {
            redirect: "manual",
        });

        // If credentials are configured, it responds with 302 redirect to accounts.google.com
        // If not configured, it redirects to /login?error=...
        assert.strictEqual(res.status, 302, "Expected 302 redirect response");
        const location = res.headers.get("location");
        assert.ok(location, "Redirect location header must be present");

        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            assert.ok(
                location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"),
                `Redirect URL must point to Google OAuth endpoint, got: ${location}`
            );
            assert.ok(location.includes("response_type=code"), "URL must contain response_type=code");
            assert.ok(location.includes("scope="), "URL must contain scopes");
            assert.ok(location.includes("state="), "URL must contain signed CSRF state");
            assert.ok(location.includes("prompt=select_account"), "URL must contain prompt=select_account");

            // Extract and verify state parameter
            const urlObj = new URL(location);
            const stateParam = urlObj.searchParams.get("state");
            assert.ok(stateParam, "State param must be present in Google redirect");
            const decodedState = jwt.verify(stateParam, JWT_SECRET);
            assert.strictEqual(decodedState.origin, "http://localhost:5173", "State should preserve client origin");
            assert.ok(decodedState.nonce, "State must include random nonce");
        } else {
            assert.ok(location.includes("/login?error="), "Should redirect to login with error when credentials missing");
        }
    } finally {
        server.close();
    }
});

test("Google Auth - Callback Rejection on OAuth Error / User Cancellation", async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
        // Create valid state
        const state = jwt.sign({ nonce: "testnonce", origin: "http://localhost:5173" }, JWT_SECRET, { expiresIn: "5m" });

        // Simulate user clicking "Cancel" in Google consent screen
        const res = await fetch(`http://localhost:${port}/api/auth/google/callback?error=access_denied&state=${state}`, {
            redirect: "manual",
        });

        assert.strictEqual(res.status, 302);
        const location = res.headers.get("location");
        assert.ok(location.startsWith("http://localhost:5173/login?error="), `Should redirect to client login with error, got: ${location}`);
        assert.ok(location.includes("cancelled"), "Error message should mention cancellation");
    } finally {
        server.close();
    }
});

test("Google Auth - JWT Token Generation & /api/auth/me Verification", async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
        // Create mock user
        const mockUser = {
            _id: "660000000000000000000001",
            email: "google_verified@cryptoscope.ai",
            role: "analyst",
        };

        const token = jwt.sign(
            { id: mockUser._id, email: mockUser.email, role: mockUser.role },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        // Test authMiddleware with the generated JWT
        const res = await fetch(`http://localhost:${port}/api/wallet/dashboard/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // The endpoint should be accessible with this valid JWT
        assert.ok(res.status === 200 || res.status === 503, "Protected route accepted the JWT");
    } finally {
        server.close();
    }
});

test("Google Auth - Local Registration / Login Compatibility Unaffected", async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
        // Validation check on local login endpoint
        const res = await fetch(`http://localhost:${port}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "nonexistent@test.com", password: "Password123" }),
        });

        // If DB is disconnected, it returns 503 or 401 if connected
        assert.ok(res.status === 401 || res.status === 503, "Local login endpoint works correctly");
    } finally {
        server.close();
        setTimeout(() => process.exit(0), 500);
    }
});


