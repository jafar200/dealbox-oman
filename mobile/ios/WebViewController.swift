//
//  WebViewController.swift
//  DealBox Oman (WebView)
//
//  واجهة الويب الكاملة داخل التطبيق:
//  • تحميل الرابط المضبوط في startURL
//  • شريط حالة أثناء التحميل
//  • صفحة خطأ مع زر إعادة المحاولة
//  • زر الرجوع يتبع سجل الويب
//  • الروابط الخارجية (بريد/هاتف) تُفتح في تطبيقات النظام
//

import UIKit
import WebKit

final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    // ═══════════════════════════════════════════════════════════
    // ⚠️ عدّل هذا الرابط قبل النشر:
    //    • تجربة محلية (آيفون على نفس شبكة الواي فاي):
    //      http://192.168.x.x:3000/?portal=client   (IP جهازك)
    //    • إنتاج (بعد نشر الموقع على دومين حقيقي):
    //      https://dealbox.om/?portal=client
    // ═══════════════════════════════════════════════════════════
    private let startURL = URL(string: "https://dealbox.om/?portal=client")!

    private lazy var webView: WKWebView = {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.navigationDelegate = self
        wv.uiDelegate = self
        wv.allowsBackForwardNavigationGestures = true
        return wv
    }()

    private let progressView = UIProgressView(progressViewStyle: .default)
    private let activityIndicator = UIActivityIndicatorView(style: .large)
    private let errorLabel = UILabel()
    private let retryButton = UIButton(type: .system)

    private var observation: NSKeyValueObservation?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        observeProgress()
        load()
    }

    // MARK: - واجهة المستخدم

    private func setupUI() {
        view.backgroundColor = UIColor(red: 0.98, green: 0.97, blue: 0.99, alpha: 1) // #faf8ff

        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.progressTintColor = UIColor(red: 0, green: 0.41, blue: 0.28, alpha: 1) // #006948
        view.addSubview(progressView)
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 2),
        ])

        activityIndicator.center = view.center
        activityIndicator.color = UIColor(red: 0, green: 0.41, blue: 0.28, alpha: 1)
        activityIndicator.hidesWhenStopped = true
        view.addSubview(activityIndicator)

        errorLabel.numberOfLines = 0
        errorLabel.textAlignment = .center
        errorLabel.textColor = UIColor(red: 0.24, green: 0.29, blue: 0.26, alpha: 1)
        errorLabel.font = .systemFont(ofSize: 15)
        errorLabel.translatesAutoresizingMaskIntoConstraints = false
        errorLabel.isHidden = true
        view.addSubview(errorLabel)

        retryButton.setTitle("إعادة المحاولة", for: .normal)
        retryButton.backgroundColor = UIColor(red: 0, green: 0.41, blue: 0.28, alpha: 1)
        retryButton.setTitleColor(.white, for: .normal)
        retryButton.layer.cornerRadius = 10
        retryButton.translatesAutoresizingMaskIntoConstraints = false
        retryButton.isHidden = true
        retryButton.addTarget(self, action: #selector(retryTapped), for: .touchUpInside)
        view.addSubview(retryButton)

        NSLayoutConstraint.activate([
            errorLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            errorLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -20),
            errorLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            errorLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),

            retryButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            retryButton.topAnchor.constraint(equalTo: errorLabel.bottomAnchor, constant: 20),
            retryButton.widthAnchor.constraint(equalToConstant: 160),
            retryButton.heightAnchor.constraint(equalToConstant: 44),
        ])
    }

    private func observeProgress() {
        observation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] wv, _ in
            self?.progressView.progress = Float(wv.estimatedProgress)
            self?.progressView.isHidden = wv.estimatedProgress >= 1.0
        }
    }

    @objc private func retryTapped() {
        errorLabel.isHidden = true
        retryButton.isHidden = true
        load()
    }

    private func load() {
        activityIndicator.startAnimating()
        webView.load(URLRequest(url: startURL))
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        activityIndicator.startAnimating()
        progressView.isHidden = false
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activityIndicator.stopAnimating()
        progressView.isHidden = true
        errorLabel.isHidden = true
        retryButton.isHidden = true
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showError()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showError()
    }

    private func showError() {
        activityIndicator.stopAnimating()
        progressView.isHidden = true
        errorLabel.text = "لا يوجد اتصال بالإنترنت.\nتحقق من الشبكة ثم حاول مجدداً."
        errorLabel.isHidden = false
        retryButton.isHidden = false
    }

    // الروابط الخارجية (بريد/هاتف/واتساب) تُفتح في تطبيقات النظام
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        let scheme = url.scheme?.lowercased() ?? ""
        if ["mailto", "tel", "whatsapp", "sms"].contains(scheme) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
}
