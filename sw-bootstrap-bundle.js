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
        rolls_up_to: 'assessment_clinical_diagnostics',
        service_variant: 'comprehensive_diagnostic',
        service_modality: 'unassigned'
    },
    '/specialized-therapy': {
        service_name: 'specialized_therapy',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults',
        service_variant: 'multispecialty_individual',
        service_modality: 'multiple_modalities'
    },
    '/executive-function-coaching': {
        service_name: 'executive_function_coaching',
        service_category: 'coaching',
        rolls_up_to: 'coaching_neurodivergent_adults',
        service_variant: 'coaching_neurodivergent',
        service_modality: 'unassigned'
    },
    '/mental-health-screening': {
        service_name: 'mental_health_screening',
        service_category: 'screening',
        rolls_up_to: 'assessment_tools_only',
        service_variant: 'screener_tools_only',
        service_modality: 'unassigned'
    },
    // Condition-specific hubs — tracked as distinct service_name but roll up
    // to therapy_individual_adults at the user level.
    '/ocd': {
        service_name: 'service_ocd_condition_hub',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults',
        service_variant: 'condition_hub_ocd',
        service_modality: 'erp'
    },
    '/trauma': {
        service_name: 'service_trauma_condition_hub',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults',
        service_variant: 'condition_hub_trauma',
        service_modality: 'emdr'
    },
    '/insomnia': {
        service_name: 'service_insomnia_condition_hub',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults',
        service_variant: 'condition_hub_insomnia',
        service_modality: 'cbt_i'
    },
    '/medication-management': {
        service_name: 'service_medication_management',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults',
        service_variant: 'psychiatric_medication',
        service_modality: 'unassigned'
    },
    '/groups': {
        service_name: 'service_groups',
        service_category: 'therapy',
        rolls_up_to: 'therapy_individual_adults',
        service_variant: 'group_program',
        service_modality: 'multiple_modalities'
    }
};

// --------------------------------------------------------------------------
// Clinician profile pages
// --------------------------------------------------------------------------
const CLINICIAN_BY_PATH = {
    '/kiesakelly': {
        clinician_name: 'kiesa_kelly',
        clinician_role: 'psychologist',
        clinician_specialty_primary: 'clinical_diagnostics',
        clinician_primary_service: 'assessments',
        clinician_specialties: ['ocd', 'trauma_ptsd', 'audhd', 'adhd', 'autism', 'clinical_diagnostics'],
        clinician_takes_insurance: false,
        clinician_accepting_new: true
    },
    '/laura-travers-heinig': {
        clinician_name: 'laura_travers_heinig',
        clinician_role: 'psychologist',
        clinician_specialty_primary: 'womens_health',
        clinician_primary_service: 'therapy',
        clinician_specialties: ['health_psychology', 'insomnia_sleep', 'perimenopause_neurodivergence', 'trauma_ptsd'],
        clinician_takes_insurance: false,
        clinician_accepting_new: true
    },
    '/catherinecavin': {
        clinician_name: 'catherine_cavin',
        clinician_role: 'therapist',
        clinician_specialty_primary: 'adhd_autism',
        clinician_primary_service: 'therapy',
        clinician_specialties: ['ocd', 'adhd', 'autism', 'chronic_illness'],
        clinician_takes_insurance: false,
        clinician_accepting_new: true
    },
    '/kathryn-wood': {
        clinician_name: 'kathryn_wood',
        clinician_role: 'therapist',
        clinician_specialty_primary: 'trauma',
        clinician_primary_service: 'therapy',
        clinician_specialties: ['anxiety', 'ocd', 'trauma_ptsd', 'insomnia_sleep'],
        clinician_takes_insurance: false,
        clinician_accepting_new: true
    },
    '/ryan-robertson': {
        clinician_name: 'ryan_robertson',
        clinician_role: 'therapist',
        clinician_specialty_primary: 'couples_family_therapy',
        clinician_primary_service: 'therapy',
        clinician_specialties: ['couples_relationship_issues', 'family_parenting_dynamics', 'ocd', 'adhd', 'autism', 'audhd', 'insomnia_sleep'],
        clinician_takes_insurance: false,
        clinician_accepting_new: true
    },
    '/shane-thrapp': {
        clinician_name: 'shane_thrapp',
        clinician_role: 'coach',
        clinician_specialty_primary: 'executive_function',
        clinician_primary_service: 'coaching',
        clinician_specialties: ['adhd', 'autism', 'audhd', 'executive_function'],
        clinician_takes_insurance: false,
        clinician_accepting_new: true
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
// Keys are the lowercase UUID portion of the Wix form container element ID
// (i.e., element id `form-<UUID>` resolves via FORM_NAME_BY_ID[<UUID>]).
// Values are the canonical form_name used across generate_lead, form_start,
// and form_abandonment events. Populated 2026-04-28 (Phase 4.4-A) from a
// live crawl of scienceworkshealth.com — 16 unique form UUIDs across 25 pages.
//
// Note on multi-page UUIDs: Wix reuses form instances across pages (same UUID
// rendered on multiple URLs). Lookup is keyed by UUID alone, so a UUID maps
// to a single canonical form_name regardless of submission page. Page-level
// intent is captured separately via `service_context` on the bundle's push.
const FORM_NAME_BY_ID = {
    // Universal "Schedule a free consultation" — primary contact form,
    // placed on /contact, /specialized-therapy, /ocd, /trauma, /pre-surgical-assessment
    '34f61b44-208c-45bd-a3f3-d60372ff9578': 'contact_main',

    // Detailed 9-field assessment inquiry — "Get in Touch with Dr. Kelly for
    // Your Assessment" — on /contact + /psychological-assessments
    '08c9228f-3c88-403e-be5f-f337849d2494': 'assessment_inquiry',

    // Coaching inquiry — "Get in Touch with Shane for Coaching" —
    // on /executive-function-coaching + /shane-thrapp
    'dfe4f28d-84a1-450e-a128-7a6edbf08bf6': 'coaching_inquiry',

    // Service-specific 4-field inquiry forms (Name/Email/Phone/"How can we help?")
    'f763b0f8-7a7a-41d7-9b53-20e255b7fb54': 'ocd_inquiry',      // /ocd
    '05ac8c0a-a579-4fe0-b510-9011052bcfb7': 'trauma_inquiry',   // /trauma
    'a16374e8-f697-4621-83f9-a0f5e9397adf': 'research_inquiry', // /in-depth-research

    // "Do you have questions?" forms — different UUIDs across page contexts
    '2195f02f-e8b3-44d9-a063-9a741cba6261': 'quick_questions',  // /contact, /emdr-bilateral-stimulation, /medication-management, /resources
    'eaac169f-1e15-4f73-992a-5c0bbfaa6f11': 'groups_questions', // /groups

    // /groups dedicated signup ("Select a group below to get started")
    'cf278b73-b8a3-4a13-a9c2-84c2d951076f': 'groups_signup',

    // Newsletter — single-field email subscribe on /in-depth-research
    '7a0e6755-6f6c-47f0-b060-5721e78237b4': 'research_subscribe',

    // Careers application
    '8b77cff6-da02-4f58-8ac4-dfaf47625958': 'careers',

    // Clinician profile forms — one per clinician page
    '3cf5fa46-d0f2-4764-b4b1-eaa2bf274482': 'clinician_kiesa_kelly',          // /psychological-assessments + /kiesakelly
    'e522454a-a18f-40e6-a532-aebe5daed5ea': 'clinician_laura_travers_heinig', // /laura-travers-heinig
    'd0a38253-f880-402f-8487-ee52282b757d': 'clinician_catherine_cavin',      // /catherinecavin
    'e9ea2c38-cdb6-4fe9-a3c3-6cc8d7c1d39b': 'clinician_kathryn_wood',         // /kathryn-wood
    '585c11e1-70a3-43f9-9ad2-094ad71c6793': 'clinician_ryan_robertson'        // /ryan-robertson
};

// Canonical form_name values, with form_type classification.
// form_type: consult | inquiry | careers | clinician_contact | newsletter | other
// Updated 2026-04-28 (Phase 4.4-A): removed unused therapy_inquiry +
// screening_inquiry; added 7 new keys (ocd/trauma/research_inquiry,
// quick_questions, groups_questions, groups_signup, research_subscribe).
const FORM_META = {
    // Main inquiry forms (universal consultation / detailed intake)
    contact_main:                  { form_type: 'inquiry',           lead_value_estimate: 250 },
    assessment_inquiry:            { form_type: 'inquiry',           lead_value_estimate: 250 },
    coaching_inquiry:              { form_type: 'inquiry',           lead_value_estimate: 250 },

    // Service-specific 4-field inquiry forms
    ocd_inquiry:                   { form_type: 'inquiry',           lead_value_estimate: 250 },
    trauma_inquiry:                { form_type: 'inquiry',           lead_value_estimate: 250 },
    research_inquiry:              { form_type: 'inquiry',           lead_value_estimate: 250 },

    // "Do you have questions?" generic Q&A forms
    quick_questions:               { form_type: 'inquiry',           lead_value_estimate: 250 },
    groups_questions:              { form_type: 'inquiry',           lead_value_estimate: 250 },

    // Group enrollment
    groups_signup:                 { form_type: 'inquiry',           lead_value_estimate: 250 },

    // Newsletter / subscription
    research_subscribe:            { form_type: 'newsletter',        lead_value_estimate: 0   },

    // Careers
    careers:                       { form_type: 'careers',           lead_value_estimate: 0   },

    // Clinician profile forms
    clinician_kiesa_kelly:         { form_type: 'clinician_contact', lead_value_estimate: 250 },
    clinician_laura_travers_heinig:{ form_type: 'clinician_contact', lead_value_estimate: 250 },
    clinician_catherine_cavin:     { form_type: 'clinician_contact', lead_value_estimate: 250 },
    clinician_kathryn_wood:        { form_type: 'clinician_contact', lead_value_estimate: 250 },
    clinician_ryan_robertson:      { form_type: 'clinician_contact', lead_value_estimate: 250 }
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
    'professional_audience', 'clinical_diagnostics', 'unassigned'
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

// ============================================================================
// Click context tracker — installs a single document-level click listener
// (capture phase) that decorates dataLayer with click-context dimensions BEFORE
// GTM's auto-listener fires its native click trigger. The decoration powers
// the GTM-side click tags (cta_click, outbound_click, image_click,
// file_download, content_share) by populating their referenced DLVs:
// dlv_scroll_at_click, dlv_time_on_page_seconds, dlv_cta_label, dlv_cta_location,
// dlv_cta_variant, dlv_cta_position_percent, dlv_cta_viewport_time_seconds,
// dlv_prior_cta_clicks_in_session.
//
// CTA classification is hybrid:
//   1. data-cta-label / data-cta-location / data-cta-variant attrs on the
//      element (or up to 3 ancestors) — explicit override.
//   2. Regex: text matches /book now|schedule|.../, OR href matches
//      /(contact|booking|book|schedule)/, AND element is button-like.
//   3. Otherwise: not a CTA — generic click context still pushed so non-CTA
//      click tags (outbound/image/file/share) still get scroll_at_click
//      and time_on_page_seconds populated.
//
// Pushes a `sw_click_context` event with generic + cta-specific keys, AND
// a `cta_click` event when classified — covering both possible GTM trigger
// shapes for the cta_click tag (native click trigger reading DLVs vs custom
// event trigger on `cta_click`).
// ============================================================================

let __sw_page_ready_ts = 0;
let __sw_cta_view_starts = null;
let __sw_cta_view_accums = null;
let __sw_cta_intersection_observer = null;

const CTA_TEXT_PATTERN = /\b(book\s*now|book\s*online|schedule|get\s*started|contact\s*us|book\s*(an\s*)?appointment|sign\s*up|join\s*(now|us)|start\s*here)\b/i;
const CTA_HREF_PATTERN = /\/(contact|booking|book|schedule|signup|apply|appointment)(\b|\/|$)/i;
const CTA_BUTTON_CLASSES = /\b(wixui-button|button|btn|cta)\b/i;

function initClickContext() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (window.__sw_click_context_installed) return;
    window.__sw_click_context_installed = true;

    __sw_page_ready_ts = Date.now();
    if (typeof WeakMap !== 'undefined') {
        __sw_cta_view_starts = new WeakMap();
        __sw_cta_view_accums = new WeakMap();
    }

    if (typeof IntersectionObserver !== 'undefined' && __sw_cta_view_starts) {
        __sw_cta_intersection_observer = new IntersectionObserver(function (entries) {
            const now = Date.now();
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    if (!__sw_cta_view_starts.has(entry.target)) {
                        __sw_cta_view_starts.set(entry.target, now);
                    }
                } else {
                    const start = __sw_cta_view_starts.get(entry.target);
                    if (start) {
                        const accum = __sw_cta_view_accums.get(entry.target) || 0;
                        __sw_cta_view_accums.set(entry.target, accum + (now - start));
                        __sw_cta_view_starts.delete(entry.target);
                    }
                }
            });
        }, { threshold: 0.5 });
        __sw_observeCtaCandidates();
        // Re-scan for late-hydrated Wix CTAs every 2s for first 10s
        let scans = 0;
        const interval = setInterval(function () {
            __sw_observeCtaCandidates();
            if (++scans >= 5) clearInterval(interval);
        }, 2000);
    }

    document.addEventListener('click', __sw_handleClickEvent, true);
}

function __sw_observeCtaCandidates() {
    if (!__sw_cta_intersection_observer || typeof document === 'undefined') return;
    const candidates = document.querySelectorAll('a.wixui-button, a[class*="button"], button, [data-cta-label]');
    candidates.forEach(function (el) {
        try { __sw_cta_intersection_observer.observe(el); } catch (e) { /* already observed */ }
    });
}

function __sw_classifyCta(el) {
    // 1) Explicit data-cta-* attrs (search element + 3 ancestors)
    let cur = el;
    for (let i = 0; i < 4 && cur; i++) {
        if (cur.dataset && cur.dataset.ctaLabel) {
            return {
                source: 'explicit',
                label: cur.dataset.ctaLabel,
                location: cur.dataset.ctaLocation || '',
                variant: cur.dataset.ctaVariant || ''
            };
        }
        cur = cur.parentElement;
    }
    // 2) Regex auto-classifier
    const text = (el.textContent || el.getAttribute('aria-label') || '').trim();
    const href = el.getAttribute('href') || '';
    const cls = (typeof el.className === 'string') ? el.className : '';
    const isButtonish = CTA_BUTTON_CLASSES.test(cls) || el.tagName === 'BUTTON';
    if (!isButtonish) return null;
    if (CTA_TEXT_PATTERN.test(text) || CTA_HREF_PATTERN.test(href)) {
        return {
            source: 'regex',
            label: __sw_slugify(text || el.id || 'cta'),
            location: __sw_detectLocation(el),
            variant: __sw_detectVariant(el)
        };
    }
    return null;
}

function __sw_slugify(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
}

function __sw_detectLocation(el) {
    let cur = el;
    for (let i = 0; i < 8 && cur; i++) {
        const tag = (cur.tagName || '').toLowerCase();
        const id = (cur.id || '').toLowerCase();
        if (tag === 'header' || /header|nav/.test(id)) return 'header';
        if (tag === 'footer' || /footer/.test(id)) return 'footer';
        if (tag === 'aside' || /sidebar|aside/.test(id)) return 'sidebar';
        cur = cur.parentElement;
    }
    return 'body';
}

function __sw_detectVariant(el) {
    const cls = ((typeof el.className === 'string') ? el.className : '').toLowerCase();
    if (/primary|cta-primary/.test(cls)) return 'primary';
    if (/secondary|cta-secondary/.test(cls)) return 'secondary';
    if (/wixui-button/.test(cls)) return 'primary';
    return 'default';
}

function __sw_getScrollAtClickPercent() {
    try {
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        if (docHeight <= 0) return 0;
        return Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
    } catch (e) { return 0; }
}

function __sw_getTimeOnPageSeconds() {
    if (!__sw_page_ready_ts) return 0;
    return Math.floor((Date.now() - __sw_page_ready_ts) / 1000);
}

function __sw_getCtaViewportTimeSeconds(el) {
    if (!__sw_cta_view_accums) return 0;
    let accum = __sw_cta_view_accums.get(el) || 0;
    const start = __sw_cta_view_starts.get(el);
    if (start) accum += (Date.now() - start);
    return Math.floor(accum / 1000);
}

function __sw_getPriorCtaClicksInSession() {
    try {
        const v = parseInt(window.sessionStorage.getItem('__sw_cta_clicks') || '0', 10);
        return isFinite(v) ? v : 0;
    } catch (e) { return 0; }
}

function __sw_incrementCtaClicksInSession() {
    try {
        window.sessionStorage.setItem('__sw_cta_clicks', String(__sw_getPriorCtaClicksInSession() + 1));
    } catch (e) { /* ignore */ }
}

function __sw_getCtaPositionPercent(el) {
    try {
        const rect = el.getBoundingClientRect();
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (docHeight <= 0) return 0;
        const absTop = rect.top + window.scrollY;
        return Math.min(100, Math.max(0, Math.round((absTop / docHeight) * 100)));
    } catch (e) { return 0; }
}

function __sw_handleClickEvent(ev) {
    try {
        const el = ev.target && ev.target.closest && ev.target.closest('a, button');
        const cta = el ? __sw_classifyCta(el) : null;
        __sw_pushClickContext(el, cta);
        if (cta) {
            __sw_incrementCtaClicksInSession();
            __sw_pushCtaClick(el, cta);
        }
    } catch (e) { /* never crash the page */ }
}

function __sw_pushClickContext(el, cta) {
    if (typeof window === 'undefined' || !window.dataLayer) return;
    const payload = {
        event: 'sw_click_context',
        scroll_at_click: __sw_getScrollAtClickPercent(),
        time_on_page_seconds: __sw_getTimeOnPageSeconds()
    };
    if (cta && el) {
        payload.cta_label = cta.label || '';
        payload.cta_location = cta.location || '';
        payload.cta_variant = cta.variant || '';
        payload.cta_position_percent = __sw_getCtaPositionPercent(el);
        payload.cta_viewport_time_seconds = __sw_getCtaViewportTimeSeconds(el);
        payload.prior_cta_clicks_in_session = __sw_getPriorCtaClicksInSession();
        payload._sw_cta_classifier = cta.source;
    }
    window.dataLayer.push(payload);
}

function __sw_pushCtaClick(el, cta) {
    if (typeof window === 'undefined') return;
    sw_push('cta_click', {
        cta_label: cta.label || '',
        cta_location: cta.location || '',
        cta_variant: cta.variant || '',
        cta_position_percent: __sw_getCtaPositionPercent(el),
        cta_viewport_time_seconds: __sw_getCtaViewportTimeSeconds(el),
        prior_cta_clicks_in_session: __sw_getPriorCtaClicksInSession(),
        scroll_at_click: __sw_getScrollAtClickPercent(),
        time_on_page_seconds: __sw_getTimeOnPageSeconds(),
        _sw_cta_classifier: cta.source
    });
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

// ============================================================================
// extractBlogContext — DOM-scrape the current blog post for view_blog_post
// dimensions. Called by masterPage.js on /post/<slug> pages, the result is
// merged into __sw_context BEFORE the sw_page_context push so view_blog_post
// (and any later cta_click / outbound_click on the same post) read populated
// values via DLVs.
//
// What's reliable (always present in static HTML, server-rendered by Wix):
//   - og:title / article:author / article:published_time / article:modified_time
//   - schema.org BlogPosting JSON-LD (headline / author.name / datePublished / dateModified)
//   - data-hook="time-to-read" element text ("X min read")
//   - data-hook="post-title" text
//
// What's NOT reliable on DOMContentLoaded (Wix loads via React after hydration):
//   - post category — fall back to classifyPostCategory(slug, title)
//   - post tags — try meta article:tag; otherwise leave blank
//   - exact word count — derive from reading_time × 200 (Wix's own divisor)
//   - reviewed_by — scan body text for "Reviewed by: <name>" pattern; fall back
//     to "Dr. Kiesa Kelly" (canonical ScienceWorks reviewer)
//
// Returns a flat object suitable for Object.assign-merge into __sw_context.
// Never throws — every read is wrapped to fail soft to '' or 0.
// ============================================================================
function extractBlogContext(pathname) {
    if (typeof document === 'undefined' || typeof window === 'undefined') return {};

    const out = {
        post_slug:                   '',
        post_title:                  '',
        post_category:               '',
        post_author:                 '',
        post_tags:                   '',
        post_word_count:             0,
        post_reading_time_minutes:   0,
        post_publish_date:           '',
        post_days_since_publish:     0,
        post_update_date:            '',
        post_reviewed_by:            '',
        post_topic_cluster:          'unassigned',
        post_funnel_stage:           'awareness'
    };

    // ----- post_slug — last path segment of /post/<slug> ---------------------
    try {
        const path = (pathname || (window.location && window.location.pathname) || '').toLowerCase().replace(/\/$/, '');
        const m = path.match(/^\/post\/([^\/?#]+)/);
        if (m) out.post_slug = m[1];
    } catch (e) { /* leave blank */ }

    // ----- post_title — og:title meta first, then h1, then document.title ---
    try {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) out.post_title = ogTitle.content.trim();
        if (!out.post_title) {
            const h1 = document.querySelector('h1, [data-hook="post-title"]');
            if (h1 && h1.textContent) out.post_title = h1.textContent.trim();
        }
        if (!out.post_title && document.title) {
            out.post_title = document.title.replace(/\s*[|\-–]\s*ScienceWorks.*$/i, '').trim();
        }
    } catch (e) { /* leave blank */ }

    // ----- post_author — article:author meta, then JSON-LD author.name ------
    try {
        const aMeta = document.querySelector('meta[property="article:author"], meta[name="author"]');
        if (aMeta && aMeta.content) out.post_author = aMeta.content.trim();
        if (!out.post_author) {
            const ldBlocks = document.querySelectorAll('script[type="application/ld+json"]');
            for (let i = 0; i < ldBlocks.length; i++) {
                try {
                    const data = JSON.parse(ldBlocks[i].textContent || '{}');
                    const blog = (Array.isArray(data) ? data : [data]).find(function (d) { return d && (d['@type'] === 'BlogPosting' || d['@type'] === 'Article'); });
                    if (blog && blog.author) {
                        out.post_author = (typeof blog.author === 'string') ? blog.author : (blog.author.name || '');
                        if (out.post_author) break;
                    }
                } catch (err) { /* skip malformed block */ }
            }
        }
    } catch (e) { /* leave blank */ }

    // ----- post_publish_date / post_update_date — meta tags (ISO 8601) ------
    try {
        const pubMeta = document.querySelector('meta[property="article:published_time"]');
        if (pubMeta && pubMeta.content) out.post_publish_date = pubMeta.content;
        const modMeta = document.querySelector('meta[property="article:modified_time"]');
        if (modMeta && modMeta.content) out.post_update_date = modMeta.content;
    } catch (e) { /* leave blank */ }

    // ----- post_days_since_publish — derive from post_publish_date ----------
    try {
        if (out.post_publish_date) {
            const ms = Date.now() - new Date(out.post_publish_date).getTime();
            if (isFinite(ms) && ms >= 0) out.post_days_since_publish = Math.floor(ms / 86400000);
        }
    } catch (e) { /* leave 0 */ }

    // ----- post_reading_time_minutes — data-hook="time-to-read" "X min read" -
    try {
        const ttr = document.querySelector('[data-hook="time-to-read"]');
        if (ttr && ttr.textContent) {
            const m = ttr.textContent.match(/(\d+)\s*min/i);
            if (m) out.post_reading_time_minutes = parseInt(m[1], 10) || 0;
        }
    } catch (e) { /* leave 0 */ }

    // ----- post_word_count — derive from reading_time × 200 (Wix's divisor) -
    if (out.post_reading_time_minutes > 0) {
        out.post_word_count = out.post_reading_time_minutes * 200;
    }

    // ----- post_tags — meta[property="article:tag"] (multiple) --------------
    try {
        const tagMetas = document.querySelectorAll('meta[property="article:tag"]');
        const tags = [];
        for (let i = 0; i < tagMetas.length; i++) {
            const v = (tagMetas[i].content || '').trim();
            if (v) tags.push(v.toLowerCase().replace(/\s+/g, '_'));
        }
        out.post_tags = tags.join(',');
    } catch (e) { /* leave blank */ }

    // ----- post_reviewed_by — scan body for "Reviewed by: <name>" -----------
    // Standard ScienceWorks blog template puts "Reviewed by: Dr. Kiesa Kelly"
    // (or other reviewer) in a header line near the top of every post.
    // Tightened pattern (Phase 2c.x rev 11): the prior `{2,60}` greedy capture
    // ran past the end of the name into the next paragraph because Wix's
    // textContent has no newline between header and body. Match a name shape
    // (Dr.? + 1-3 capitalized words) and stop before the next sentence-start
    // pattern (whitespace then a capital-followed-by-lowercase that's not
    // part of the name).
    try {
        const body = document.body && document.body.textContent || '';
        const m = body.match(/Reviewed by:\s*((?:Dr\.\s)?[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){0,2}(?:,\s[A-Z][a-zA-Z]+)?)/);
        if (m) {
            out.post_reviewed_by = m[1].trim();
        } else if (out.post_author) {
            // Fallback: ScienceWorks posts are always reviewed by Dr. Kelly.
            out.post_reviewed_by = 'Dr. Kiesa Kelly';
        }
    } catch (e) { /* leave blank */ }

    // ----- post_topic_cluster + post_funnel_stage — existing classifiers ----
    try {
        out.post_topic_cluster = classifyPost(out.post_slug, out.post_title);
        out.post_funnel_stage  = classifyFunnelStage(out.post_slug, out.post_title);
    } catch (e) { /* keep defaults */ }

    // ----- post_category — classifier fallback (Wix loads real category async) -
    try {
        out.post_category = classifyPostCategory(out.post_slug, out.post_title);
    } catch (e) { /* leave blank */ }

    return out;
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


    // ====== sw-screeners ======
// ============================================================================
// sw-screeners.js — Phase 3.4 (Option-2 privacy posture, 2026-04-25)
// Listener for assessment_score_interaction events from screener iframes
// ============================================================================
// The screener tools at /y-bocs, /asrs, /aq-10, /esq-r, /phq-9, /gad-7 are
// each rendered as a Wix HTML embed widget -- a cross-origin iframe whose
// `src` points at https://www-scienceworkshealth-com.filesusr.com/html/<hash>.html.
// The parent bundle CANNOT read into those iframes (browser cross-origin
// boundary, not a Wix limitation). The only viable path to fire
// assessment_score_interaction is for each screener's HTML embed source to
// call `parent.postMessage(...)` on score submission, and for the bundle to
// listen on the parent.
//
// PRIVACY POSTURE (Option 2, locked 2026-04-25):
//   This listener does NOT accept, log, or forward any of:
//     - score_value  (the user's raw screener result)
//     - score_band   (the categorical interpretation of the score)
//   Even if a screener emitter sends those fields, this listener strips them.
//   GA4, GTM, dataLayer -- nothing downstream of this listener ever sees a
//   user's screener result. The event is a "completed-a-screener" funnel
//   signal, not an outcome record.
//
// Emitter contract (paste at the bottom of each screener's "Calculate Score"
// handler -- see phase3-artifacts/screener-emitter-snippet.md for the
// universal snippet, identical across all 6 screeners):
//
//   parent.postMessage({
//       sw_event: 'assessment_score_interaction',
//       items_completed: <number>,           // optional, total items answered
//       time_to_complete_seconds: <number>   // optional, duration
//   }, 'https://www.scienceworkshealth.com');
//
// Emitters do NOT send assessment_name / assessment_category /
// assessment_age_range -- those are looked up on the parent side from
// ASSESSMENT_BY_PATH using the parent page's pathname. This keeps each
// screener's emitter snippet identical regardless of which screener it's in.
//
// Defenses:
//   1. Origin allowlist -- only messages from
//      https://www-scienceworkshealth-com.filesusr.com pass. All other
//      origins (and the special string "null" for sandboxed iframes) are
//      silently dropped.
//   2. Schema gate -- data must be an object with sw_event ===
//      'assessment_score_interaction'.
//   3. Path gate -- the parent must currently be on a known screener path
//      (one of the keys in ASSESSMENT_BY_PATH). A message arriving on, say,
//      /home is dropped (defensive: a stray message from any iframe, even
//      non-screener, is ignored unless we can confidently decorate it).
//   4. Score-strip -- if an emitter mistakenly sends `score_value` or
//      `score_band`, those fields are NEVER read into the payload. A
//      console.warn is emitted as a debuggability signal so the misconfigured
//      emitter can be fixed -- the score values themselves are never logged.
//   5. Numeric clamps -- items_completed 0..1000, time_to_complete_seconds
//      0..7200. Defends against bad emitter math.
//   6. Dedupe -- identical payload signature within 1500ms is dropped
//      (defends against double-fire if an emitter accidentally invokes
//      postMessage twice).
//
// Observability (window globals, useful for the smoke-test one-liner in
// REFERENCE.md):
//   window.__sw_screeners_listener_installed -- true once the message
//                                               listener is attached
//   window.__sw_screener_msgs_seen           -- counter of recognized
//                                               sw_event messages (passes
//                                               origin + schema gates)
//   window.__sw_screener_last_event          -- last accepted payload
//                                               { ts, path, payload }
// ============================================================================

const SW_SCREENER_ORIGIN     = 'https://www-scienceworkshealth-com.filesusr.com';
const SW_SCREENER_DEDUPE_MS  = 1500;
var __sw_screener_last_sig   = '';
var __sw_screener_last_ts    = 0;

function handleScreenerMessage(e) {
    // 1) Origin gate -- only Wix HTML embed iframe origin
    if (!e || e.origin !== SW_SCREENER_ORIGIN) return;

    // 2) Schema gate
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    if (data.sw_event !== 'assessment_score_interaction') return;

    // Recognized -- count it (observability), even if downstream gates fail
    window.__sw_screener_msgs_seen = (window.__sw_screener_msgs_seen || 0) + 1;

    // 3) Score-strip defensive check.  If an emitter sent score data despite
    // the contract, log a console warning (without leaking the values) and
    // proceed -- the payload-build step below ignores those fields anyway.
    if (('score_value' in data) || ('score_band' in data)) {
        if (typeof console !== 'undefined') {
            console.warn('[sw] screener emitter sent score data — fields ignored per privacy policy. Update the emitter to drop score_value and score_band.');
        }
    }

    // 4) Path gate + decoration
    const path = (window.location && window.location.pathname || '').toLowerCase().replace(/\/$/, '') || '/';
    const meta = ASSESSMENT_BY_PATH[path];
    if (!meta) return;

    // 5) Numeric clamps for the only two emitter-provided fields we accept
    function clamp(n, lo, hi) { return Math.min(Math.max(n, lo), hi); }
    const itemsRaw = Number(data.items_completed);
    const items    = Number.isFinite(itemsRaw) ? clamp(itemsRaw, 0, 1000) : null;
    const timeRaw  = Number(data.time_to_complete_seconds);
    const seconds  = Number.isFinite(timeRaw) ? clamp(timeRaw, 0, 7200) : null;

    // 6) Dedupe (same exact payload within 1.5s = drop)
    const sig = path + '|' + items + '|' + seconds;
    const now = Date.now();
    if (sig === __sw_screener_last_sig && (now - __sw_screener_last_ts) < SW_SCREENER_DEDUPE_MS) {
        return;
    }
    __sw_screener_last_sig = sig;
    __sw_screener_last_ts  = now;

    // 7) Build payload + push.  Score data is never read.
    const payload = {
        assessment_name:      meta.assessment_name,
        assessment_category:  meta.assessment_category,
        assessment_age_range: meta.assessment_age_range
    };
    if (items   !== null) payload.items_completed = items;
    if (seconds !== null) payload.time_to_complete_seconds = seconds;

    try {
        sw_push('assessment_score_interaction', payload);
        window.__sw_screener_last_event = { ts: now, path: path, payload: payload };
    } catch (err) {
        if (typeof console !== 'undefined') {
            console.warn('[sw] screener push failed:', err);
        }
    }
}

function initScreenerListener() {
    if (window.__sw_screeners_listener_installed) return;
    window.__sw_screeners_listener_installed = true;
    window.addEventListener('message', handleScreenerMessage);
}

    // ====== sw-embeds ======
// ============================================================================
// sw-embeds.js — Phase 5 (Embed Tracking, 2026-04-29)
// Listener for embed_* events from Wix HTML embed iframes (cross-origin
// filesusr.com).
// ============================================================================
// Wix HTML embeds render inside cross-origin iframes hosted at
// https://www-scienceworkshealth-com.filesusr.com. The parent bundle's
// document-level click/form listeners can't see DOM events inside those
// iframes — that's a hard browser security boundary. Phase 5 closes the
// "dark zone" by having each embed paste a small wrapper snippet that
// auto-emits parent.postMessage on click/focus/submit; this listener catches
// those messages on the parent side, applies origin + schema + privacy
// filters, and forwards as embed_* events through sw_push (which merges the
// __sw_context envelope automatically).
//
// EVENT FAMILY (v1):
//   embed_click             — <button> or [data-sw-track] click
//   embed_link_click        — <a> click (split off because anchors carry href
//                             metadata; mirrors the cta_click vs outbound_click
//                             distinction the bundle already makes for parent
//                             clicks)
//   embed_form_field_focus  — <input>/<textarea>/<select> focus inside an
//                             embed-internal <form>
//   embed_form_submit       — embed-internal <form> submit
//
// PRIVACY POSTURE (locked 2026-04-29 per Phase 5 spec § 5):
//   - text fields are trimmed and clamped to 100 chars
//   - href is clamped to 500 chars (query string stripped if length exceeds)
//   - track_label clamped to 50 chars
//   - form_id and field_name clamped to 80 chars
//   - field_type must be in an allowlist; anything else collapses to 'other'
//   - FORM FIELD VALUES are never read by the wrapper and never accepted by
//     this listener — if a malformed wrapper sends payload.value, the field
//     is silently dropped and a console.warn fires as a debugging breadcrumb
//   - clipboard contents are never tracked
//   - email/phone literals inside button labels are NOT auto-redacted
//     (the 100-char cap is the only protection); marketing should not put
//     literal contact strings in a CTA label — see OPERATIONS.md
//
// Emitter contract (paste at top of any HTML embed body — see
// phase5-artifacts/embed-tracking-wrapper.html for the canonical snippet,
// identical across all retrofitted embeds):
//
//   <script>
//   var EMBED_ID = 'home-cta-bar-mid';   // ← change this per embed
//   // ... wrapper auto-installs capture-phase listeners on click/focusin/submit
//   //     and emits parent.postMessage with the universal envelope:
//   //     { sw_event, embed_id, embed_path, timestamp_ms, payload }
//   </script>
//
// COEXISTENCE WITH sw-screeners:
//   sw-screeners listens for sw_event === 'assessment_score_interaction';
//   sw-embeds listens for sw_event matching /^embed_[a-z_]+$/. Both attach
//   their own message handler to window — each silently drops messages not
//   in its event family. No overlap, independent dedupe windows.
//
// DEFENSES (parent-side, applied in order):
//   1. Origin allowlist — only filesusr.com passes; all other origins
//      (and the special "null" string for sandboxed iframes) drop silently.
//   2. Schema gate — data must be an object with sw_event matching
//      /^embed_[a-z_]+$/, embed_id a non-empty string, embed_path a string,
//      timestamp_ms a finite positive number, payload an object.
//   3. embed_id sanitization — non-matching chars replaced with _, sliced
//      to 80 chars.
//   4. Dedupe — signature sw_event|embed_id|JSON.stringify(payload).
//      Identical signature within 200ms drops. Window shorter than the
//      screener's 1500ms because clicks are higher-frequency than screener
//      submits.
//   5. Privacy strip — see § 5 of the spec; applied to every payload field
//      regardless of what the wrapper sent.
//   6. Push — sw_push(data.sw_event, finalPayload) with embed_id and
//      parent_path decoration. sw_push merges __sw_context downstream.
//
// OBSERVABILITY (window globals; smoke-test one-liner in REFERENCE.md):
//   window.__sw_embeds_listener_installed  — true once handler attached
//   window.__sw_embed_msgs_seen            — counter of accepted msgs (passed
//                                            origin + schema gates AND
//                                            survived dedupe + privacy strip)
//   window.__sw_embed_last_event           — { ts, embed_id, sw_event,
//                                              payload } of last accepted msg
//   window.__sw_embed_msgs_dropped         — counter of dropped msgs (origin,
//                                            schema, dedupe, or privacy fail);
//                                            useful for debugging stuck embeds
// ============================================================================

const SW_EMBED_ORIGIN     = 'https://www-scienceworkshealth-com.filesusr.com';
const SW_EMBED_DEDUPE_MS  = 200;
const SW_EMBED_ID_RE      = /^embed_[a-z_]+$/;
const SW_EMBED_ID_CHAR_RE = /[^a-z0-9_-]/g;
const SW_EMBED_FIELD_TYPES = {
    text: 1, email: 1, tel: 1, number: 1, password: 1,
    textarea: 1, select: 1, checkbox: 1, radio: 1,
    date: 1, time: 1, url: 1, search: 1, other: 1
};
var __sw_embed_last_sig   = '';
var __sw_embed_last_ts    = 0;

function sanitizeEmbedId(raw) {
    if (typeof raw !== 'string') return '';
    return raw.toLowerCase().replace(SW_EMBED_ID_CHAR_RE, '_').slice(0, 80);
}

function clampString(raw, max) {
    if (typeof raw !== 'string') return '';
    return raw.slice(0, max);
}

function trimAndClamp(raw, max) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/\s+/g, ' ').trim().slice(0, max);
}

function sanitizeHref(raw) {
    if (typeof raw !== 'string') return '';
    if (raw.length <= 500) return raw;
    // If overlong, prefer to keep the path and drop the query. If the path
    // alone is still > 500, hard slice.
    const qIdx = raw.indexOf('?');
    if (qIdx > 0 && qIdx <= 500) return raw.slice(0, qIdx);
    return raw.slice(0, 500);
}

function sanitizeFieldType(raw) {
    if (typeof raw !== 'string') return 'other';
    const lower = raw.toLowerCase();
    return SW_EMBED_FIELD_TYPES[lower] ? lower : 'other';
}

function bumpEmbedDropped() {
    window.__sw_embed_msgs_dropped = (window.__sw_embed_msgs_dropped || 0) + 1;
}

function handleEmbedMessage(e) {
    // 1) Origin gate -- only Wix HTML embed iframe origin
    if (!e || e.origin !== SW_EMBED_ORIGIN) return;

    const data = e.data;

    // 2) Schema gate
    if (!data || typeof data !== 'object') return;
    if (typeof data.sw_event !== 'string' || !SW_EMBED_ID_RE.test(data.sw_event)) return;
    if (typeof data.embed_id !== 'string' || data.embed_id.length === 0) {
        bumpEmbedDropped();
        if (typeof console !== 'undefined') console.warn('[sw] embed message rejected: missing embed_id');
        return;
    }
    if (typeof data.embed_path !== 'string') {
        bumpEmbedDropped();
        if (typeof console !== 'undefined') console.warn('[sw] embed message rejected: missing embed_path');
        return;
    }
    const tsRaw = Number(data.timestamp_ms);
    if (!Number.isFinite(tsRaw) || tsRaw <= 0) {
        bumpEmbedDropped();
        if (typeof console !== 'undefined') console.warn('[sw] embed message rejected: bad timestamp_ms');
        return;
    }
    if (!data.payload || typeof data.payload !== 'object') {
        bumpEmbedDropped();
        if (typeof console !== 'undefined') console.warn('[sw] embed message rejected: missing payload');
        return;
    }

    // 3) embed_id sanitization
    const embedId = sanitizeEmbedId(data.embed_id);
    if (!embedId) {
        bumpEmbedDropped();
        if (typeof console !== 'undefined') console.warn('[sw] embed message rejected: embed_id empty after sanitize');
        return;
    }

    const swEvent  = data.sw_event;
    const embedPath = clampString(data.embed_path, 200);

    // 4) Dedupe (same exact event+id+payload within 200ms = drop)
    const sig = swEvent + '|' + embedId + '|' + (function () {
        try { return JSON.stringify(data.payload); }
        catch (err) { return '[unstringifiable]'; }
    })();
    const now = Date.now();
    if (sig === __sw_embed_last_sig && (now - __sw_embed_last_ts) < SW_EMBED_DEDUPE_MS) {
        bumpEmbedDropped();
        return;
    }
    __sw_embed_last_sig = sig;
    __sw_embed_last_ts  = now;

    // 5) Privacy strip — defensively whitelist every field, regardless of
    // what the wrapper sent. Form field VALUES are never accepted; if the
    // wrapper attempted to send a `value` field, drop it loudly.
    const rawPayload = data.payload;
    const cleanPayload = {};

    if ('value' in rawPayload) {
        if (typeof console !== 'undefined') {
            console.warn('[sw] embed wrapper sent payload.value — dropped. Form values must never leave the iframe. Update the emitter.');
        }
        // Don't return — strip the field but accept the rest.
    }

    if (typeof rawPayload.tag === 'string') {
        cleanPayload.tag = clampString(rawPayload.tag.toUpperCase(), 16);
    }
    if (typeof rawPayload.text === 'string') {
        cleanPayload.text = trimAndClamp(rawPayload.text, 100);
    }
    if (typeof rawPayload.href === 'string') {
        cleanPayload.href = sanitizeHref(rawPayload.href);
    }
    if (typeof rawPayload.track_label === 'string') {
        cleanPayload.track_label = clampString(rawPayload.track_label, 50);
    }
    if (typeof rawPayload.is_external === 'boolean') {
        cleanPayload.is_external = rawPayload.is_external;
    }
    if (typeof rawPayload.opens_new_tab === 'boolean') {
        cleanPayload.opens_new_tab = rawPayload.opens_new_tab;
    }
    if (typeof rawPayload.link_rel === 'string') {
        cleanPayload.link_rel = clampString(rawPayload.link_rel, 80);
    }
    if (typeof rawPayload.form_id === 'string') {
        cleanPayload.form_id = clampString(rawPayload.form_id, 80);
    }
    if (typeof rawPayload.field_name === 'string') {
        cleanPayload.field_name = clampString(rawPayload.field_name, 80);
    }
    if ('field_type' in rawPayload) {
        cleanPayload.field_type = sanitizeFieldType(rawPayload.field_type);
    }

    // 6) Build final payload + push. Add embed_id, embed_path, parent_path
    // decoration here. parent_path is the parent window's pathname, distinct
    // from embed_path (which is the iframe's own pathname, almost always
    // /html/<hash>.html — kept for forensic value, low analytics signal).
    const parentPath = (window.location && window.location.pathname || '').toLowerCase().replace(/\/$/, '') || '/';

    const finalPayload = {
        embed_id:    embedId,
        embed_path:  embedPath,
        parent_path: parentPath
    };
    // Merge cleaned payload keys (after the envelope keys so a malformed
    // wrapper can't overwrite embed_id or parent_path).
    for (const k in cleanPayload) {
        if (Object.prototype.hasOwnProperty.call(cleanPayload, k)) {
            if (k === 'embed_id' || k === 'embed_path' || k === 'parent_path') continue;
            finalPayload[k] = cleanPayload[k];
        }
    }

    try {
        sw_push(swEvent, finalPayload);
        window.__sw_embed_msgs_seen = (window.__sw_embed_msgs_seen || 0) + 1;
        window.__sw_embed_last_event = {
            ts: now,
            embed_id: embedId,
            sw_event: swEvent,
            payload: finalPayload
        };
    } catch (err) {
        bumpEmbedDropped();
        if (typeof console !== 'undefined') {
            console.warn('[sw] embed push failed:', err);
        }
    }
}

function initEmbedListener() {
    if (window.__sw_embeds_listener_installed) return;
    window.__sw_embeds_listener_installed = true;
    window.addEventListener('message', handleEmbedMessage);
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

        // -- Phase 2c.x: Blog post context (DOM scrape on /post/<slug>) ---
        let blogAttrs = {};
        if (pageType === 'blog_post') {
            try { blogAttrs = extractBlogContext(normalizedPath); } catch (e) { /* leave blank */ }
        }

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
            service_variant:           serviceAttrs.service_variant           || '',
            service_modality:          serviceAttrs.service_modality          || '',
            clinician_name:            clinicianAttrs.clinician_name          || '',
            clinician_role:            clinicianAttrs.clinician_role          || '',
            clinician_specialty_primary: clinicianAttrs.clinician_specialty_primary || '',
            clinician_primary_service: clinicianAttrs.clinician_primary_service || '',
            clinician_specialties:     Array.isArray(clinicianAttrs.clinician_specialties)
                                        ? clinicianAttrs.clinician_specialties.join(',')
                                        : (clinicianAttrs.clinician_specialties || ''),
            clinician_takes_insurance: typeof clinicianAttrs.clinician_takes_insurance === 'boolean'
                                        ? clinicianAttrs.clinician_takes_insurance : '',
            clinician_accepting_new:   typeof clinicianAttrs.clinician_accepting_new === 'boolean'
                                        ? clinicianAttrs.clinician_accepting_new : '',
            assessment_name:           assessmentAttrs.assessment_name        || '',
            assessment_category:       assessmentAttrs.assessment_category    || '',
            assessment_age_range:      assessmentAttrs.assessment_age_range   || '',
            assessment_self_scoring:   typeof assessmentAttrs.assessment_self_scoring === 'boolean'
                                        ? assessmentAttrs.assessment_self_scoring : '',

            // Phase 2c.x: Blog post (populated only on /post/<slug> pages)
            post_slug:                 blogAttrs.post_slug                || '',
            post_title:                blogAttrs.post_title               || '',
            post_category:             blogAttrs.post_category            || '',
            post_author:               blogAttrs.post_author              || '',
            post_tags:                 blogAttrs.post_tags                || '',
            post_word_count:           blogAttrs.post_word_count          || 0,
            post_reading_time_minutes: blogAttrs.post_reading_time_minutes || 0,
            post_publish_date:         blogAttrs.post_publish_date        || '',
            post_days_since_publish:   blogAttrs.post_days_since_publish  || 0,
            post_update_date:          blogAttrs.post_update_date         || '',
            post_reviewed_by:          blogAttrs.post_reviewed_by         || '',
            post_topic_cluster:        blogAttrs.post_topic_cluster       || '',
            post_funnel_stage:         blogAttrs.post_funnel_stage        || '',

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

        // -- Phase 3.4: Screeners ---------------------------------------
        // The screener tools at /asrs, /y-bocs, /aq-10, /esq-r, /phq-9,
        // /gad-7 run inside Wix HTML embed iframes hosted on
        // *.filesusr.com -- cross-origin to the parent page. The bundle
        // cannot reach into those iframes, so each screener's HTML embed
        // is responsible for posting a message to the parent on submit;
        // this listener catches it and forwards as
        // assessment_score_interaction. Idempotent -- safe to call on
        // every SPA-nav re-bootstrap.
        try { initScreenerListener();              } catch (e) { /* non-fatal */ }

        // -- Phase 5: Embed tracking ------------------------------------
        // Same cross-origin pattern as Phase 3.4, generalized: any Wix
        // HTML embed (filesusr.com iframe) on the site can paste the
        // canonical wrapper snippet (phase5-artifacts/embed-tracking-
        // wrapper.html) at the top of its body and instantly opt into
        // tracking. Wrapper auto-emits parent.postMessage on click,
        // focusin, and submit; this listener applies origin + schema +
        // privacy filters and forwards as embed_click,
        // embed_link_click, embed_form_field_focus, or embed_form_submit
        // through sw_push. Idempotent -- safe to call on every SPA-nav
        // re-bootstrap. Coexists with initScreenerListener -- each owns
        // its own message-event family with no overlap.
        try { initEmbedListener();                 } catch (e) { /* non-fatal */ }

        // -- Phase 2c.x: Click context handler ---------------------------
        try { initClickContext();                  } catch (e) { /* non-fatal */ }
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
    // IIFE — callers should never reach into session/scoring/taxonomy state
    // directly; they go through sw_push.
    // ------------------------------------------------------------------------
    window.sw_push = sw_push;

})();
