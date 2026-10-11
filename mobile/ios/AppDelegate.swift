//
//  AppDelegate.swift
//  DealBox Oman (WebView)
//
//  نقطة انطلاق التطبيق — تنشئ النافذة وتحمّل واجهة الويب.
//  لا حاجة لـ SceneDelegate: التطبيق يعمل بدورة حياة AppDelegate الكلاسيكية.
//

import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = WebViewController()
        window.makeKeyAndVisible()
        self.window = window
        return true
    }

    // دعم التدوير التلقائي — يُترك للواجهة الداخلية
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return .portrait
    }
}
