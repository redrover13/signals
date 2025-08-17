/**
 * GA4 Android Tracking Utility
 * 
 * This module provides a centralized Analytics Manager for tracking events in Google Analytics 4
 * for Android applications. It wraps the Firebase Analytics SDK to ensure consistent event tracking
 * across the application.
 */

package com.saigonsignals.analytics.tracking

import android.os.Bundle
import android.util.Log
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.ktx.analytics
import com.google.firebase.analytics.ktx.logEvent
import com.google.firebase.ktx.Firebase

/**
 * Data classes for event parameters based on event-taxonomy.yaml
 */

/** Parameters for page view events */
data class PageViewParams(
    val pageLocation: String? = null,
    val pageTitle: String? = null,
    val pagePath: String? = null
)

/** Parameters for login events */
data class LoginParams(
    val method: String,
    val userId: String? = null
)

/** Parameters for sign up events */
data class SignUpParams(
    val method: String,
    val userId: String? = null
)

/** Parameters for purchase events */
data class PurchaseParams(
    val transactionId: String,
    val value: Double,
    val currency: String,
    val items: List<Bundle>? = null,
    val tax: Double? = null,
    val shipping: Double? = null
)

/** Parameters for form submission events */
data class FormSubmissionParams(
    val formId: String,
    val formName: String? = null,
    val formDestination: String? = null
)

/**
 * GA4 Android Analytics Manager
 * Provides a singleton interface for tracking events, screen views, and user properties
 */
class AnalyticsManager private constructor() {
    
    companion object {
        private const val TAG = "GA4Analytics"
        
        /** Singleton instance */
        @JvmStatic
        val instance: AnalyticsManager by lazy { AnalyticsManager() }
    }
    
    private lateinit var firebaseAnalytics: FirebaseAnalytics
    private var debugMode: Boolean = false
    
    /**
     * Initialize Analytics Manager
     * @param firebaseAnalytics Firebase Analytics instance
     * @param debug Enable debug logging
     */
    fun initialize(firebaseAnalytics: FirebaseAnalytics, debug: Boolean = false) {
        this.firebaseAnalytics = firebaseAnalytics
        this.debugMode = debug
        
        if (debug) {
            Log.d(TAG, "Analytics Manager initialized with debug mode")
        }
    }
    
    /**
     * Track a page view (screen view in mobile context)
     * @param params Page view parameters
     */
    fun trackPageView(params: PageViewParams) {
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW) {
            params.pageLocation?.let { param(FirebaseAnalytics.Param.SCREEN_NAME, it) }
            params.pageTitle?.let { param("page_title", it) }
            params.pagePath?.let { param("page_path", it) }
        }
        
        if (debugMode) {
            Log.d(TAG, "Page view tracked: $params")
        }
    }
    
    /**
     * Track a login event
     * @param params Login parameters
     */
    fun trackLogin(params: LoginParams) {
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.LOGIN) {
            param(FirebaseAnalytics.Param.METHOD, params.method)
            params.userId?.let { param("user_id", it) }
        }
        
        if (debugMode) {
            Log.d(TAG, "Login tracked: $params")
        }
    }
    
    /**
     * Track a sign up event
     * @param params Sign up parameters
     */
    fun trackSignUp(params: SignUpParams) {
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SIGN_UP) {
            param(FirebaseAnalytics.Param.METHOD, params.method)
            params.userId?.let { param("user_id", it) }
        }
        
        if (debugMode) {
            Log.d(TAG, "Sign up tracked: $params")
        }
    }
    
    /**
     * Track a purchase event
     * @param params Purchase parameters
     */
    fun trackPurchase(params: PurchaseParams) {
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.PURCHASE) {
            param(FirebaseAnalytics.Param.TRANSACTION_ID, params.transactionId)
            param(FirebaseAnalytics.Param.VALUE, params.value)
            param(FirebaseAnalytics.Param.CURRENCY, params.currency)
            params.items?.let { param(FirebaseAnalytics.Param.ITEMS, it.toTypedArray()) }
            params.tax?.let { param(FirebaseAnalytics.Param.TAX, it) }
            params.shipping?.let { param(FirebaseAnalytics.Param.SHIPPING, it) }
        }
        
        if (debugMode) {
            Log.d(TAG, "Purchase tracked: $params")
        }
    }
    
    /**
     * Track a form submission event
     * @param params Form submission parameters
     */
    fun trackFormSubmission(params: FormSubmissionParams) {
        val bundle = Bundle().apply {
            putString("form_id", params.formId)
            params.formName?.let { putString("form_name", it) }
            params.formDestination?.let { putString("form_destination", it) }
        }
        
        firebaseAnalytics.logEvent("form_submission", bundle)
        
        if (debugMode) {
            Log.d(TAG, "Form submission tracked: $params")
        }
    }
    
    /**
     * Track a custom event
     * @param eventName The name of the event
     * @param parameters The parameters for the event
     */
    fun trackEvent(eventName: String, parameters: Bundle? = null) {
        firebaseAnalytics.logEvent(eventName, parameters)
        
        if (debugMode) {
            Log.d(TAG, "Event tracked: $eventName")
            parameters?.let { 
                Log.d(TAG, "Parameters: ${bundleToString(it)}")
            }
        }
    }
    
    /**
     * Log an event to Firebase Analytics
     * @param name Event name
     * @param parameters Event parameters
     */
    fun logEvent(name: String, parameters: Bundle? = null) {
        firebaseAnalytics.logEvent(name, parameters)
        
        if (debugMode) {
            Log.d(TAG, "Event: $name")
            parameters?.let {
                Log.d(TAG, "Parameters: ${bundleToString(it)}")
            }
        }
    }
    
    /**
     * Set user properties
     * @param properties Map of user properties
     */
    fun setUserProperties(properties: Map<String, String>) {
        properties.forEach { (key, value) ->
            firebaseAnalytics.setUserProperty(key, value)
        }
        
        if (debugMode) {
            Log.d(TAG, "User properties set: $properties")
        }
    }
    
    /**
     * Set user ID for cross-device tracking
     * @param userId The user ID to set
     */
    fun setUserId(userId: String) {
        firebaseAnalytics.setUserId(userId)
        
        if (debugMode) {
            Log.d(TAG, "User ID set: $userId")
        }
    }
    
    /**
     * Set analytics collection enabled
     * @param enabled Whether to enable analytics collection
     */
    fun setAnalyticsCollectionEnabled(enabled: Boolean) {
        firebaseAnalytics.setAnalyticsCollectionEnabled(enabled)
        
        if (debugMode) {
            Log.d(TAG, "Analytics collection ${if (enabled) "enabled" else "disabled"}")
        }
    }
    
    /**
     * Track a screen view with simplified parameters
     * @param screenName Name of the screen
     * @param screenClass Class of the screen (optional)
     */
    fun trackScreenView(screenName: String, screenClass: String? = null) {
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW) {
            param(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
            screenClass?.let { param(FirebaseAnalytics.Param.SCREEN_CLASS, it) }
        }
        
        if (debugMode) {
            Log.d(TAG, "Screen view tracked: $screenName (class: $screenClass)")
        }
    }
    
    /**
     * Track a button tap event
     * @param buttonName Name or identifier of the button
     * @param screenName Screen where the button was tapped
     */
    fun trackButtonTap(buttonName: String, screenName: String) {
        val bundle = Bundle().apply {
            putString("button_name", buttonName)
            putString("screen_name", screenName)
        }
        
        firebaseAnalytics.logEvent("button_tap", bundle)
        
        if (debugMode) {
            Log.d(TAG, "Button tap tracked: $buttonName on $screenName")
        }
    }
    
    /**
     * Track an error event
     * @param errorCode Error code
     * @param errorMessage Error message
     * @param screenName Screen where the error occurred (optional)
     */
    fun trackError(errorCode: String, errorMessage: String, screenName: String? = null) {
        val bundle = Bundle().apply {
            putString("error_code", errorCode)
            putString("error_message", errorMessage)
            screenName?.let { putString("screen_name", it) }
        }
        
        firebaseAnalytics.logEvent("error", bundle)
        
        if (debugMode) {
            Log.d(TAG, "Error tracked: $errorCode - $errorMessage (screen: $screenName)")
        }
    }
    
    /**
     * Helper function to convert Bundle to string for debugging
     */
    private fun bundleToString(bundle: Bundle): String {
        val keys = bundle.keySet()
        val stringBuilder = StringBuilder()
        stringBuilder.append("{")
        keys.forEach { key ->
            stringBuilder.append("$key=${bundle.get(key)}, ")
        }
        if (keys.isNotEmpty()) {
            stringBuilder.setLength(stringBuilder.length - 2)
        }
        stringBuilder.append("}")
        return stringBuilder.toString()
    }
}

/**
 * Extension functions for easier usage
 */

/** Extension to get Analytics Manager instance */
val analyticsManager: AnalyticsManager
    get() = AnalyticsManager.instance

/** Extension function to track events with DSL */
inline fun FirebaseAnalytics.trackEvent(name: String, block: Bundle.() -> Unit) {
    val bundle = Bundle().apply(block)
    this.logEvent(name, bundle)
}