/**
 * CryptoScope AI — Bitcoin Address Format Regex Validator Middleware
 * 
 * Enforces strict Bitcoin address format validation on all incoming :address route parameters
 * before passing queries to external blockchain APIs (mempool.space, blockstream, coingecko, etc.).
 * 
 * Supported Standard Bitcoin Address Formats:
 * - Legacy P2PKH (starts with '1', 26-35 characters, Base58)
 * - Pay-to-Script-Hash P2SH (starts with '3', 26-35 characters, Base58)
 * - Native SegWit P2WPKH / P2WSH Bech32 (starts with 'bc1q', 42-62 characters, Bech32)
 * - Taproot P2TR Bech32m (starts with 'bc1p', 62 characters, Bech32m)
 * - Testnet / Regtest (tb1..., 2..., m..., n...)
 */

const BTC_LEGACY_P2PKH = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BTC_P2SH = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BTC_SEGWIT_BECH32 = /^bc1[ac-hj-np-z02-9]{38,59}$/i;
const BTC_TAPROOT_BECH32M = /^bc1p[ac-hj-np-z02-9]{58}$/i;
const BTC_TESTNET = /^(tb1[ac-hj-np-z02-9]{38,59}|[2mn][a-km-zA-HJ-NP-Z1-9]{25,34})$/i;

/**
 * Validates a single Bitcoin address string
 * @param {string} address - The raw address to validate
 * @returns {{ isValid: boolean, type?: string, network?: string, address?: string, error?: string }}
 */
function validateBitcoinAddressFormat(address) {
    if (!address || typeof address !== "string") {
        return {
            isValid: false,
            error: "A valid Bitcoin address is required.",
        };
    }

    const trimmed = address.trim();

    if (trimmed.length < 26 || trimmed.length > 90) {
        return {
            isValid: false,
            error: `Invalid Bitcoin address length (${trimmed.length} characters). Standard Bitcoin addresses are between 26 and 90 characters.`,
        };
    }

    if (BTC_TAPROOT_BECH32M.test(trimmed)) {
        return {
            isValid: true,
            type: "Taproot (P2TR / Bech32m)",
            network: "mainnet",
            address: trimmed.toLowerCase(),
        };
    }

    if (BTC_SEGWIT_BECH32.test(trimmed)) {
        return {
            isValid: true,
            type: "Native SegWit (Bech32)",
            network: "mainnet",
            address: trimmed.toLowerCase(),
        };
    }

    if (BTC_P2SH.test(trimmed)) {
        return {
            isValid: true,
            type: "Pay-to-Script-Hash (P2SH)",
            network: "mainnet",
            address: trimmed,
        };
    }

    if (BTC_LEGACY_P2PKH.test(trimmed)) {
        return {
            isValid: true,
            type: "Legacy (P2PKH)",
            network: "mainnet",
            address: trimmed,
        };
    }

    if (BTC_TESTNET.test(trimmed)) {
        return {
            isValid: true,
            type: "Testnet Address",
            network: "testnet",
            address: trimmed,
        };
    }

    return {
        isValid: false,
        error: "Invalid Bitcoin address format. Expected Legacy (1...), P2SH (3...), Native SegWit (bc1q...), or Taproot (bc1p...).",
    };
}

/**
 * Express Middleware: Validate :address route parameter
 */
const requireValidBitcoinAddress = (req, res, next) => {
    const rawAddress = req.params.address || req.query.address || req.body?.address;
    const result = validateBitcoinAddressFormat(rawAddress);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            error: "INVALID_BITCOIN_ADDRESS",
            message: result.error,
            providedAddress: rawAddress || null,
        });
    }

    // Attach validated and normalized metadata to request
    req.params.address = result.address;
    req.validatedAddress = result.address;
    req.addressType = result.type;
    req.network = result.network;
    next();
};

module.exports = {
    validateBitcoinAddressFormat,
    requireValidBitcoinAddress,
};
