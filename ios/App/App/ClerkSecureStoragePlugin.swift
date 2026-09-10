import Foundation
import Security
import Capacitor

@objc(DreamGateSecureStoragePlugin)
public final class DreamGateSecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DreamGateSecureStoragePlugin"
    public let jsName = "DreamGateSecureStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getClientToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setClientToken", returnType: CAPPluginReturnPromise)
    ]

    private let account = "client-token"

    private var service: String {
        let bundleIdentifier = Bundle.main.bundleIdentifier ?? "com.dreamstate.app"
        return "\(bundleIdentifier).clerk.native-client"
    }

    private var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }

    @objc public func getClientToken(_ call: CAPPluginCall) {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecItemNotFound {
            call.resolve(["value": NSNull()])
            return
        }

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            call.reject("Unable to restore the secure Clerk session (Keychain status \(status)).")
            return
        }

        call.resolve(["value": token])
    }

    @objc public func setClientToken(_ call: CAPPluginCall) {
        guard let token = call.getString("value"), !token.isEmpty,
              let data = token.data(using: .utf8) else {
            call.reject("A non-empty Clerk client token is required.")
            return
        }

        let attributesToUpdate: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        let updateStatus = SecItemUpdate(
            baseQuery as CFDictionary,
            attributesToUpdate as CFDictionary
        )

        if updateStatus == errSecSuccess {
            call.resolve()
            return
        }

        guard updateStatus == errSecItemNotFound else {
            call.reject("Unable to update the secure Clerk session (Keychain status \(updateStatus)).")
            return
        }

        var newItem = baseQuery
        newItem[kSecValueData as String] = data
        newItem[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly

        let addStatus = SecItemAdd(newItem as CFDictionary, nil)
        guard addStatus == errSecSuccess else {
            call.reject("Unable to save the secure Clerk session (Keychain status \(addStatus)).")
            return
        }

        call.resolve()
    }
}

@objc(DreamGateBridgeViewController)
public final class DreamGateBridgeViewController: CAPBridgeViewController {
    public override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(DreamGateSecureStoragePlugin())
    }
}
