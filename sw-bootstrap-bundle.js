// ============================================================================
// sw-bootstrap-bundle.js — Path D vanilla-JS bootstrap for ScienceWorks tracking
// ============================================================================
// Ported from the 7 Velo source files under
// phase3-artifacts/velo-source-backup-2026-04-23/ after the Velo code-commit
// pipeline failed at the Wix platform level (see PHASE3-HANDOFF-PATH-D).
//
// Installation:
//   Wix dashboard -> Custom Code -> Add New Code
//   Scope:     Main domain only (NOT dashboard, NOT editor)
//   Placement: HEAD (load order: BEFORE the GTM snippet)
//   Tag type:  Essential
//
// This file must load before the GTM snippet so that sw_page_context reaches
// window.dataLayer before GTM evaluates its first trigger.
//
// Exports (on window):
//   window.sw_push(eventName, params)   — canonical dataLayer push
//   window.__sw_context                 — current page/session envelope
//   window.__sw_bootstrap_loaded        — true once the IIFE has executed
//
// SPA nav: patches history.pushState + listens for popstate so sw_page_context
// re-fires on Wix in-site nav without a full page reload.
// ============================================================================

(function () {
    'use strict';

    // Double-load guard — if the script is embedded twice (e.g., HEAD + BODY
    // by accident), second pass bails cleanly.
    if (window.__sw_bootstrap_loaded) return;
    window.__sw_bootstrap_loaded = true;

    // Ensure dataLayer exists before ANY code in this bundle touches it.
    // GTM's snippet does the same check, so order-independence is preserved.
    window.dataLayer = window.dataLayer || [];


    // ====== sw-taxonomies ======
// ============================================================================
// sw-taxonomies.js — Lookup tables for service/clinician/assessment dimensions
// ============================================================================
// These are the site-canonical mappings from URL path → dimension values.
// Updating these here (and republishing Velo) is a one-place change that
// propagates to every event tag via dataLayer.
//
// Paired with the GTM container's lookup tables — keep both in sync if you add
// a new service page, clinician, or assessment tool.
// ============================================================================

// --------------------------------------------------------------------------
// Service pages — homepage tiles + condition hubs
// --------------------------------------------------------------------------
// URL path (lowercased, no trailing slash) → { service_name, service_category }
// service_name is the event-level dimension (granular, per-page).
// service_category rolls multiple service_names up to a user-level segment.
const SERVICE_BY_PATH = {
    '/psychological-assessments': {
        service_name: 'psychological_assessments',
        service_category: 'assessment',
        rolls_up_to: 'assessment_clinical_diagnostics'
    },
    '/specialized-therapy': {
        service_name: 'specialized_therapy',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults'
    },
    '/executive-function-coaching': {
        service_name: 'executive_function_coaching',
        service_category: 'coaching',
        rolls_up_to: 'coaching_neurodivergent_adults'
    },
    '/mental-health-screening': {
        service_name: 'mental_health_screening',
        service_category: 'screening',
        rolls_up_to: 'assessment_tools_only'
    },
    // Condition-specific hubs — tracked as distinct service_name but roll up
    // to therapy_individual_adults at the user level.
    '/ocd': {
        service_name: 'service_ocd_condition_hub',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults'
    },
    '/trauma': {
        service_name: 'service_trauma_condition_hub',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults'
    },
    '/insomnia': {
        service_name: 'service_insomnia_condition_hub',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults'
    },
    '/medication-management': {
        service_name: 'service_medication_management',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults'
    },
    '/groups': {
        service_name: 'service_groups',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults'
    }
};

// --------------------------------------------------------------------------
// Clinician profile pages
// --------------------------------------------------------------------------
const CLINICIAN_BY_PATH = {
    '/kiesakelly': {
        clinician_name: 'kiesa_kelly',
        clinician_role: 'psychologist',
        clinician_specialty_primary: 'clinical_psychology'
    },
    '/laura-travers-heinig': {
        clinician_name: 'laura_travers_heinig',
        clinician_role: 'therapist',
        clinician_specialty_primary: 'womens_health'
    },
    '/catherinecavin': {
        clinician_name: 'catherine_cavin',
        clinician_role: 'therapist',
        clinician_specialty_primary: 'adhd_autism'
    },
    '/kathryn-wood': {
        clinician_name: 'kathryn_wood',
        clinician_role: 'therapist',
        clinician_specialty_primary: 'trauma'
    },
    '/ryan-robertson': {
        clinician_name: 'ryan_robertson',
        clinician_role: 'coach',
        clinician_specialty_primary: 'executive_function'
    }
};

// --------------------------------------------------------------------------
// Assessment-tool landing pages
// --------------------------------------------------------------------------
const ASSESSMENT_BY_PATH = {
    '/y-bocs': {
        assessment_name: 'y_bocs',
        assessment_category: 'ocd',
        assessment_age_range: 'adult',
        assessment_self_scoring: true
    },
    '/asrs': {
        assessment_name: 'asrs',
        assessment_category: 'adhd',
        assessment_age_range: 'adult',
        assessment_self_scoring: true
    },
    '/aq-10': {
        assessment_name: 'aq_10',
        assessment_category: 'autism',
        assessment_age_range: 'adult',
        assessment_self_scoring: true
    },
    '/esq-r': {
        assessment_name: 'esq_r',
        assessment_category: 'executive_function',
        assessment_age_range: 'adult',
        assessment_self_scoring: true
    },
    '/phq-9': {
        assessment_name: 'phq_9',
        assessment_category: 'depression',
        assessment_age_range: 'adult',
        assessment_self_scoring: true
    },
    '/gad-7': {
        assessment_name: 'gad_7',
        assessment_category: 'anxiety',
        assessment_age_range: 'adult',
        assessment_self_scoring: true
    }
};

// --------------------------------------------------------------------------
// Form name catalog — canonical names used across generate_lead + form_start
// + form_abandonment events
// --------------------------------------------------------------------------
// Keys are the Wix Forms widget UUID (strip the `form-` prefix from the
// container's DOM id). Values are the canonical form_name used across
// form_start / form_abandonment / generate_lead events.
// Populated in Phase 3.3 from a live crawl of scienceworkshealth.com.
const FORM_NAME_BY_ID = {
    // ---- Shared contact page (/contact) + reuse on sub-pages -----------
    '34f61b44-208c-45bd-a3f3-d60372ff9578': 'therapy_consultation',    // /contact, /specialized-therapy, /ocd, /trauma, /insomnia
    '08c9228f-3c88-403e-be5f-f337849d2494': 'booking_kiesa',           // /contact, /psychological-assessments (Wix Bookings widget)
    '2195f02f-e8b3-44d9-a063-9a741cba6261': 'contact_general',         // /contact, /medication-management

    // ---- Clinician-specific "Question" forms ---------------------------
    '3cf5fa46-d0f2-4764-b4b1-eaa2bf274482': 'question_kiesa',          // /kiesakelly, /psychological-assessments
    'e522454a-a18f-40e6-a532-aebe5daed5ea': 'question_laura',          // /laura-travers-heinig
    'd0a38253-f880-402f-8487-ee52282b757d': 'question_catherine',      // /catherinecavin
    'e9ea2c38-cdb6-4fe9-a3c3-6cc8d7c1d39b': 'question_kathryn',        // /kathryn-wood
    '585c11e1-70a3-43f9-9ad2-094ad71c6793': 'question_ryan_robertson', // /ryan-robertson
    'dfe4f28d-84a1-450e-a128-7a6edbf08bf6': 'question_shane',          // /executive-function-coaching (Shane, EF coach)

    // ---- Condition-hub-specific contact forms --------------------------
    'f763b0f8-7a7a-41d7-9b53-20e255b7fb54': 'contact_ocd',             // /ocd
    '05ac8c0a-a579-4fe0-b510-9011052bcfb7': 'contact_trauma',          // /trauma
    '36f23520-c3fe-461a-bd0c-9d5b82365265': 'contact_insomnia',        // /insomnia
    'cf278b73-b8a3-4a13-a9c2-84c2d951076f': 'contact_groups',          // /groups (primary)
    'eaac169f-1e15-4f73-992a-5c0bbfaa6f11': 'contact_groups_secondary',// /groups (second form — verify intent)

    // ---- Careers -------------------------------------------------------
    '8b77cff6-da02-4f58-8ac4-dfaf47625958': 'careers'                  // /careers
};

// Canonical form_name values, with form_type classification.
// form_type: consult | booking | inquiry | clinician_contact | careers | other
// lead_value_estimate is used as the GA4 event `value` for generate_lead so
// GA4 conversion reports show a dollar-weighted ranking instead of raw counts.
const FORM_META = {
    // Consult + booking — highest intent
    therapy_consultation:      { form_type: 'consult',           lead_value_estimate: 250 },
    booking_kiesa:             { form_type: 'booking',           lead_value_estimate: 250 },

    // General / condition inquiries
    contact_general:           { form_type: 'inquiry',           lead_value_estimate: 200 },
    contact_ocd:               { form_type: 'inquiry',           lead_value_estimate: 200 },
    contact_trauma:            { form_type: 'inquiry',           lead_value_estimate: 200 },
    contact_insomnia:          { form_type: 'inquiry',           lead_value_estimate: 200 },
    contact_groups:            { form_type: 'inquiry',           lead_value_estimate: 200 },
    contact_groups_secondary:  { form_type: 'inquiry',           lead_value_estimate: 200 },

    // Clinician-specific "Question" forms
    question_kiesa:            { form_type: 'clinician_contact', lead_value_estimate: 250 },
    question_laura:            { form_type: 'clinician_contact', lead_value_estimate: 250 },
    question_catherine:        { form_type: 'clinician_contact', lead_value_estimate: 250 },
    question_kathryn:          { form_type: 'clinician_contact', lead_value_estimate: 250 },
    question_ryan_robertson:   { form_type: 'clinician_contact', lead_value_estimate: 250 },
    question_shane:            { form_type: 'clinician_contact', lead_value_estimate: 250 },

    // Careers + catch-all
    careers:                   { form_type: 'careers',           lead_value_estimate: 0   },
    unknown_form:              { form_type: 'other',             lead_value_estimate: 0   }
};

// --------------------------------------------------------------------------
// Phone number registry — maps raw tel: numbers to phone_type values
// --------------------------------------------------------------------------
// As of 2026-04 site crawl: only the main number exists. Additions go here.
const PHONE_TYPE_BY_RAW = {
    '+19312231095': 'main',
    '9312231095':   'main',
    '931-223-1095': 'main',
    '(931) 223-1095': 'main'
};

const PHONE_TYPE_DEFAULT = 'other';

// --------------------------------------------------------------------------
// Email classifier — maps email addresses (lowercased) to email_type values
// --------------------------------------------------------------------------
// email_type: general_inbox | clinical_inbox | billing | careers | ryan_personal | other
// Extend as additional inboxes are surfaced.
const EMAIL_TYPE_BY_ADDRESS = {
    // 'info@scienceworkshealth.com': 'general_inbox',
    // 'contact@scienceworkshealth.com': 'general_inbox',
    // 'kiesa@scienceworkshealth.com': 'clinical_inbox',
    // 'careers@scienceworkshealth.com': 'careers',
    // 'billing@scienceworkshealth.com': 'billing'
};

const EMAIL_TYPE_DEFAULT = 'other';

// --------------------------------------------------------------------------
// Canonical lists — for validation, scoring winner calculations, and
// surfacing "unassigned" when nothing matches
// --------------------------------------------------------------------------
const TOPIC_CLUSTERS = [
    'adhd', 'autism', 'audhd', 'ocd', 'anxiety', 'depression',
    'trauma_ptsd', 'insomnia_sleep', 'chronic_illness', 'substance_use',
    'couples_relationship_issues', 'family_parenting_dynamics',
    'executive_function', 'health_psychology',
    'perimenopause_neurodivergence', 'screener_interpretation',
    'professional_audience', 'unassigned'
];

const SERVICE_INTERESTS = [
    'therapy_individual_adults', 'therapy_individual_teens',
    'therapy_couples', 'therapy_family', 'therapy_parent_management_training',
    'assessment_adhd', 'assessment_autism', 'assessment_clinical_diagnostics',
    'coaching_neurodivergent_adults', 'coaching_neurodivergent_couples', 'coaching_neurodivergent_parents',
    'integrated_care_multiple_services', 'assessment_tools_only', 'clinician_browsing',
    'unassigned'
];

const MODALITIES = [
    'erp', 'icbt',
    'cbt', 'dbt', 'act', 'neurocounseling',
    'emdr', 'cpt',
    'cbt_i', 'cbt_cp',
    'motivational_interviewing',
    'gottman_method', 'family_systems_therapy', 'parent_management_training',
    'ifs', 'somatic_therapy', 'emotion_focused_therapy',
    'multiple_modalities', 'unassigned'
];

    // ====== sw-tracking ======
// ============================================================================
// sw-tracking.js — Core primitives for ScienceWorks event tracking
// ============================================================================
// Every other sw-*.js module and every page's Velo code uses helpers from
// here. If this file's API changes, downstream pages must be updated.
//
// Contract:
//   - sw_push(eventName, params) is the only sanctioned way to push to
//     window.dataLayer. Don't call dataLayer.push() directly from page code.
//   - sw_push always adds a page/session/user context envelope so every
//     event ships the full context without per-event repetition.
//   - Pure helpers (getPageType, getUtmParams, etc.) don't touch dataLayer —
//     they're called by masterPage.js during bootstrap.
// ============================================================================

// ----- Page-type classifier ------------------------------------------------
// Returns one of: homepage | blog_post | service | clinician |
//                 assessment_tool | contact | careers | other
function getPageType(pathname) {
    const p = (pathname || '').toLowerCase().replace(/\/$/, '') || '/';
    if (p === '/' || p === '') return 'homepage';
    if (p.startsWith('/post/')) return 'blog_post';
    if (p === '/contact') return 'contact';
    if (p === '/careers') return 'careers';
    if (SERVICE_BY_PATH[p]) return 'service';
    if (CLINICIAN_BY_PATH[p]) return 'clinician';
    if (ASSESSMENT_BY_PATH[p]) return 'assessment_tool';
    return 'other';
}

// ----- URL parameter helpers ----------------------------------------------
function getUtmParams(search) {
    const qs = search || (typeof window !== 'undefined' ? window.location.search : '');
    if (!qs) return {};
    const params = new URLSearchParams(qs);
    const out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
        const v = params.get(k);
        if (v) out[k] = v;
    });
    return out;
}

// ----- Device classification ----------------------------------------------
// desktop | tablet | mobile
// User-agent sniffing is brittle but matches GA4's own client classification.
// This echoes GA4's device_category so reports line up.
function getDeviceClass(userAgent) {
    const ua = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '').toLowerCase();
    if (/ipad|tablet|android(?!.*mobile)|kindle|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
    return 'desktop';
}

// ----- Traffic-source classifier ------------------------------------------
// Derives a simplified first-touch channel from referrer + UTM params.
// Returns: organic | paid_search | paid_social | organic_social | email |
//          referral | direct | other
function getTrafficSource(referrer, utm) {
    const r = (referrer || '').toLowerCase();
    const src = (utm && utm.utm_source || '').toLowerCase();
    const med = (utm && utm.utm_medium || '').toLowerCase();

    // UTM-driven classifications (explicit beats inferred)
    if (med === 'cpc' || med === 'paid' || med === 'ppc' || med === 'paid_search') return 'paid_search';
    if (med === 'paid_social' || med === 'social_paid' || med === 'social-paid') return 'paid_social';
    if (med === 'email') return 'email';
    if (med === 'organic') return 'organic';
    if (med === 'referral') return 'referral';
    if (med === 'social' || med === 'organic_social') return 'organic_social';

    // Referrer-driven classifications
    if (!r) return 'direct';
    if (/google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|qwant\./.test(r)) return 'organic';
    if (/facebook\.|instagram\.|linkedin\.|twitter\.|t\.co|tiktok\.|pinterest\.|reddit\./.test(r)) return 'organic_social';
    if (/mail\.google\.|outlook\.|yahoomail\.|protonmail\./.test(r)) return 'email';
    // Self-referral (same-domain) collapses to direct
    try {
        const refHost = new URL(r).hostname.toLowerCase();
        const pageHost = (typeof window !== 'undefined' && window.location.hostname || '').toLowerCase();
        if (refHost && pageHost && refHost.endsWith(pageHost)) return 'direct';
    } catch (e) { /* ignore malformed referrer */ }

    return 'referral';
}

// ----- Referrer-domain extractor ------------------------------------------
function getReferrerDomain(referrer) {
    if (!referrer) return '';
    try { return new URL(referrer).hostname.toLowerCase(); }
    catch (e) { return ''; }
}

// ----- Entry method classifier (used for view_service / _blog_post / etc.) -
// direct | organic_search | paid_social | internal_navigation | email | referral | other
function getEntryMethod(referrer, utm) {
    // If we're inside a session (pushed from session state, not first hit)
    // the caller passes a prior-page flag — see sw-session.js
    const src = getTrafficSource(referrer, utm);
    if (src === 'organic') return 'organic_search';
    if (src === 'paid_search') return 'paid_search';
    if (src === 'paid_social') return 'paid_social';
    if (src === 'email') return 'email';
    if (src === 'referral') return 'referral';
    if (src === 'direct') return 'direct';
    return 'other';
}

// ----- dataLayer push wrapper ---------------------------------------------
// The ONLY sanctioned path for ScienceWorks code to push into dataLayer.
// Adds the standard context envelope to every push so GTM's triggers and
// the Google Tag's user-property reads always see the same shape.
//
// The envelope is populated by masterPage.js on page load and held in
// window.__sw_context. sw_push reads from it on every call so late pushes
// (e.g., form submit 5 minutes after page load) still carry fresh context.
function sw_push(eventName, params) {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];

    const ctx = window.__sw_context || {};
    const payload = Object.assign(
        { event: eventName, _sw_schema_version: 1 },
        ctx,
        params || {}
    );

    // Stamp a sequence number + epoch so late-arriving events can be ordered
    // in BigQuery export if needed.
    window.__sw_seq = (window.__sw_seq || 0) + 1;
    payload._sw_event_seq = window.__sw_seq;
    payload._sw_event_ts_ms = Date.now();

    window.dataLayer.push(payload);
}

// ----- Safe localStorage / sessionStorage shims ---------------------------
// Both reads and writes can throw in private-browsing modes and cross-origin
// iframe contexts. These helpers swallow errors and return sensible
// fallbacks so the tracking code never crashes the page.
function safeGetLocal(key, fallback) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return fallback;
        const v = window.localStorage.getItem(key);
        return v == null ? fallback : v;
    } catch (e) { return fallback; }
}

function safeSetLocal(key, value) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        window.localStorage.setItem(key, value);
        return true;
    } catch (e) { return false; }
}

function safeGetSession(key, fallback) {
    try {
        if (typeof window === 'undefined' || !window.sessionStorage) return fallback;
        const v = window.sessionStorage.getItem(key);
        return v == null ? fallback : v;
    } catch (e) { return fallback; }
}

function safeSetSession(key, value) {
    try {
        if (typeof window === 'undefined' || !window.sessionStorage) return false;
        window.sessionStorage.setItem(key, value);
        return true;
    } catch (e) { return false; }
}

// ----- JSON-safe storage shims --------------------------------------------
function readJSON(store, key, fallback) {
    const raw = store === 'local' ? safeGetLocal(key, null) : safeGetSession(key, null);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); }
    catch (e) { return fallback; }
}

function writeJSON(store, key, value) {
    const raw = JSON.stringify(value);
    return store === 'local' ? safeSetLocal(key, raw) : safeSetSession(key, raw);
}

    // ====== sw-first-touch ======
// ============================================================================
// sw-first-touch.js — First-touch attribution (frozen on first visit)
// ============================================================================
// Captures the 11 "first_*" user-scoped attributes on the very first session,
// then freezes them forever (absent localStorage wipe or device change). These
// are the dimensions that answer "how did this user originally find us" in
// GA4 attribution reports.
//
// All write-once: once a value is in localStorage under its first_* key,
// subsequent calls to maybeSet are no-ops. getAll reads what's there.
//
// Lightweight note: three of these (first_blog_post_viewed, first_service_viewed,
// first_clinician_viewed) get written by page-specific view events in later
// phases, not by masterPage bootstrap — they need to know what page the user
// actually landed on, which we only know once that page's code runs.
// ============================================================================

const LS_KEYS = {
    first_traffic_source:    'sw_ft_traffic_source',
    first_utm_source:        'sw_ft_utm_source',
    first_utm_medium:        'sw_ft_utm_medium',
    first_utm_campaign:      'sw_ft_utm_campaign',
    first_landing_page:      'sw_ft_landing_page',
    first_referrer_domain:   'sw_ft_referrer_domain',
    first_device_class:      'sw_ft_device_class',
    first_blog_post_viewed:  'sw_ft_blog_post_viewed',
    first_service_viewed:    'sw_ft_service_viewed',
    first_clinician_viewed:  'sw_ft_clinician_viewed'
};

// ----- Called once by masterPage.js on the very first session --------------
// Sets the first 7 attributes. The three page-specific ones get set later by
// their respective view events (see maybeSetFirstBlogPost, etc.).
function maybeSetFirstTouchBootstrap(pathname, referrer, utm, userAgent) {
    // If any first_* key already exists, bail entirely. The user has been
    // here before; we don't overwrite their first-touch trail.
    if (safeGetLocal(LS_KEYS.first_traffic_source, null) != null) return;

    const utmObj = utm || {};
    const trafficSource = getTrafficSource(referrer, utmObj);
    const referrerDomain = getReferrerDomain(referrer);
    const deviceClass = getDeviceClass(userAgent);

    safeSetLocal(LS_KEYS.first_traffic_source,  trafficSource);
    safeSetLocal(LS_KEYS.first_utm_source,      utmObj.utm_source   || '');
    safeSetLocal(LS_KEYS.first_utm_medium,      utmObj.utm_medium   || '');
    safeSetLocal(LS_KEYS.first_utm_campaign,    utmObj.utm_campaign || '');
    safeSetLocal(LS_KEYS.first_landing_page,    pathname || '/');
    safeSetLocal(LS_KEYS.first_referrer_domain, referrerDomain || '');
    safeSetLocal(LS_KEYS.first_device_class,    deviceClass);
}

// ----- Page-specific first-touch setters (idempotent) ----------------------
function maybeSetFirstBlogPost(postTitle) {
    if (!postTitle) return;
    if (safeGetLocal(LS_KEYS.first_blog_post_viewed, null) != null) return;
    safeSetLocal(LS_KEYS.first_blog_post_viewed, String(postTitle));
}

function maybeSetFirstService(serviceName) {
    if (!serviceName) return;
    if (safeGetLocal(LS_KEYS.first_service_viewed, null) != null) return;
    safeSetLocal(LS_KEYS.first_service_viewed, String(serviceName));
}

function maybeSetFirstClinician(clinicianName) {
    if (!clinicianName) return;
    if (safeGetLocal(LS_KEYS.first_clinician_viewed, null) != null) return;
    safeSetLocal(LS_KEYS.first_clinician_viewed, String(clinicianName));
}

// ----- Read-all for dataLayer push ----------------------------------------
function getAllFirstTouchAttrs() {
    return {
        first_traffic_source:    safeGetLocal(LS_KEYS.first_traffic_source, ''),
        first_utm_source:        safeGetLocal(LS_KEYS.first_utm_source, ''),
        first_utm_medium:        safeGetLocal(LS_KEYS.first_utm_medium, ''),
        first_utm_campaign:      safeGetLocal(LS_KEYS.first_utm_campaign, ''),
        first_landing_page:      safeGetLocal(LS_KEYS.first_landing_page, ''),
        first_referrer_domain:   safeGetLocal(LS_KEYS.first_referrer_domain, ''),
        first_device_class:      safeGetLocal(LS_KEYS.first_device_class, ''),
        first_blog_post_viewed:  safeGetLocal(LS_KEYS.first_blog_post_viewed, ''),
        first_service_viewed:    safeGetLocal(LS_KEYS.first_service_viewed, ''),
        first_clinician_viewed:  safeGetLocal(LS_KEYS.first_clinician_viewed, '')
    };
}

    // ====== sw-session ======
// ============================================================================
// sw-session.js — Session state management
// ============================================================================
// Tracks session_number, is_new_user, entry_method, session_start_ts, and
// page sequence within a session. Uses sessionStorage (tab-scoped) + a small
// localStorage key to bridge across sessions for visit counting.
//
// GA4 uses a 30-minute inactivity timeout to define a session boundary;
// this module does the same so our numbers line up with GA4's internal model.
//
// This module does NOT push to dataLayer. It provides pure getters; the
// bootstrap in masterPage.js reads and pushes.
// ============================================================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;       // 30 min GA4 convention
const LS_KEY_VISIT_COUNT = 'sw_visit_count';      // number of distinct sessions ever
const LS_KEY_LAST_VISIT_MS = 'sw_last_visit_ms';  // timestamp of last activity

const SS_KEY_SESSION_ID = 'sw_session_id';
const SS_KEY_SESSION_NUMBER = 'sw_session_number';
const SS_KEY_SESSION_START_MS = 'sw_session_start_ms';
const SS_KEY_SESSION_ENTRY_METHOD = 'sw_session_entry_method';
const SS_KEY_SESSION_ENTRY_PAGE = 'sw_session_entry_page';
const SS_KEY_SESSION_PAGE_COUNT = 'sw_session_page_count';
const SS_KEY_IS_NEW_USER = 'sw_is_new_user';

// ----- Build / fetch the session context on every page load ---------------
// Called once by masterPage.js on page ready. Returns a plain object.
function initSessionContext(pathname, referrer, utm) {
    const now = Date.now();
    const lastVisitMs = parseInt(safeGetLocal(LS_KEY_LAST_VISIT_MS, '0'), 10) || 0;
    const existingSessionId = safeGetSession(SS_KEY_SESSION_ID, null);

    let isNewSession = false;
    let isNewUser = false;

    // A session is "new" if:
    //   (a) no session_id in sessionStorage (tab just opened), OR
    //   (b) 30+ minutes have elapsed since last activity (GA4 convention),
    //       even if the tab stayed open.
    if (!existingSessionId) isNewSession = true;
    if (lastVisitMs > 0 && (now - lastVisitMs) > SESSION_TIMEOUT_MS) isNewSession = true;

    if (isNewSession) {
        // Increment visit count (the session_number in our taxonomy)
        const prevVisitCount = parseInt(safeGetLocal(LS_KEY_VISIT_COUNT, '0'), 10) || 0;
        const newVisitCount = prevVisitCount + 1;
        isNewUser = prevVisitCount === 0;   // zero prior sessions = truly first-time user

        const newSessionId = `s_${now}_${Math.random().toString(36).slice(2, 10)}`;
        const entryMethod = getEntryMethod(referrer, utm);

        safeSetLocal(LS_KEY_VISIT_COUNT, String(newVisitCount));
        safeSetSession(SS_KEY_SESSION_ID, newSessionId);
        safeSetSession(SS_KEY_SESSION_NUMBER, String(newVisitCount));
        safeSetSession(SS_KEY_SESSION_START_MS, String(now));
        safeSetSession(SS_KEY_SESSION_ENTRY_METHOD, entryMethod);
        safeSetSession(SS_KEY_SESSION_ENTRY_PAGE, pathname || '/');
        safeSetSession(SS_KEY_SESSION_PAGE_COUNT, '1');
        safeSetSession(SS_KEY_IS_NEW_USER, isNewUser ? 'true' : 'false');
    } else {
        // Continuing a session — increment page count
        const pageCount = (parseInt(safeGetSession(SS_KEY_SESSION_PAGE_COUNT, '0'), 10) || 0) + 1;
        safeSetSession(SS_KEY_SESSION_PAGE_COUNT, String(pageCount));
        isNewUser = safeGetSession(SS_KEY_IS_NEW_USER, 'false') === 'true';
    }

    // Touch the last-visit timestamp regardless — used for timeout detection
    safeSetLocal(LS_KEY_LAST_VISIT_MS, String(now));

    return {
        session_id: safeGetSession(SS_KEY_SESSION_ID, ''),
        session_number: parseInt(safeGetSession(SS_KEY_SESSION_NUMBER, '1'), 10) || 1,
        is_new_user: isNewUser,
        is_new_session: isNewSession,
        session_start_ts_ms: parseInt(safeGetSession(SS_KEY_SESSION_START_MS, String(now)), 10) || now,
        entry_method: safeGetSession(SS_KEY_SESSION_ENTRY_METHOD, 'direct'),
        entry_page: safeGetSession(SS_KEY_SESSION_ENTRY_PAGE, pathname || '/'),
        session_page_count: parseInt(safeGetSession(SS_KEY_SESSION_PAGE_COUNT, '1'), 10) || 1
    };
}

// ----- Light helpers exposed for later-phase pushes ------------------------
function getCurrentSessionContext() {
    const now = Date.now();
    return {
        session_id: safeGetSession(SS_KEY_SESSION_ID, ''),
        session_number: parseInt(safeGetSession(SS_KEY_SESSION_NUMBER, '1'), 10) || 1,
        is_new_user: safeGetSession(SS_KEY_IS_NEW_USER, 'false') === 'true',
        session_start_ts_ms: parseInt(safeGetSession(SS_KEY_SESSION_START_MS, String(now)), 10) || now,
        entry_method: safeGetSession(SS_KEY_SESSION_ENTRY_METHOD, 'direct'),
        entry_page: safeGetSession(SS_KEY_SESSION_ENTRY_PAGE, '/'),
        session_page_count: parseInt(safeGetSession(SS_KEY_SESSION_PAGE_COUNT, '1'), 10) || 1
    };
}

// Running counters used by later phases (cta_click will read prior_cta_clicks_in_session, etc.)
// Each counter is stored under its own sessionStorage key with namespace sw_cnt_*.
function incrementSessionCounter(name) {
    const key = `sw_cnt_${name}`;
    const next = (parseInt(safeGetSession(key, '0'), 10) || 0) + 1;
    safeSetSession(key, String(next));
    return next;
}

function getSessionCounter(name) {
    const key = `sw_cnt_${name}`;
    return parseInt(safeGetSession(key, '0'), 10) || 0;
}
    // ====== sw-post-tagging ======
// ============================================================================
// sw-post-tagging.js — Heuristic blog-post classifier
// ============================================================================
// Maps a blog-post URL slug (and optional title) to its primary_topic_cluster
// value. Rules are evaluated top-to-bottom; first match wins. Designed to be
// cheap to extend — add a new rule to the table rather than restructuring
// the function.
//
// Invoked by view_blog_post events to score topic clusters in the scoring
// engine, and by the form_submit enrichment to tag generate_lead events
// with the originating blog post's cluster.
//
// Unmatched posts default to 'unassigned'. A monthly review of unassigned
// posts lets us add rules as content expands.
// ============================================================================

// Rules: array of { pattern: RegExp, cluster: string, requires?: RegExp }
// - `pattern` matches against (slug + ' ' + title).toLowerCase()
// - `requires`, if present, must also match (used for compound conditions)
// - First rule to match wins
const RULES = [
    // OCD-specific (ERP, ROCD, etc.) — match before generic OCD
    { pattern: /\b(erp|i-?cbt|ocd-treatment|exposure-response|r-?ocd|relationship-?ocd)\b/i, cluster: 'ocd' },

    // Perimenopause + neurodivergence overlap — more specific than either alone
    { pattern: /\b(perimenopause|menopause)\b/i, requires: /\b(adhd|autism|neurodivergen|asd)\b/i, cluster: 'perimenopause_neurodivergence' },
    { pattern: /\b(peri-?\w*-?adhd|hormones-?neurodivergent)\b/i, cluster: 'perimenopause_neurodivergence' },

    // Health psychology — women's health umbrella (no neurodivergence overlap)
    { pattern: /\b(menopause|perimenopause|pregnancy|postpartum|hormones|reproductive|womens-?health|pcos|menstrual)\b/i, cluster: 'health_psychology' },

    // AuDHD — co-occurring ADHD + autism
    { pattern: /\b(audhd|adhd-?(and-?)?autism|co-?occurring-?adhd)\b/i, cluster: 'audhd' },

    // ADHD-only
    { pattern: /\badhd\b/i, cluster: 'adhd' },

    // Autism-only
    { pattern: /\b(autism|asd|aspergers?)\b/i, cluster: 'autism' },

    // OCD (general)
    { pattern: /\bocd\b/i, cluster: 'ocd' },

    // Anxiety
    { pattern: /\b(anxiety|gad|panic|phobia)\b/i, cluster: 'anxiety' },

    // Depression
    { pattern: /\b(depression|mood|dysthymia)\b/i, cluster: 'depression' },

    // Trauma / PTSD
    { pattern: /\b(trauma|ptsd|emdr|cpt)\b/i, cluster: 'trauma_ptsd' },

    // Insomnia / sleep
    { pattern: /\b(insomnia|sleep|cbt-?i)\b/i, cluster: 'insomnia_sleep' },

    // Chronic illness / pain
    { pattern: /\b(chronic-?(illness|pain)|fibromyalgia|long-?covid|cbt-?cp)\b/i, cluster: 'chronic_illness' },

    // Substance use
    { pattern: /\b(substance-?use|addiction|motivational-?interviewing)\b/i, cluster: 'substance_use' },

    // Couples / relationships (no ROCD overlap — that hit earlier)
    { pattern: /\b(couples?|relationship|gottman)\b/i, cluster: 'couples_relationship_issues' },

    // Family / parenting
    { pattern: /\b(parenting|family-?therapy|pmt|parent-?management)\b/i, cluster: 'family_parenting_dynamics' },

    // Executive function
    { pattern: /\b(executive-?function|ef-?coaching|time-?management|working-?memory)\b/i, cluster: 'executive_function' },

    // Screener interpretation
    { pattern: /\b(screener|asrs|aq-?10|y-?bocs|abo|gad-?7|phq-?9|esq-?r)\b/i, cluster: 'screener_interpretation' }
];

// ----- Main classifier ----------------------------------------------------
// Returns one of the 18 cluster values (including 'unassigned' fallback).
function classifyPost(slug, title) {
    const haystack = ((slug || '') + ' ' + (title || '')).toLowerCase();
    if (!haystack.trim()) return 'unassigned';

    for (const rule of RULES) {
        if (rule.pattern.test(haystack)) {
            if (rule.requires && !rule.requires.test(haystack)) continue;
            return rule.cluster;
        }
    }
    return 'unassigned';
}

// ----- Funnel-stage classifier --------------------------------------------
// Rough heuristic for post_funnel_stage based on title/slug markers.
// Returns: awareness | consideration | decision
function classifyFunnelStage(slug, title) {
    const haystack = ((slug || '') + ' ' + (title || '')).toLowerCase();

    // Decision-stage markers: cost, how-to-book, what-to-expect
    if (/\b(cost|price|insurance|how-?to-?book|what-?to-?expect|first-?appointment|how-?long|intake)\b/i.test(haystack)) {
        return 'decision';
    }
    // Consideration-stage markers: comparisons, "types of," treatment guides
    if (/\b(vs\b|comparison|types-?of|treatment-?(guide|options)|choosing|best-?\w+-?for)\b/i.test(haystack)) {
        return 'consideration';
    }
    // Everything else is awareness
    return 'awareness';
}

// ----- Post category classifier (loose — mirrors Wix blog categories) ----
// Returns a short string label, used for post_category dimension when Wix
// metadata isn't available. Real category comes from the Wix blog API on
// /post/ pages; this is a fallback.
function classifyPostCategory(slug, title) {
    const cluster = classifyPost(slug, title);
    // Cluster → category mapping (categories are broader buckets)
    const map = {
        ocd: 'ocd',
        adhd: 'adhd',
        autism: 'autism',
        audhd: 'adhd_autism',
        anxiety: 'anxiety_depression',
        depression: 'anxiety_depression',
        trauma_ptsd: 'trauma',
        insomnia_sleep: 'sleep',
        chronic_illness: 'chronic_illness',
        substance_use: 'addiction',
        couples_relationship_issues: 'relationships',
        family_parenting_dynamics: 'parenting',
        executive_function: 'executive_function',
        health_psychology: 'womens_health',
        perimenopause_neurodivergence: 'womens_neurodivergence',
        screener_interpretation: 'assessments',
        professional_audience: 'for_clinicians',
        unassigned: 'general'
    };
    return map[cluster] || 'general';
}

    // ====== sw-scoring ======
// ============================================================================
// sw-scoring.js — 60-day exponential-decay scoring engine
// ============================================================================
// Maintains three user-scoped "score ledgers" that let us infer a user's
// primary interest from behavior without asking them. Each ledger holds a
// map of { cluster_name: { score: number, last_ts_ms: number } }.
//
//   topic_scores      — keyed by primary_topic_cluster (18 clusters)
//   service_scores    — keyed by service_interest (15 interests)
//   modality_scores   — keyed by modality (19 modalities)
//
// Every time a user engages with a blog post, service page, clinician page,
// assessment, etc., the relevant cluster's score ticks up. Scores decay
// exponentially with a 60-day half-life, so recent behavior dominates.
//
// At read time, `getWinner(ledgerKey)` returns the top-scoring cluster
// (or 'unassigned') along with a normalized confidence (0-1) and an
// event-count gate. The GA4 user-properties populated from this engine are:
//
//   primary_topic_cluster      + topic_confidence      (threshold 0.40, ≥3 events)
//   primary_service_interest   + service_confidence    (threshold 0.40, ≥3 events)
//   primary_modality           + modality_confidence   (threshold 0.40, ≥3 events)
//
// Until those thresholds are met, the user-property is 'unassigned'.
// ============================================================================

// ----- Decay parameters ---------------------------------------------------
const HALF_LIFE_MS = 60 * 24 * 60 * 60 * 1000;  // 60 days in ms
const DECAY_LAMBDA = Math.LN2 / HALF_LIFE_MS;   // ln(2) / half_life
const SCORE_CAP    = 1000;                      // per-cluster ceiling
const SCORE_FLOOR  = 0.5;                       // below this, cluster is dropped
const CONFIDENCE_THRESHOLD = 0.40;              // winner must exceed this
const MIN_EVENT_COUNT      = 3;                 // winner needs at least this many events in ledger

// ----- Storage keys (localStorage — persist across sessions) --------------
const LS_LEDGER_KEYS = {
    topic:    'sw_scores_topic',
    service:  'sw_scores_service',
    modality: 'sw_scores_modality'
};

// Per-ledger event counters (for the ≥3 gate). Incremented on every
// updateScore call regardless of decay.
const LS_EVENT_COUNT_KEYS = {
    topic:    'sw_evcount_topic',
    service:  'sw_evcount_service',
    modality: 'sw_evcount_modality'
};

// ----- Score mutation -----------------------------------------------------
// Adds `points` to cluster `clusterName` in ledger `ledgerKey` ('topic'|
// 'service'|'modality'). Applies decay to the existing score first so the
// addition reflects time-aware weight. Writes back immediately.
function updateScore(ledgerKey, clusterName, points) {
    if (!clusterName || !LS_LEDGER_KEYS[ledgerKey]) return;
    const pts = Number(points) || 0;
    if (pts === 0) return;

    const now = Date.now();
    const ledger = readJSON('local', LS_LEDGER_KEYS[ledgerKey], {}) || {};

    // Decay the target cluster's existing score (if any)
    const existing = ledger[clusterName];
    let nextScore;
    if (existing && typeof existing.score === 'number' && typeof existing.last_ts_ms === 'number') {
        const elapsed = Math.max(0, now - existing.last_ts_ms);
        const decayed = existing.score * Math.exp(-DECAY_LAMBDA * elapsed);
        nextScore = Math.min(SCORE_CAP, decayed + pts);
    } else {
        nextScore = Math.min(SCORE_CAP, pts);
    }

    ledger[clusterName] = { score: nextScore, last_ts_ms: now };

    writeJSON('local', LS_LEDGER_KEYS[ledgerKey], ledger);

    // Bump the event counter (used by the ≥3 gate in getWinner)
    const countKey = LS_EVENT_COUNT_KEYS[ledgerKey];
    const prevCount = parseInt(safeGetLocal(countKey, '0'), 10) || 0;
    safeSetLocal(countKey, String(prevCount + 1));
}

// ----- Decay-on-read helpers ----------------------------------------------
// Returns a fresh ledger with every cluster's score decayed to `now`. Does
// NOT write back — this is a snapshot for the getWinner calculation. Callers
// who want to persist decayed state should write the returned value back.
function decayLedger(ledger, now) {
    const out = {};
    for (const k in ledger) {
        if (!Object.prototype.hasOwnProperty.call(ledger, k)) continue;
        const entry = ledger[k];
        if (!entry || typeof entry.score !== 'number') continue;
        const last = typeof entry.last_ts_ms === 'number' ? entry.last_ts_ms : now;
        const elapsed = Math.max(0, now - last);
        const decayed = entry.score * Math.exp(-DECAY_LAMBDA * elapsed);
        if (decayed >= SCORE_FLOOR) {
            out[k] = { score: decayed, last_ts_ms: last };
        }
        // else: dropped — below floor after decay
    }
    return out;
}

// ----- Winner calculation -------------------------------------------------
// Returns { winner, confidence, total_events, eligible } where:
//   winner       : top-scoring cluster name, or 'unassigned' if gate fails
//   confidence   : winner_score / sum_of_all_scores (0..1), or 0 if no scores
//   total_events : cumulative events ever pushed to this ledger
//   eligible     : true iff confidence >= 0.40 AND total_events >= 3
//
// If !eligible, winner is forced to 'unassigned' so we don't broadcast a
// premature classification.
function getWinner(ledgerKey) {
    const fallback = { winner: 'unassigned', confidence: 0, total_events: 0, eligible: false };
    if (!LS_LEDGER_KEYS[ledgerKey]) return fallback;

    const now = Date.now();
    const raw = readJSON('local', LS_LEDGER_KEYS[ledgerKey], {}) || {};
    const decayed = decayLedger(raw, now);
    const totalEvents = parseInt(safeGetLocal(LS_EVENT_COUNT_KEYS[ledgerKey], '0'), 10) || 0;

    let topName = null;
    let topScore = 0;
    let sumScore = 0;
    for (const k in decayed) {
        if (!Object.prototype.hasOwnProperty.call(decayed, k)) continue;
        const s = decayed[k].score;
        sumScore += s;
        if (s > topScore) { topScore = s; topName = k; }
    }

    if (!topName || sumScore <= 0) return Object.assign({}, fallback, { total_events: totalEvents });

    const confidence = topScore / sumScore;
    const eligible = (confidence >= CONFIDENCE_THRESHOLD) && (totalEvents >= MIN_EVENT_COUNT);

    return {
        winner: eligible ? topName : 'unassigned',
        confidence: Math.round(confidence * 1000) / 1000,  // 3-decimal precision
        total_events: totalEvents,
        eligible
    };
}

// ----- Bulk snapshot for dataLayer push -----------------------------------
// Returns the 6 user-properties derived from all three ledgers. Called by
// masterPage.js on every page load when assembling the __sw_context envelope.
function getAllUserProperties() {
    const topic    = getWinner('topic');
    const service  = getWinner('service');
    const modality = getWinner('modality');

    return {
        primary_topic_cluster:    topic.winner,
        topic_confidence:         topic.confidence,
        primary_service_interest: service.winner,
        service_confidence:       service.confidence,
        primary_modality:         modality.winner,
        modality_confidence:      modality.confidence
    };
}

// ----- Counting helpers (assessments_count, modalities_count) -------------
// Tally helpers for user-scoped counts that aren't derived from the scoring
// ledgers directly (assessments completed, distinct modalities seen, etc.).
// Stored under their own keys so scoring decay doesn't touch them.

const LS_COUNT_KEYS = {
    assessments_count: 'sw_count_assessments',
    modalities_count:  'sw_count_modalities_distinct',
    services_count:    'sw_count_services_viewed_distinct',
    blog_posts_count:  'sw_count_blog_posts_viewed_distinct'
};

// Generic increment — use for assessments_count (just a total)
function incrementCount(key) {
    const ls = LS_COUNT_KEYS[key];
    if (!ls) return 0;
    const prev = parseInt(safeGetLocal(ls, '0'), 10) || 0;
    const next = prev + 1;
    safeSetLocal(ls, String(next));
    return next;
}

// Distinct-value set — use for modalities_count / services_count / blog_posts_count
// Stored as JSON array of seen values; count = array length.
function addDistinct(key, value) {
    if (!value) return 0;
    const ls = LS_COUNT_KEYS[key];
    if (!ls) return 0;
    const seen = readJSON('local', ls, []) || [];
    if (!Array.isArray(seen)) return 0;
    if (seen.indexOf(value) === -1) {
        seen.push(value);
        writeJSON('local', ls, seen);
    }
    return seen.length;
}

function getCount(key) {
    const ls = LS_COUNT_KEYS[key];
    if (!ls) return 0;
    // Distinct-value sets store an array; totals store a number-as-string.
    // Try JSON first — if it parses to an array, return length.
    const raw = safeGetLocal(ls, null);
    if (raw == null) return 0;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
    } catch (e) { /* not JSON — fall through */ }
    return parseInt(raw, 10) || 0;
}

// ----- Getter for masterPage.js context envelope --------------------------
function getAllCounts() {
    return {
        assessments_count: getCount('assessments_count'),
        modalities_count:  getCount('modalities_count'),
        services_count:    getCount('services_count'),
        blog_posts_count:  getCount('blog_posts_count')
    };
}

    // ========================================================================
    // Bootstrap — adapted from masterPage.js
    // ========================================================================
    // Computes session/page/user context envelope, stamps it on window.__sw_context,
    // and fires sw_page_context. On a brand-new user, also fires sw_first_visit.
    // On a brand-new session, also fires sw_session_start.
    //
    // Path D changes from the Velo original:
    //   - wixLocation.path/url  -> window.location.pathname
    //   - $w.onReady            -> DOMContentLoaded / immediate-ready
    //   - SPA nav hook          -> history.pushState patch + popstate listener
    //   - Removed unused imports (wix-window was never referenced in body)
    // ========================================================================
    function bootstrapTracking() {
        if (typeof window === 'undefined') return;   // SSR guard (defensive)
        window.dataLayer = window.dataLayer || [];

        // -- Gather raw page signals --
        // Path D: pathname comes straight from window.location, lowercased and
        // trailing-slash-trimmed to normalize against the taxonomy tables.
        const rawPath = (window.location && window.location.pathname) || '/';
        const normalizedPath = rawPath.toLowerCase().replace(/\/$/, '') || '/';
        const search = (window.location && window.location.search) || '';
        const referrer = (typeof document !== 'undefined' && document.referrer) || '';
        const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || '';

        const utm = getUtmParams(search);
        const pageType = getPageType(normalizedPath);
        const deviceClass = getDeviceClass(userAgent);
        const trafficSource = getTrafficSource(referrer, utm);
        const referrerDomain = getReferrerDomain(referrer);

        // -- First-touch bootstrap (idempotent; no-op on returning visitors) --
        // Path D fix: capture whether first-touch was already persisted BEFORE
        // we call maybeSetFirstTouchBootstrap. This lets sw_first_visit fire
        // exactly once per device (the localStorage scope) instead of once per
        // page of a new user's first session. Matches the masterPage.js comment
        // "Fires exactly once per device (controlled by first_traffic_source
        // being set)." Gate below reads this flag instead of session.is_new_user.
        const firstTouchWasAlreadySet = safeGetLocal('sw_ft_traffic_source', null) != null;

        maybeSetFirstTouchBootstrap(normalizedPath, referrer, utm, userAgent);

        // -- Session context --
        const session = initSessionContext(normalizedPath, referrer, utm);

        // -- Path taxonomy lookups --
        let serviceAttrs = {};
        let clinicianAttrs = {};
        let assessmentAttrs = {};
        if (SERVICE_BY_PATH[normalizedPath])    serviceAttrs    = SERVICE_BY_PATH[normalizedPath];
        if (CLINICIAN_BY_PATH[normalizedPath])  clinicianAttrs  = CLINICIAN_BY_PATH[normalizedPath];
        if (ASSESSMENT_BY_PATH[normalizedPath]) assessmentAttrs = ASSESSMENT_BY_PATH[normalizedPath];

        // -- Derived user properties from the scoring engine --
        const userProps = getAllUserProperties();
        const counts = getAllCounts();
        const firstTouch = getAllFirstTouchAttrs();

        // -- Build the context envelope --
        const context = {
            // Page-scope
            page_type:            pageType,
            page_path:            normalizedPath,
            page_location:        (window.location && window.location.href) || '',

            // Session-scope
            session_id:           session.session_id,
            session_number:       session.session_number,
            is_new_user:          session.is_new_user,
            is_new_session:       session.is_new_session,
            session_start_ts_ms:  session.session_start_ts_ms,
            entry_method:         session.entry_method,
            entry_page:           session.entry_page,
            session_page_count:   session.session_page_count,

            // Device / traffic
            device_class:         deviceClass,
            traffic_source:       trafficSource,
            referrer_domain:      referrerDomain,
            utm_source:           utm.utm_source   || '',
            utm_medium:           utm.utm_medium   || '',
            utm_campaign:         utm.utm_campaign || '',
            utm_content:          utm.utm_content  || '',
            utm_term:             utm.utm_term     || '',

            // Service / clinician / assessment (populated only on matching paths)
            service_name:              serviceAttrs.service_name              || '',
            service_category:          serviceAttrs.service_category          || '',
            clinician_name:            clinicianAttrs.clinician_name          || '',
            clinician_role:            clinicianAttrs.clinician_role          || '',
            clinician_specialty_primary: clinicianAttrs.clinician_specialty_primary || '',
            assessment_name:           assessmentAttrs.assessment_name        || '',
            assessment_category:       assessmentAttrs.assessment_category    || '',
            assessment_age_range:      assessmentAttrs.assessment_age_range   || '',
            assessment_self_scoring:   typeof assessmentAttrs.assessment_self_scoring === 'boolean'
                                        ? assessmentAttrs.assessment_self_scoring : '',

            // Derived user properties
            primary_topic_cluster:     userProps.primary_topic_cluster,
            topic_confidence:          userProps.topic_confidence,
            primary_service_interest:  userProps.primary_service_interest,
            service_confidence:        userProps.service_confidence,
            primary_modality:          userProps.primary_modality,
            modality_confidence:       userProps.modality_confidence,

            // Cumulative counts
            assessments_count:         counts.assessments_count,
            modalities_count:          counts.modalities_count,
            services_count:            counts.services_count,
            blog_posts_count:          counts.blog_posts_count,

            // First-touch (all 10 attributes — blanks until set)
            first_traffic_source:      firstTouch.first_traffic_source,
            first_utm_source:          firstTouch.first_utm_source,
            first_utm_medium:          firstTouch.first_utm_medium,
            first_utm_campaign:        firstTouch.first_utm_campaign,
            first_landing_page:        firstTouch.first_landing_page,
            first_referrer_domain:     firstTouch.first_referrer_domain,
            first_device_class:        firstTouch.first_device_class,
            first_blog_post_viewed:    firstTouch.first_blog_post_viewed,
            first_service_viewed:      firstTouch.first_service_viewed,
            first_clinician_viewed:    firstTouch.first_clinician_viewed
        };

        // Park the envelope on window so sw_push can merge it into every event.
        window.__sw_context = context;

        // -- Initial dataLayer push --
        sw_push('sw_page_context', { page_view_trigger: true });

        // -- Session-start one-shot --
        if (session.is_new_session) {
            sw_push('sw_session_start', {});
        }

        // -- First-visit one-shot --
        // Path D fix: gate on !firstTouchWasAlreadySet (captured before
        // maybeSetFirstTouchBootstrap ran). This fires sw_first_visit exactly
        // once per device — on the single page-load that flipped first-touch
        // from "not set" to "set". Prior Velo behavior used session.is_new_user
        // which fired on every page of a new user's first session (3-10x
        // over-count). Aligned with masterPage.js intent comment.
        if (!firstTouchWasAlreadySet) {
            sw_push('sw_first_visit', {});
        }

        // -- Phase 3.3: Forms ---------------------------------------------
        // generate_lead fires on /confirmation (the single success URL for
        // every Wix form on the site), keyed off sessionStorage attribution
        // written when the user clicked submit. Abandonment + form_start
        // listeners get wired once per page load; SPA-nav re-bootstrap
        // re-wires for new-page forms.
        try { maybeFireGenerateLead(normalizedPath); } catch (e) { /* non-fatal */ }
        try { initFormListenersWhenReady();         } catch (e) { /* non-fatal */ }
        try { initFormAbandonmentListeners();       } catch (e) { /* non-fatal */ }
    }

    // ------------------------------------------------------------------------
    // Trigger: fire bootstrap as soon as the DOM is far enough along for
    // document.referrer and window.location to be authoritative. In HEAD
    // context this is typically immediate (DOM is parsing, but location +
    // referrer are already settled). If readyState is 'loading', defer to
    // DOMContentLoaded for a belt-and-suspenders guarantee.
    // ------------------------------------------------------------------------
    function initBootstrap() {
        try { bootstrapTracking(); }
        catch (err) {
            // Tracking must never crash the page. Log and bail.
            if (typeof console !== 'undefined') {
                console.warn('[sw] bootstrap failed:', err);
            }
        }
    }

    // Run bootstrap SYNCHRONOUSLY. As a HEAD custom embed this executes during
    // head parsing, before GTM's async gtm.js fetches — which means our dataLayer
    // pushes (sw_page_context, sw_session_start, sw_first_visit) are queued
    // before GTM reads the queue. The IIFE-level __sw_bootstrap_loaded guard at
    // the top of this file prevents re-entry if the embed is injected twice.
    initBootstrap();

    // ------------------------------------------------------------------------
    // SPA nav hook — Wix uses client-side nav for in-site links. We patch
    // history.pushState and listen for popstate, dispatching a custom
    // sw:navigate event that re-runs bootstrap. This causes session_page_count
    // to increment and sw_page_context to re-fire with the new page_path.
    //
    // sw_first_visit and sw_session_start are gated by session-state flags,
    // so they don't re-fire on SPA nav — only the page-context event does.
    // ------------------------------------------------------------------------
    (function patchHistory() {
        try {
            const origPushState = history.pushState;
            const origReplaceState = history.replaceState;

            history.pushState = function () {
                const result = origPushState.apply(this, arguments);
                window.dispatchEvent(new Event('sw:navigate'));
                return result;
            };

            history.replaceState = function () {
                const result = origReplaceState.apply(this, arguments);
                window.dispatchEvent(new Event('sw:navigate'));
                return result;
            };

            window.addEventListener('popstate', function () {
                window.dispatchEvent(new Event('sw:navigate'));
            });

            window.addEventListener('sw:navigate', function () {
                // Re-run bootstrap. initSessionContext handles continuing-session
                // increments; first-touch is idempotent; session/first-visit
                // one-shots are gated by stored flags.
                initBootstrap();
            });
        } catch (err) {
            if (typeof console !== 'undefined') {
                console.warn('[sw] SPA nav patch failed:', err);
            }
        }
    })();

    // ------------------------------------------------------------------------
    // Expose the canonical dataLayer-push helper for later-phase DOM listeners
    // (forms, screeners, etc.) to call. Everything else stays private to the
    // IIFE -- callers should never reach into session/scoring/taxonomy state
    // directly; they go through sw_push.
    // ------------------------------------------------------------------------
    window.sw_push = sw_push;


    // ====== sw-forms ======
// ============================================================================
// sw-forms.js — Form interaction listeners (form_start, generate_lead, form_abandonment)
// ============================================================================
// Wix Forms widget renders containers with DOM id `form-{UUID}` and an
// `aria-label` attribute equal to the form's configured name. The submit
// button on Wix forms is `type="button"` (not `type="submit"`), so the
// standard `submit` event cannot be observed. On successful submit, Wix
// performs a hard page navigation to `/confirmation` — verified via live
// site crawl on Apr 24 2026. This module exploits both facts:
//
//   1. form_start       — first user interaction with a form container
//                         (focusin / input / change). One-shot per form_id
//                         per page load. Writes attribution to sessionStorage.
//
//   2. generate_lead    — fired by bootstrap when page_path === '/confirmation'.
//                         Reads sessionStorage for a recent submit-click that
//                         occurred inside a form container, and attributes
//                         the lead to form_name / form_type / service_context.
//                         If no pending submit is present, fires a fallback
//                         generate_lead with form_name = 'unknown_form' so
//                         GA4 conversion counts stay complete.
//
//   3. form_abandonment — fired on beforeunload / visibilitychange (hidden) /
//                         SPA nav-away-from-/contact-style-page when a
//                         form_start was recorded without a following submit.
//                         Suppressed when a pending-submit record exists
//                         (avoids false positives on the submit-nav path).
//
// sessionStorage keys:
//   sw_form_active          — { form_id, form_name, form_type,
//                               lead_value_estimate, service_context,
//                               ts_ms, fields_interacted, _abandoned_fired }
//   sw_form_pending_submit  — { form_id, form_name, form_type,
//                               lead_value_estimate, service_context,
//                               click_ts_ms }
//
// The `_sw_attribution_source` debug dimension on generate_lead lets us
// separate well-attributed leads from confirmation-page fallbacks in GA4.
// ============================================================================

const SW_FORM_ACTIVE_KEY         = 'sw_form_active';
const SW_FORM_PENDING_SUBMIT_KEY = 'sw_form_pending_submit';
const SW_FORM_SUBMIT_WINDOW_MS   = 10000;   // submit-click -> /confirmation nav budget
const SW_FORM_ABANDON_MIN_AGE_MS = 1500;    // ignore abandonments under 1.5s (page churn)

// ----- Helpers -----------------------------------------------------------

// Map a Wix form container to a canonical form_name. STRICT: the container
// id must match /^form-{UUID}$/ exactly (excludes Wix field wrappers like
// form-field-input-*, form-field-label-*, form-field-error-*) AND the UUID
// must be registered in FORM_NAME_BY_ID. Returns null for anything that
// doesn't qualify — callers should bail early on null.
//
// Why strict: the [id^="form-"] DOM selector used by initFormListeners is
// deliberately broad to survive Wix's async hydration. resolveFormName is
// the gate that prevents field wrappers and unregistered forms from
// generating form_start / form_abandonment / generate_lead noise.
function resolveFormName(containerEl) {
    if (!containerEl) return null;
    const id = containerEl.id || '';
    const m = id.match(/^form-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (!m) return null;
    const uuid = m[1].toLowerCase();
    return FORM_NAME_BY_ID[uuid] || null;
}

function resolveFormMeta(formName) {
    return FORM_META[formName] || FORM_META.unknown_form || { form_type: 'other', lead_value_estimate: 0 };
}

// Snapshot the current page_context for form attribution. Travels with the
// form across page nav via sessionStorage so generate_lead knows which
// service/clinician/assessment the user was viewing when they converted.
function buildFormServiceContext() {
    const ctx = window.__sw_context || {};
    return {
        service_name:        ctx.service_name        || '',
        service_category:    ctx.service_category    || '',
        clinician_name:      ctx.clinician_name      || '',
        clinician_role:      ctx.clinician_role      || '',
        assessment_name:     ctx.assessment_name     || '',
        page_type_at_form:   ctx.page_type           || '',
        page_path_at_form:   ctx.page_path           || ''
    };
}

// ----- form_start --------------------------------------------------------
// In-memory per-page-load dedupe — form_start fires at most once per
// form_id. A fresh page load clears this flag by nature.
function handleFormStart(containerEl) {
    if (!containerEl || containerEl.__sw_form_started) return;
    const formName = resolveFormName(containerEl);
    if (!formName) return;  // registered-UUIDs only
    containerEl.__sw_form_started = true;

    const formId   = containerEl.id || '';
    const meta     = resolveFormMeta(formName);
    const svcCtx   = buildFormServiceContext();

    sw_push('form_start', Object.assign(
        { form_name: formName, form_id: formId, form_type: meta.form_type },
        svcCtx
    ));

    writeJSON('session', SW_FORM_ACTIVE_KEY, {
        form_id:               formId,
        form_name:             formName,
        form_type:             meta.form_type,
        lead_value_estimate:   meta.lead_value_estimate,
        service_context:       svcCtx,
        ts_ms:                 Date.now(),
        fields_interacted:     1,
        _abandoned_fired:      false
    });
}

function handleFormFieldInteraction() {
    const active = readJSON('session', SW_FORM_ACTIVE_KEY, null);
    if (!active) return;
    active.fields_interacted = (active.fields_interacted || 0) + 1;
    writeJSON('session', SW_FORM_ACTIVE_KEY, active);
}

// ----- submit-click capture ---------------------------------------------
// Wix submit buttons are type="button", so we listen for button clicks
// inside the form container. Heuristic ignores cancel/close/reset buttons.
function handleFormSubmitClick(containerEl) {
    const active   = readJSON('session', SW_FORM_ACTIVE_KEY, null);
    const formName = (active && active.form_name) || resolveFormName(containerEl);
    if (!formName) return;  // registered-UUIDs only
    const meta     = resolveFormMeta(formName);
    const svcCtx   = (active && active.service_context) || buildFormServiceContext();

    writeJSON('session', SW_FORM_PENDING_SUBMIT_KEY, {
        form_id:              containerEl.id || (active && active.form_id) || '',
        form_name:            formName,
        form_type:            meta.form_type,
        lead_value_estimate:  meta.lead_value_estimate,
        service_context:      svcCtx,
        click_ts_ms:          Date.now()
    });
}

// ----- generate_lead (called from bootstrap on /confirmation) ----------
function maybeFireGenerateLead(currentPath) {
    if (currentPath !== '/confirmation') return;

    const pending = readJSON('session', SW_FORM_PENDING_SUBMIT_KEY, null);

    if (!pending) {
        // Confirmation-page fallback: user landed here without a tracked
        // submit (deep link, refresh, or a submit we failed to instrument).
        // Still fire generate_lead so GA4 conversion counts stay complete.
        sw_push('generate_lead', {
            form_name:               'unknown_form',
            form_type:               'other',
            lead_value_estimate:     0,
            currency:                'USD',
            value:                   0,
            _sw_attribution_source:  'confirmation_page_fallback'
        });
        return;
    }

    const age = Date.now() - (pending.click_ts_ms || 0);
    const stale = age > SW_FORM_SUBMIT_WINDOW_MS;

    sw_push('generate_lead', Object.assign({
        form_name:               pending.form_name,
        form_id:                 pending.form_id,
        form_type:               pending.form_type,
        lead_value_estimate:     pending.lead_value_estimate,
        currency:                'USD',
        value:                   pending.lead_value_estimate || 0,
        _sw_attribution_source:  stale ? 'submit_click_stale' : 'submit_click_attribution'
    }, pending.service_context || {}));

    // Clear both keys — the journey is complete.
    try { window.sessionStorage.removeItem(SW_FORM_PENDING_SUBMIT_KEY); } catch (e) {}
    try { window.sessionStorage.removeItem(SW_FORM_ACTIVE_KEY);         } catch (e) {}
}

// ----- form_abandonment -------------------------------------------------
// Called from beforeunload, visibilitychange (hidden), and SPA nav-away.
// Suppressed when a pending-submit record exists so the submit-nav path
// doesn't double-fire abandonment + generate_lead.
function maybeFireFormAbandonment(reason) {
    const active = readJSON('session', SW_FORM_ACTIVE_KEY, null);
    if (!active) return;
    if (active._abandoned_fired) return;

    const pending = readJSON('session', SW_FORM_PENDING_SUBMIT_KEY, null);
    if (pending) {
        const age = Date.now() - (pending.click_ts_ms || 0);
        if (age <= SW_FORM_SUBMIT_WINDOW_MS) return;  // submit in flight — wait for /confirmation
    }

    const timeInForm = Date.now() - (active.ts_ms || Date.now());
    if (timeInForm < SW_FORM_ABANDON_MIN_AGE_MS) return;  // too quick — probably page-churn noise

    active._abandoned_fired = true;
    writeJSON('session', SW_FORM_ACTIVE_KEY, active);

    sw_push('form_abandonment', Object.assign({
        form_name:                active.form_name,
        form_id:                  active.form_id,
        form_type:                active.form_type,
        fields_interacted_count:  active.fields_interacted || 0,
        time_in_form_ms:          timeInForm,
        abandonment_reason:       reason
    }, active.service_context || {}));

    try { window.sessionStorage.removeItem(SW_FORM_ACTIVE_KEY); } catch (e) {}
}

// ----- Listener wiring --------------------------------------------------
function wireFormContainer(c) {
    if (!c || c.__sw_forms_wired) return;
    // registered-UUIDs-only: bail on Wix field wrappers and unregistered forms
    if (!resolveFormName(c)) return;
    c.__sw_forms_wired = true;

    // First interaction -> form_start. Capture phase so we see focus events
    // inside Wix's nested inputs.
    c.addEventListener('focusin', function () { handleFormStart(c); }, true);
    c.addEventListener('input',   function () { handleFormStart(c); handleFormFieldInteraction(); }, true);
    c.addEventListener('change',  function () { handleFormStart(c); handleFormFieldInteraction(); }, true);

    // Submit-click capture. Wix uses type="button" buttons, so we key off
    // any button click within the container and reject obvious non-submit
    // controls by text content.
    c.addEventListener('click', function (ev) {
        const t = ev.target;
        if (!t) return;
        const btn = (t.closest && (t.closest('button') || t.closest('[role="button"]'))) || null;
        if (!btn) return;
        const txt = (btn.textContent || '').trim().toLowerCase();
        if (/^(cancel|close|reset|back|x)$/.test(txt)) return;
        handleFormSubmitClick(c);
    }, true);
}

function initFormListeners() {
    try {
        const containers = document.querySelectorAll('[id^="form-"]');
        for (let i = 0; i < containers.length; i++) wireFormContainer(containers[i]);
    } catch (e) { /* non-fatal */ }
}

// Deferred init — DOM isn't parsed yet when the HEAD script runs, AND Wix
// hydrates its Forms widget ASYNCHRONOUSLY after that. A single scan at
// DOMContentLoaded misses most forms. Empirically, on /contact a single
// post-DCL scan found 0 of 40 form containers (they were rendered later).
//
// Strategy:
//   1. Scan at DOMContentLoaded (or immediately if already past).
//   2. Scan again on window.load and on a short timer ladder
//      (500 / 1500 / 3500 ms) to cover slow Wix hydration.
//   3. MutationObserver on document.body so any form node added at any
//      later time (modal open, SPA nav, lazy load) gets wired on insertion.
//      Debounced with rAF to keep CPU cost trivial.
//
// wireFormContainer is doubly idempotent (the __sw_forms_wired property
// guard AND the resolveFormName registered-UUIDs filter), so re-scans are
// effectively free.
function initFormListenersWhenReady() {
    if (typeof document === 'undefined') return;

    // 1. Immediate / DOMContentLoaded scan
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFormListeners, { once: true });
    } else {
        initFormListeners();
    }

    // 2. window.load + timer ladder — belt-and-suspenders for Wix hydration
    if (window.addEventListener) {
        window.addEventListener('load', initFormListeners);
    }
    try { setTimeout(initFormListeners,  500); } catch (e) {}
    try { setTimeout(initFormListeners, 1500); } catch (e) {}
    try { setTimeout(initFormListeners, 3500); } catch (e) {}

    // 3. MutationObserver on document.body — catches late-added nodes.
    //    Runs for the life of the page so SPA nav / modal open / lazy load
    //    all flow through here. Debounced via rAF.
    function setupObserver() {
        if (!document.body || typeof MutationObserver !== 'function') return;
        if (window.__sw_forms_observer_installed) return;
        window.__sw_forms_observer_installed = true;
        let pending = false;
        const rAF = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
        const obs = new MutationObserver(function () {
            if (pending) return;
            pending = true;
            rAF(function () {
                pending = false;
                try { initFormListeners(); } catch (e) { /* non-fatal */ }
            });
        });
        try {
            obs.observe(document.body, { childList: true, subtree: true });
        } catch (e) { /* non-fatal */ }
    }
    if (document.body) {
        setupObserver();
    } else {
        document.addEventListener('DOMContentLoaded', setupObserver, { once: true });
    }
}

function initFormAbandonmentListeners() {
    if (window.__sw_form_abandonment_wired) return;
    window.__sw_form_abandonment_wired = true;

    window.addEventListener('beforeunload', function () {
        maybeFireFormAbandonment('beforeunload');
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            maybeFireFormAbandonment('visibility_hidden');
        }
    });

    window.addEventListener('sw:navigate', function () {
        // SPA nav: if user moves off the form page without submitting,
        // that's abandonment. Slight delay so the new page_path is settled.
        setTimeout(function () {
            const p = (window.location && window.location.pathname || '').toLowerCase().replace(/\/$/, '') || '/';
            if (p === '/confirmation') return;  // success path, not abandonment
            maybeFireFormAbandonment('spa_navigate');
            // After nav, re-scan for form containers on the new page.
            initFormListeners();
        }, 50);
    });
}

})();
