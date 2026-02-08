// utils/tracking.ts

import { db } from './db';

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    hasPerformedAction: boolean;
  }
}

/**
 * The internal tracking function.
 * @param eventName The name of the event.
 * @param payload Additional data associated with the event.
 */
const _track = async (eventName: string, payload: Record<string, any> = {}) => {
  try {
    const consentSetting = await db.settings.get('trackingConsent');
    
    // Only track if consent is explicitly true
    if (!consentSetting || consentSetting.value !== true) {
      return;
    }

    const eventData = {
      eventName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      payload,
    };

    // In a real application, this would send data to an analytics endpoint.
    // For this demo, we'll log it to the console.
    // e.g., navigator.sendBeacon('/api/track', JSON.stringify(eventData));
    console.log('[Analytics Event]', eventData);

  } catch (error) {
    // Silently fail to avoid impacting user experience
    console.error('Error in tracking event:', error);
  }
};

/**
 * Tracks a system-level or passive event (e.g., app load, session end).
 * This does NOT mark the session as having user activity.
 */
export const trackEvent = async (eventName: string, payload: Record<string, any> = {}) => {
  await _track(eventName, payload);
};

/**
 * Tracks an active user interaction (e.g., clicking a save button, changing a filter).
 * This marks the session as having user activity, preventing it from being
 * labeled as "abandoned".
 */
export const trackUserAction = async (eventName: string, payload: Record<string, any> = {}) => {
  window.hasPerformedAction = true;
  await _track(eventName, payload);
};
