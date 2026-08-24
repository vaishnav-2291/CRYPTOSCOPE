/**
 * Bitcoin Address Validator & Heuristic Parser
 * Validates Base58 (Legacy P2PKH / P2SH) and Bech32/Bech32m (Native SegWit / Taproot)
 */

const BTC_LEGACY_P2PKH_REGEX = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BTC_P2SH_REGEX = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BTC_SEGWIT_BECH32_REGEX = /^bc1[ac-hj-np-z02-9]{38,59}$/i;
const BTC_TAPROOT_BECH32M_REGEX = /^bc1p[ac-hj-np-z02-9]{58}$/i;
const BTC_TESTNET_REGEX = /^(tb1[ac-hj-np-z02-9]{38,59}|[2mn][a-km-zA-HJ-NP-Z1-9]{25,34})$/i;

/**
 * Validate a single Bitcoin address and classify its type
 */
function validateBitcoinAddress(address) {
    if (!address || typeof address !== "string") {
        return {
            isValid: false,
            error: "Wallet address is required and must be a string",
        };
    }

    const trimmed = address.trim();

    if (trimmed.length < 26 || trimmed.length > 90) {
        return {
            isValid: false,
            error: `Invalid Bitcoin address length (${trimmed.length} chars). Expected between 26 and 90 characters.`,
        };
    }

    if (BTC_TAPROOT_BECH32M_REGEX.test(trimmed)) {
        return {
            isValid: true,
            type: "Taproot (P2TR / Bech32m)",
            network: "mainnet",
            address: trimmed.toLowerCase(),
        };
    }

    if (BTC_SEGWIT_BECH32_REGEX.test(trimmed)) {
        return {
            isValid: true,
            type: "Native SegWit (Bech32)",
            network: "mainnet",
            address: trimmed.toLowerCase(),
        };
    }

    if (BTC_P2SH_REGEX.test(trimmed)) {
        return {
            isValid: true,
            type: "Pay-to-Script-Hash (P2SH)",
            network: "mainnet",
            address: trimmed,
        };
    }

    if (BTC_LEGACY_P2PKH_REGEX.test(trimmed)) {
        return {
            isValid: true,
            type: "Legacy (P2PKH)",
            network: "mainnet",
            address: trimmed,
        };
    }

    if (BTC_TESTNET_REGEX.test(trimmed)) {
        return {
            isValid: true,
            type: "Testnet Address",
            network: "testnet",
            address: trimmed,
        };
    }

    return {
        isValid: false,
        error: "Invalid Bitcoin address format. Supported formats: Legacy (1...), P2SH (3...), SegWit (bc1q...), Taproot (bc1p...).",
    };
}

/**
 * Express middleware for validating single address in params or body
 */
const validateAddressParam = (req, res, next) => {
    const address = req.params.address || req.body.address || req.query.address;
    const result = validateBitcoinAddress(address);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.error,
        });
    }

    req.validatedAddress = result.address;
    req.addressType = result.type;
    req.network = result.network;
    next();
};

/**
 * Express middleware for validating batch address payload
 */
const validateBatchAddresses = (req, res, next) => {
    const { addresses } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
        return res.status(400).json({
            success: false,
            message: "Request body must contain an 'addresses' array.",
        });
    }

    const uniqueAddrs = [...new Set(addresses.map((a) => (typeof a === "string" ? a.trim() : "")).filter(Boolean))];

    if (uniqueAddrs.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one valid Bitcoin address must be provided.",
        });
    }

    if (uniqueAddrs.length > 20) {
        return res.status(400).json({
            success: false,
            message: "Batch limit exceeded. Maximum 20 addresses per batch scan request.",
        });
    }

    const validationResults = uniqueAddrs.map((addr) => ({
        input: addr,
        ...validateBitcoinAddress(addr),
    }));

    const invalidAddrs = validationResults.filter((r) => !r.isValid);

    if (invalidAddrs.length === uniqueAddrs.length) {
        return res.status(400).json({
            success: false,
            message: "All provided addresses are invalid Bitcoin formats.",
            details: invalidAddrs,
        });
    }

    // Pass valid addresses to next handler
    req.validAddresses = validationResults.filter((r) => r.isValid).map((r) => r.address);
    req.invalidAddresses = invalidAddrs.map((r) => r.input);
    next();
};

/**
 * Middleware to validate registration payload
 */
const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Name is required (at least 2 characters).",
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "A valid email address is required.",
        });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long.",
        });
    }

    next();
};

module.exports = {
    validateBitcoinAddress,
    validateAddressParam,
    validateBatchAddresses,
    validateRegister,
};
