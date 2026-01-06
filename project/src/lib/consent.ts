export type CookieConsent = {
    essential: boolean;
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
};

export type ConsentData = {
    version: number;
    updatedAt: string;
    consent: CookieConsent;
};

const STORAGE_KEY = 'forg3t_cookie_consent_v1';
const CURRENT_VERSION = 1;

export const DEFAULT_CONSENT: CookieConsent = {
    essential: true,
    analytics: false,
    functional: false,
    marketing: false,
};

export const FULL_CONSENT: CookieConsent = {
    essential: true,
    analytics: true,
    functional: true,
    marketing: true,
};

export const getConsent = (): CookieConsent => {
    if (typeof window === 'undefined') return DEFAULT_CONSENT;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_CONSENT;

        const data: ConsentData = JSON.parse(stored);

        // Validate version and structure
        if (data.version !== CURRENT_VERSION || !data.consent) {
            return DEFAULT_CONSENT;
        }

        // Ensure essential is always true
        return {
            ...data.consent,
            essential: true
        };
    } catch (e) {
        return DEFAULT_CONSENT;
    }
};

export const setConsent = (consent: CookieConsent) => {
    const data: ConsentData = {
        version: CURRENT_VERSION,
        updatedAt: new Date().toISOString(),
        consent: {
            ...consent,
            essential: true, // Safety check
        },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    if (import.meta.env.DEV) {
        console.log('cookie consent updated', data);
    }

    applyConsent(data.consent);
};

export const hasConsentStored = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;
        const data = JSON.parse(stored);
        return data.version === CURRENT_VERSION && !!data.consent;
    } catch {
        return false;
    }
};

export const applyConsent = (consent: CookieConsent) => {
    /**
     * PRODUCTION READY TRACKER INITIALIZATION
     * 
     * Implement the actual tracker initialization logic here.
     * This ensures all trackers are managed in a single place.
     */

    // Analytics: Google Analytics, Mixpanel, Fathom, etc.
    if (consent.analytics) {
        // Example: window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
        // Or: if (!window.ga) initGA();
    } else {
        // Example: window.gtag('consent', 'update', { 'analytics_storage': 'denied' });
        // Or: Remove GA scripts/cookies if they exist
    }

    // Marketing: Facebook Pixel, LinkedIn Insight, etc.
    if (consent.marketing) {
        // Example: window.fbq('consent', 'grant');
    } else {
        // Example: window.fbq('consent', 'revoke');
    }

    // Functional: Customer support chat (Crisp, Intercom), personalization, etc.
    if (consent.functional) {
        // Example: if (window.$crisp) window.$crisp.push(['do', 'chat:show']);
    } else {
        // Example: if (window.$crisp) window.$crisp.push(['do', 'chat:hide']);
    }

    // Auditing: Always true for essential. No need to check.
};
