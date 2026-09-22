/**
 * Storage Adapter for Career Compass AI
 * 
 * Implements the Product-Led Growth (PLG) storage separation:
 * - Anonymous Guests: In-flight resume, job description, and gap analysis reside strictly
 *   in browser `sessionStorage`. Closing the tab/window purges all data for complete privacy.
 * - Authenticated Users: Data is persisted in `localStorage` strictly scoped to `userId`
 *   (`career_compass_*_${userId}`). This guarantees complete data isolation between accounts.
 * - State Stashing: Temporarily preserves in-flight analysis during the AuthModal sign-in/up flow.
 */

import { GapAnalysisResponse } from '../types';

export const STORAGE_KEYS = {
  CURRENT_PAGE: 'career_compass_current_page',
  ACTIVE_ANALYSIS_ID: 'career_compass_active_analysis_id',
  ANALYSIS_DATA: 'career_compass_analysis_data',
  ACTIVE_JOB_TITLE: 'career_compass_active_job_title',
  EXTRACTED_RESUME: 'career_compass_extracted_resume',
  PROFILE_ID: 'career_compass_profile_id',
  RAW_JD: 'career_compass_raw_jd',
  JOB_ID: 'career_compass_job_id',
  SAVED_ROADMAPS: 'career_compass_saved_roadmaps',
  ACTIVE_ROADMAP_ID: 'career_compass_active_roadmap_id',
  COPILOT_MESSAGES: 'career_compass_copilot_messages',
  STASHED_ANALYSIS: 'career_compass_stashed_analysis',
};

export interface StashedAnalysisState {
  analysisId: string | null;
  analysisData: GapAnalysisResponse | null;
  jobTitle: string;
  weeklyHours?: number;
  durationWeeks?: number;
}

export const storageAdapter = {
  /**
   * Returns sessionStorage for guests, localStorage for authenticated users.
   */
  getStorage(isAuthenticated: boolean): Storage {
    if (typeof window === 'undefined') {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };
    }
    return isAuthenticated ? window.localStorage : window.sessionStorage;
  },

  /**
   * Resolves storage key: scoped by userId for authenticated users,
   * un-scoped for guest sessionStorage.
   */
  resolveKey(baseKey: string, isAuthenticated: boolean, userId?: string | null): string {
    if (isAuthenticated && userId) {
      return `${baseKey}_${userId}`;
    }
    return baseKey;
  },

  // -------------------------------------------------------------
  // Analysis & Resume Session Management
  // -------------------------------------------------------------

  getAnalysisData(isAuthenticated: boolean, userId?: string | null): GapAnalysisResponse | null {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.resolveKey(STORAGE_KEYS.ANALYSIS_DATA, isAuthenticated, userId);
      const data = storage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (err) {
      console.warn('Could not parse analysis data from storage:', err);
    }
    return null;
  },

  setAnalysisData(isAuthenticated: boolean, data: GapAnalysisResponse | null, userId?: string | null): void {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.resolveKey(STORAGE_KEYS.ANALYSIS_DATA, isAuthenticated, userId);
      if (data) {
        storage.setItem(key, JSON.stringify(data));
      } else {
        storage.removeItem(key);
      }
    } catch {}
  },

  getActiveAnalysisId(isAuthenticated: boolean, userId?: string | null): string | null {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.ACTIVE_ANALYSIS_ID, isAuthenticated, userId);
    return storage.getItem(key);
  },

  setActiveAnalysisId(isAuthenticated: boolean, id: string | null, userId?: string | null): void {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.ACTIVE_ANALYSIS_ID, isAuthenticated, userId);
    if (id) {
      storage.setItem(key, id);
    } else {
      storage.removeItem(key);
    }
  },

  getActiveJobTitle(isAuthenticated: boolean, userId?: string | null): string {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.ACTIVE_JOB_TITLE, isAuthenticated, userId);
    return storage.getItem(key) || '';
  },

  setActiveJobTitle(isAuthenticated: boolean, title: string, userId?: string | null): void {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.ACTIVE_JOB_TITLE, isAuthenticated, userId);
    if (title) {
      storage.setItem(key, title);
    } else {
      storage.removeItem(key);
    }
  },

  getExtractedResume(isAuthenticated: boolean, userId?: string | null): any | null {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.resolveKey(STORAGE_KEYS.EXTRACTED_RESUME, isAuthenticated, userId);
      const data = storage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  },

  setExtractedResume(isAuthenticated: boolean, resume: any | null, userId?: string | null): void {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.resolveKey(STORAGE_KEYS.EXTRACTED_RESUME, isAuthenticated, userId);
      if (resume) {
        storage.setItem(key, JSON.stringify(resume));
      } else {
        storage.removeItem(key);
      }
    } catch {}
  },

  getRawJd(isAuthenticated: boolean, userId?: string | null): string {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.RAW_JD, isAuthenticated, userId);
    return storage.getItem(key) || '';
  },

  setRawJd(isAuthenticated: boolean, rawJd: string, userId?: string | null): void {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.RAW_JD, isAuthenticated, userId);
    if (rawJd) {
      storage.setItem(key, rawJd);
    } else {
      storage.removeItem(key);
    }
  },

  getProfileId(isAuthenticated: boolean, userId?: string | null): string | null {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.PROFILE_ID, isAuthenticated, userId);
    return storage.getItem(key);
  },

  setProfileId(isAuthenticated: boolean, profileId: string | null, userId?: string | null): void {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.PROFILE_ID, isAuthenticated, userId);
    if (profileId) {
      storage.setItem(key, profileId);
    } else {
      storage.removeItem(key);
    }
  },

  getJobId(isAuthenticated: boolean, userId?: string | null): string | null {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.JOB_ID, isAuthenticated, userId);
    return storage.getItem(key);
  },

  setJobId(isAuthenticated: boolean, jobId: string | null, userId?: string | null): void {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.JOB_ID, isAuthenticated, userId);
    if (jobId) {
      storage.setItem(key, jobId);
    } else {
      storage.removeItem(key);
    }
  },

  // -------------------------------------------------------------
  // Roadmaps Management (Scoped)
  // -------------------------------------------------------------

  getSavedRoadmaps(isAuthenticated: boolean, userId?: string | null): any[] {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.resolveKey(STORAGE_KEYS.SAVED_ROADMAPS, isAuthenticated, userId);
      const data = storage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  setSavedRoadmaps(isAuthenticated: boolean, roadmaps: any[], userId?: string | null): void {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.resolveKey(STORAGE_KEYS.SAVED_ROADMAPS, isAuthenticated, userId);
      storage.setItem(key, JSON.stringify(roadmaps));
    } catch {}
  },

  getActiveRoadmapId(isAuthenticated: boolean, userId?: string | null): string {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.ACTIVE_ROADMAP_ID, isAuthenticated, userId);
    return storage.getItem(key) || '';
  },

  setActiveRoadmapId(isAuthenticated: boolean, id: string | null, userId?: string | null): void {
    const storage = this.getStorage(isAuthenticated);
    const key = this.resolveKey(STORAGE_KEYS.ACTIVE_ROADMAP_ID, isAuthenticated, userId);
    if (id) {
      storage.setItem(key, id);
    } else {
      storage.removeItem(key);
    }
  },

  // -------------------------------------------------------------
  // Chat History Management
  // -------------------------------------------------------------

  getChatKey(userId?: string | null): string {
    return userId ? `${STORAGE_KEYS.COPILOT_MESSAGES}_${userId}` : `${STORAGE_KEYS.COPILOT_MESSAGES}_guest`;
  },

  getChatMessages(isAuthenticated: boolean, userId?: string | null): any[] {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.getChatKey(userId);
      const data = storage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  setChatMessages(isAuthenticated: boolean, messages: any[], userId?: string | null): void {
    try {
      const storage = this.getStorage(isAuthenticated);
      const key = this.getChatKey(userId);
      storage.setItem(key, JSON.stringify(messages));
    } catch {}
  },

  // -------------------------------------------------------------
  // State Stashing for Login Gate
  // -------------------------------------------------------------

  /**
   * Stashes in-flight analysis when an unauthenticated guest clicks "Generate Roadmap".
   */
  stashAnalysis(state: StashedAnalysisState): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.STASHED_ANALYSIS, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not stash analysis state:', err);
    }
  },

  /**
   * Retrieves and removes stashed analysis after successful login.
   */
  popStashedAnalysis(): StashedAnalysisState | null {
    try {
      const stashed = sessionStorage.getItem(STORAGE_KEYS.STASHED_ANALYSIS);
      if (stashed) {
        sessionStorage.removeItem(STORAGE_KEYS.STASHED_ANALYSIS);
        return JSON.parse(stashed);
      }
    } catch (err) {
      console.warn('Could not pop stashed analysis:', err);
    }
    return null;
  },

  hasStashedAnalysis(): boolean {
    return Boolean(sessionStorage.getItem(STORAGE_KEYS.STASHED_ANALYSIS));
  },

  // -------------------------------------------------------------
  // Clean Slate & Reset Actions
  // -------------------------------------------------------------

  /**
   * Clears all guest session data, guaranteeing a clean slate.
   */
  clearGuestSession(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ANALYSIS_ID);
      sessionStorage.removeItem(STORAGE_KEYS.ANALYSIS_DATA);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB_TITLE);
      sessionStorage.removeItem(STORAGE_KEYS.EXTRACTED_RESUME);
      sessionStorage.removeItem(STORAGE_KEYS.PROFILE_ID);
      sessionStorage.removeItem(STORAGE_KEYS.RAW_JD);
      sessionStorage.removeItem(STORAGE_KEYS.JOB_ID);
      sessionStorage.removeItem(STORAGE_KEYS.COPILOT_MESSAGES);
      sessionStorage.removeItem(STORAGE_KEYS.SAVED_ROADMAPS);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ROADMAP_ID);
      sessionStorage.removeItem(STORAGE_KEYS.STASHED_ANALYSIS);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_PAGE);
      sessionStorage.removeItem(`${STORAGE_KEYS.COPILOT_MESSAGES}_guest`);
    } catch {}
  },

  /**
   * Purges legacy un-scoped data from previous builds to prevent cross-account bleeding.
   */
  clearLegacyUnscopedKeys(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ANALYSIS_ID);
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_DATA);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_JOB_TITLE);
      localStorage.removeItem(STORAGE_KEYS.EXTRACTED_RESUME);
      localStorage.removeItem(STORAGE_KEYS.PROFILE_ID);
      localStorage.removeItem(STORAGE_KEYS.RAW_JD);
      localStorage.removeItem(STORAGE_KEYS.JOB_ID);
      localStorage.removeItem(STORAGE_KEYS.SAVED_ROADMAPS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROADMAP_ID);
      localStorage.removeItem(STORAGE_KEYS.COPILOT_MESSAGES);
      localStorage.removeItem(`${STORAGE_KEYS.COPILOT_MESSAGES}_guest`);
    } catch {}
  },

  /**
   * Purges legacy unauthenticated data accidentally left in localStorage.
   */
  purgeLegacyGuestLocalStorage(): void {
    this.clearLegacyUnscopedKeys();
  },
};
