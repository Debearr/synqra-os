/**
 * AuraFX Export & Share Safety Guards
 * Phase 2: Export & Share Safety
 * 
 * STRICT ENFORCEMENT of export safety policies.
 * All exports must pass validation before being allowed.
 */

import { AuraSignal, SignalState } from '../types';
import { validateSignalSafety } from './guards';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface SafeSignalExport {
    id: string;
    symbol: string;
    timestamp: number;
    type: AuraSignal['type'];
    direction: AuraSignal['direction'];
    confidence: number;
    context: string;
    riskLevel: AuraSignal['riskLevel'];
    validityPeriod: AuraSignal['validityPeriod'];
    state: SignalState;
    // _meta is intentionally STRIPPED for safety
}

export interface SafeJSONExport {
    version: '1.0.0';
    exportedAt: number;
    expiresAt: number;
    sessionId: string;
    license: 'ANALYTICAL_USE_ONLY';
    disclaimer: string;
    signals: SafeSignalExport[];
}

export interface ImageExportOptions {
    format: 'png' | 'webp';
    quality: number; // Max 0.85
    includeWatermark: true; // MANDATORY
    includeDisclaimer: true; // MANDATORY
    maxWidth?: number; // Default 1920
    maxHeight?: number; // Default 1080
}

export interface PDFExportOptions {
    includeWatermark: true; // MANDATORY
    includeDisclaimer: true; // MANDATORY
    readOnly: true; // MANDATORY
    metadata: {
        sessionId: string;
        generatedAt: number;
        expiresAt: number;
        license: 'ANALYTICAL_USE_ONLY';
    };
}

export interface ShareLink {
    id: string;
    sessionId: string;
    createdAt: number;
    expiresAt: number;
    signalIds: string[];
    viewCount: number;
    maxViews: number; // Default 10
}

export interface ExportAuditLog {
    id: string;
    sessionId: string;
    userId: string;
    action: 'EXPORT_IMAGE' | 'EXPORT_PDF' | 'EXPORT_JSON' | 'SHARE_LINK' | 'SHARE_EMAIL' | 'SHARE_MOBILE' | 'SHARE_EXTENSION' | 'SHARE_DESKTOP';
    timestamp: number;
    signalIds: string[];
    format?: string;
    recipientEmail?: string;
    shareLink?: string;
    // Mobile sharing specific fields
    mobilePlatform?: 'ios' | 'android';
    sharedToApp?: string; // Destination app name if available
    deviceId?: string; // Hashed device ID
    // Browser extension specific fields
    browser?: 'chrome' | 'firefox' | 'edge' | 'safari';
    extensionVersion?: string;
    shareMethod?: 'download' | 'clipboard' | 'native-share' | 'save-file';
    // Desktop app specific fields
    desktopPlatform?: 'windows' | 'macos' | 'linux';
    osVersion?: string;
    appVersion?: string;
    electronVersion?: string;
    filePath?: string; // Hashed for privacy
    ipAddress: string;
    userAgent: string;
}

export interface MobileShareOptions {
    platform: 'ios' | 'android';
    format: 'png' | 'webp';
    includeWatermark: true; // MANDATORY
    includeDisclaimer: true; // MANDATORY
    quality: number; // Max 0.85
    shareText?: string; // Optional caption with disclaimer
}

export interface MobileShareResult {
    success: boolean;
    platform: string;
    sharedTo?: string; // App name if available
    timestamp: number;
    auditLogId: string;
}

export interface BrowserExtensionShareOptions {
    browser: 'chrome' | 'firefox' | 'edge' | 'safari';
    format: 'png' | 'webp';
    includeWatermark: true; // MANDATORY
    includeDisclaimer: true; // MANDATORY
    quality: number; // Max 0.85
    shareMethod: 'download' | 'clipboard' | 'native-share';
    extensionVersion: string; // For audit tracking
}

export interface BrowserExtensionShareResult {
    success: boolean;
    browser: string;
    shareMethod: string;
    timestamp: number;
    auditLogId: string;
    extensionVersion: string;
}

export interface DesktopAppShareOptions {
    platform: 'windows' | 'macos' | 'linux';
    format: 'png' | 'webp';
    includeWatermark: true; // MANDATORY
    includeDisclaimer: true; // MANDATORY
    quality: number; // Max 0.85
    shareMethod: 'save-file' | 'clipboard' | 'native-share';
    appVersion: string; // For audit tracking
    electronVersion: string; // For security tracking
}

export interface DesktopAppShareResult {
    success: boolean;
    platform: string;
    shareMethod: string;
    filePath?: string; // If saved to file
    timestamp: number;
    auditLogId: string;
    appVersion: string;
}


// ============================================================================
// CONSTANTS
// ============================================================================

export const EXPORT_RATE_LIMITS = {
    maxExportsPerHour: 5,
    maxExportsPerDay: 20,
    maxSignalsPerExport: 10,
    cooldownBetweenExports: 60000, // 1 minute
} as const;

export const LEGAL_DISCLAIMER = `IMPORTANT LEGAL NOTICE

This document contains probabilistic market intelligence generated by AuraFX, 
a research and analysis tool provided by Synqra. This is NOT financial advice, 
trading recommendations, or investment guidance.

Key Points:
• Signals are time-sensitive and decay in reliability
• All confidence scores are probabilistic (never 100%)
• Past performance does not guarantee future results
• You are solely responsible for your trading decisions
• Synqra assumes no liability for trading losses

License: ANALYTICAL USE ONLY
This export is licensed for personal analytical use only. Redistribution, 
commercial use, or integration into automated trading systems is strictly 
prohibited.`;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if signals are safe to export.
 * Enforces all export safety policies.
 */
export function validateExportSafety(
    signals: AuraSignal[],
    sessionId?: string
): ExportValidationResult {
    const errors: string[] = [];

    // 1. Check signal count (prevent bulk exports)
    if (signals.length === 0) {
        errors.push('No signals to export');
    }

    if (signals.length > EXPORT_RATE_LIMITS.maxSignalsPerExport) {
        errors.push(`Maximum ${EXPORT_RATE_LIMITS.maxSignalsPerExport} signals per export`);
    }

    // 2. Validate each signal
    for (const signal of signals) {
        const validation = validateSignalSafety(signal);
        if (!validation.isValid) {
            errors.push(`Signal ${signal.id}: ${validation.reasons.join(', ')}`);
        }
    }

    // 3. Check for expired signals
    const now = Date.now();
    const expiredSignals = signals.filter(s => s.validityPeriod.end < now);
    if (expiredSignals.length > 0) {
        errors.push(`${expiredSignals.length} signal(s) are already expired`);
    }

    // 4. Ensure session ID exists for traceability
    if (!sessionId) {
        errors.push('No valid session ID for export traceability');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Strips internal metadata from signals for safe export.
 * Returns a sanitized version without _meta fields.
 */
export function sanitizeSignalForExport(
    signal: AuraSignal,
    currentState: SignalState
): SafeSignalExport {
    return {
        id: signal.id,
        symbol: signal.symbol,
        timestamp: signal.timestamp,
        type: signal.type,
        direction: signal.direction,
        confidence: signal.confidence,
        context: signal.context,
        riskLevel: signal.riskLevel,
        validityPeriod: signal.validityPeriod,
        state: currentState,
        // _meta is intentionally omitted
    };
}

/**
 * Creates a safe JSON export structure with all required metadata.
 */
export function createSafeJSONExport(
    signals: AuraSignal[],
    signalStates: SignalState[],
    sessionId: string
): SafeJSONExport {
    const now = Date.now();
    const maxExpiry = Math.max(...signals.map(s => s.validityPeriod.end));

    return {
        version: '1.0.0',
        exportedAt: now,
        expiresAt: maxExpiry,
        sessionId,
        license: 'ANALYTICAL_USE_ONLY',
        disclaimer: LEGAL_DISCLAIMER,
        signals: signals.map((signal, index) =>
            sanitizeSignalForExport(signal, signalStates[index])
        ),
    };
}

/**
 * Validates image export options.
 */
export function validateImageExportOptions(
    options: Partial<ImageExportOptions>
): ExportValidationResult {
    const errors: string[] = [];

    // Watermark is MANDATORY
    if (options.includeWatermark !== true) {
        errors.push('Watermark is mandatory for image exports');
    }

    // Disclaimer is MANDATORY
    if (options.includeDisclaimer !== true) {
        errors.push('Disclaimer is mandatory for image exports');
    }

    // Quality must not exceed 0.85 to prevent OCR abuse
    if (options.quality && options.quality > 0.85) {
        errors.push('Image quality cannot exceed 0.85 to prevent automated parsing');
    }

    // Check format
    if (options.format && !['png', 'webp'].includes(options.format)) {
        errors.push('Invalid image format. Only PNG and WebP are allowed');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates PDF export options.
 */
export function validatePDFExportOptions(
    options: Partial<PDFExportOptions>
): ExportValidationResult {
    const errors: string[] = [];

    // Watermark is MANDATORY
    if (options.includeWatermark !== true) {
        errors.push('Watermark is mandatory for PDF exports');
    }

    // Disclaimer is MANDATORY
    if (options.includeDisclaimer !== true) {
        errors.push('Disclaimer is mandatory for PDF exports');
    }

    // Read-only is MANDATORY
    if (options.readOnly !== true) {
        errors.push('PDF must be read-only (no form fields or scripts)');
    }

    // Metadata is required
    if (!options.metadata) {
        errors.push('PDF metadata is required for traceability');
    } else {
        if (!options.metadata.sessionId) {
            errors.push('PDF metadata must include sessionId');
        }
        if (!options.metadata.generatedAt) {
            errors.push('PDF metadata must include generatedAt timestamp');
        }
        if (!options.metadata.expiresAt) {
            errors.push('PDF metadata must include expiresAt timestamp');
        }
        if (options.metadata.license !== 'ANALYTICAL_USE_ONLY') {
            errors.push('PDF metadata license must be ANALYTICAL_USE_ONLY');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates if CSV export is attempted (should always fail).
 */
export function validateCSVExport(): ExportValidationResult {
    return {
        isValid: false,
        errors: ['CSV export is forbidden. Use JSON export with strict validation instead.']
    };
}

/**
 * Validates if API/webhook export is attempted (should always fail).
 */
export function validateAPIExport(): ExportValidationResult {
    return {
        isValid: false,
        errors: ['API/webhook export is forbidden. Users must manually export through the UI.']
    };
}

/**
 * Validates mobile share options.
 */
export function validateMobileShareOptions(
    options: Partial<MobileShareOptions>
): ExportValidationResult {
    const errors: string[] = [];

    // Watermark is MANDATORY
    if (options.includeWatermark !== true) {
        errors.push('Watermark is mandatory for mobile sharing');
    }

    // Disclaimer is MANDATORY
    if (options.includeDisclaimer !== true) {
        errors.push('Disclaimer is mandatory for mobile sharing');
    }

    // Quality must not exceed 0.85 to prevent OCR abuse
    if (options.quality && options.quality > 0.85) {
        errors.push('Share quality cannot exceed 0.85 to prevent automated parsing');
    }

    // Check platform
    if (options.platform && !['ios', 'android'].includes(options.platform)) {
        errors.push('Invalid platform. Only iOS and Android are supported');
    }

    // Check format
    if (options.format && !['png', 'webp'].includes(options.format)) {
        errors.push('Invalid format. Only PNG and WebP are allowed for mobile sharing');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates browser extension share options.
 */
export function validateBrowserExtensionShareOptions(
    options: Partial<BrowserExtensionShareOptions>
): ExportValidationResult {
    const errors: string[] = [];

    // Watermark is MANDATORY
    if (options.includeWatermark !== true) {
        errors.push('Watermark is mandatory for browser extension sharing');
    }

    // Disclaimer is MANDATORY
    if (options.includeDisclaimer !== true) {
        errors.push('Disclaimer is mandatory for browser extension sharing');
    }

    // Quality must not exceed 0.85 to prevent OCR abuse
    if (options.quality && options.quality > 0.85) {
        errors.push('Share quality cannot exceed 0.85 to prevent automated parsing');
    }

    // Check browser
    if (options.browser && !['chrome', 'firefox', 'edge', 'safari'].includes(options.browser)) {
        errors.push('Invalid browser. Only Chrome, Firefox, Edge, and Safari are supported');
    }

    // Check format
    if (options.format && !['png', 'webp'].includes(options.format)) {
        errors.push('Invalid format. Only PNG and WebP are allowed for extension sharing');
    }

    // Check share method
    if (options.shareMethod && !['download', 'clipboard', 'native-share'].includes(options.shareMethod)) {
        errors.push('Invalid share method. Only download, clipboard, and native-share are allowed');
    }

    // Extension version is required for audit tracking
    if (!options.extensionVersion) {
        errors.push('Extension version is required for audit tracking');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates desktop app share options.
 */
export function validateDesktopAppShareOptions(
    options: Partial<DesktopAppShareOptions>
): ExportValidationResult {
    const errors: string[] = [];

    // Watermark is MANDATORY
    if (options.includeWatermark !== true) {
        errors.push('Watermark is mandatory for desktop app sharing');
    }

    // Disclaimer is MANDATORY
    if (options.includeDisclaimer !== true) {
        errors.push('Disclaimer is mandatory for desktop app sharing');
    }

    // Quality must not exceed 0.85 to prevent OCR abuse
    if (options.quality && options.quality > 0.85) {
        errors.push('Share quality cannot exceed 0.85 to prevent automated parsing');
    }

    // Check platform
    if (options.platform && !['windows', 'macos', 'linux'].includes(options.platform)) {
        errors.push('Invalid platform. Only Windows, macOS, and Linux are supported');
    }

    // Check format
    if (options.format && !['png', 'webp'].includes(options.format)) {
        errors.push('Invalid format. Only PNG and WebP are allowed for desktop sharing');
    }

    // Check share method
    if (options.shareMethod && !['save-file', 'clipboard', 'native-share'].includes(options.shareMethod)) {
        errors.push('Invalid share method. Only save-file, clipboard, and native-share are allowed');
    }

    // App version is required for audit tracking
    if (!options.appVersion) {
        errors.push('App version is required for audit tracking');
    }

    // Electron version is required for security tracking
    if (!options.electronVersion) {
        errors.push('Electron version is required for security tracking');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}



/**
 * Creates a share link with expiration.
 */
export function createShareLink(
    signalIds: string[],
    sessionId: string
): ShareLink | ExportValidationResult {
    const errors: string[] = [];

    // Validate signal count
    if (signalIds.length === 0) {
        errors.push('No signals to share');
    }

    if (signalIds.length > 5) {
        errors.push('Maximum 5 signals per share link');
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    return {
        id: generateShareLinkId(),
        sessionId,
        createdAt: now,
        expiresAt,
        signalIds,
        viewCount: 0,
        maxViews: 10,
    };
}

/**
 * Validates if a share link is still valid.
 */
export function validateShareLink(link: ShareLink): ExportValidationResult {
    const errors: string[] = [];
    const now = Date.now();

    // Check expiration
    if (now > link.expiresAt) {
        errors.push('Share link has expired (24 hour limit)');
    }

    // Check view count
    if (link.viewCount >= link.maxViews) {
        errors.push('Share link has reached maximum view count');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Creates an audit log entry for export/share actions.
 */
export function createAuditLog(
    sessionId: string,
    userId: string,
    action: ExportAuditLog['action'],
    signalIds: string[],
    additionalData?: {
        format?: string;
        recipientEmail?: string;
        shareLink?: string;
    }
): ExportAuditLog {
    return {
        id: generateAuditLogId(),
        sessionId,
        userId,
        action,
        timestamp: Date.now(),
        signalIds,
        format: additionalData?.format,
        recipientEmail: additionalData?.recipientEmail,
        shareLink: additionalData?.shareLink,
        ipAddress: getClientIP(),
        userAgent: getClientUserAgent(),
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateShareLinkId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateAuditLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(): string {
    // In a real implementation, this would extract the client IP from the request
    // For now, return a placeholder
    return 'PLACEHOLDER_IP';
}

function getClientUserAgent(): string {
    // In a real implementation, this would extract the user agent from the request
    // For now, return a placeholder
    if (typeof navigator !== 'undefined') {
        return navigator.userAgent;
    }
    return 'PLACEHOLDER_USER_AGENT';
}
