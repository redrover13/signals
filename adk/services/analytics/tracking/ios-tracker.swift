//
//  GA4IOSTracker.swift
//  GA4 iOS Tracking Utility
//
//  This module provides a centralized Analytics Manager for tracking events in Google Analytics 4
//  for iOS applications. It wraps the Firebase Analytics SDK to ensure consistent event tracking
//  across the application.
//

import Foundation
import FirebaseAnalytics

// MARK: - Event Parameter Structures

/// Parameters for page view events
struct PageViewParams {
    let pageLocation: String?
    let pageTitle: String?
    let pagePath: String?
}

/// Parameters for login events
struct LoginParams {
    let method: String
    let userId: String?
}

/// Parameters for sign up events
struct SignUpParams {
    let method: String
    let userId: String?
}

/// Parameters for purchase events
struct PurchaseParams {
    let transactionId: String
    let value: Double
    let currency: String
    let items: [[String: Any]]?
    let tax: Double?
    let shipping: Double?
}

/// Parameters for form submission events
struct FormSubmissionParams {
    let formId: String
    let formName: String?
    let formDestination: String?
}

// MARK: - Analytics Manager

/// GA4 iOS Analytics Manager
/// Provides a singleton interface for tracking events, screen views, and user properties
public class AnalyticsManager {
    
    // MARK: - Singleton
    
    /// Shared instance of AnalyticsManager
    public static let shared = AnalyticsManager()
    
    // MARK: - Properties
    
    /// Debug mode flag
    private var debugMode: Bool = false
    
    // MARK: - Initialization
    
    private init() {
        // Private initializer to enforce singleton pattern
    }
    
    /// Initialize Analytics Manager
    /// - Parameter debug: Enable debug logging
    public func initialize(debug: Bool = false) {
        self.debugMode = debug
        
        if debug {
            print("GA4: Analytics Manager initialized with debug mode")
        }
    }
    
    // MARK: - Core Event Tracking
    
    /// Track a page view (screen view in mobile context)
    /// - Parameter params: Page view parameters
    public func trackPageView(params: PageViewParams) {
        var eventParams: [String: Any] = [:]
        
        if let pageLocation = params.pageLocation {
            eventParams[AnalyticsParameterScreenName] = pageLocation
        }
        if let pageTitle = params.pageTitle {
            eventParams["page_title"] = pageTitle
        }
        if let pagePath = params.pagePath {
            eventParams["page_path"] = pagePath
        }
        
        logEvent(AnalyticsEventScreenView, parameters: eventParams)
    }
    
    /// Track a login event
    /// - Parameter params: Login parameters
    public func trackLogin(params: LoginParams) {
        var eventParams: [String: Any] = [
            AnalyticsParameterMethod: params.method
        ]
        
        if let userId = params.userId {
            eventParams["user_id"] = userId
        }
        
        logEvent(AnalyticsEventLogin, parameters: eventParams)
    }
    
    /// Track a sign up event
    /// - Parameter params: Sign up parameters
    public func trackSignUp(params: SignUpParams) {
        var eventParams: [String: Any] = [
            AnalyticsParameterMethod: params.method
        ]
        
        if let userId = params.userId {
            eventParams["user_id"] = userId
        }
        
        logEvent(AnalyticsEventSignUp, parameters: eventParams)
    }
    
    /// Track a purchase event
    /// - Parameter params: Purchase parameters
    public func trackPurchase(params: PurchaseParams) {
        var eventParams: [String: Any] = [
            AnalyticsParameterTransactionID: params.transactionId,
            AnalyticsParameterValue: params.value,
            AnalyticsParameterCurrency: params.currency
        ]
        
        if let items = params.items {
            eventParams[AnalyticsParameterItems] = items
        }
        if let tax = params.tax {
            eventParams[AnalyticsParameterTax] = tax
        }
        if let shipping = params.shipping {
            eventParams[AnalyticsParameterShipping] = shipping
        }
        
        logEvent(AnalyticsEventPurchase, parameters: eventParams)
    }
    
    /// Track a form submission event
    /// - Parameter params: Form submission parameters
    public func trackFormSubmission(params: FormSubmissionParams) {
        var eventParams: [String: Any] = [
            "form_id": params.formId
        ]
        
        if let formName = params.formName {
            eventParams["form_name"] = formName
        }
        if let formDestination = params.formDestination {
            eventParams["form_destination"] = formDestination
        }
        
        logEvent("form_submission", parameters: eventParams)
    }
    
    // MARK: - Generic Event Tracking
    
    /// Track a custom event
    /// - Parameters:
    ///   - eventName: The name of the event
    ///   - parameters: The parameters for the event
    public func trackEvent(_ eventName: String, parameters: [String: Any]? = nil) {
        logEvent(eventName, parameters: parameters)
    }
    
    /// Log an event to Firebase Analytics
    /// - Parameters:
    ///   - name: Event name
    ///   - parameters: Event parameters
    public func logEvent(_ name: String, parameters: [String: Any]? = nil) {
        Analytics.logEvent(name, parameters: parameters)
        
        if debugMode {
            print("GA4 Event: \(name)")
            if let params = parameters {
                print("Parameters: \(params)")
            }
        }
    }
    
    // MARK: - User Properties
    
    /// Set user properties
    /// - Parameter properties: Dictionary of user properties
    public func setUserProperties(_ properties: [String: String]) {
        for (key, value) in properties {
            Analytics.setUserProperty(value, forName: key)
        }
        
        if debugMode {
            print("GA4 User Properties: \(properties)")
        }
    }
    
    /// Set user ID for cross-device tracking
    /// - Parameter userId: The user ID to set
    public func setUserId(_ userId: String) {
        Analytics.setUserID(userId)
        
        if debugMode {
            print("GA4 User ID set: \(userId)")
        }
    }
    
    /// Set analytics collection enabled
    /// - Parameter enabled: Whether to enable analytics collection
    public func setAnalyticsCollectionEnabled(_ enabled: Bool) {
        Analytics.setAnalyticsCollectionEnabled(enabled)
        
        if debugMode {
            print("GA4 Analytics collection \(enabled ? "enabled" : "disabled")")
        }
    }
}

// MARK: - Convenience Methods

extension AnalyticsManager {
    
    /// Track a screen view with simplified parameters
    /// - Parameters:
    ///   - screenName: Name of the screen
    ///   - screenClass: Class of the screen (optional)
    public func trackScreenView(screenName: String, screenClass: String? = nil) {
        var parameters: [String: Any] = [
            AnalyticsParameterScreenName: screenName
        ]
        
        if let screenClass = screenClass {
            parameters[AnalyticsParameterScreenClass] = screenClass
        }
        
        logEvent(AnalyticsEventScreenView, parameters: parameters)
    }
    
    /// Track a button tap event
    /// - Parameters:
    ///   - buttonName: Name or identifier of the button
    ///   - screenName: Screen where the button was tapped
    public func trackButtonTap(buttonName: String, screenName: String) {
        let parameters: [String: Any] = [
            "button_name": buttonName,
            "screen_name": screenName
        ]
        
        logEvent("button_tap", parameters: parameters)
    }
    
    /// Track an error event
    /// - Parameters:
    ///   - errorCode: Error code
    ///   - errorMessage: Error message
    ///   - screenName: Screen where the error occurred
    public func trackError(errorCode: String, errorMessage: String, screenName: String? = nil) {
        var parameters: [String: Any] = [
            "error_code": errorCode,
            "error_message": errorMessage
        ]
        
        if let screenName = screenName {
            parameters["screen_name"] = screenName
        }
        
        logEvent("error", parameters: parameters)
    }
}
