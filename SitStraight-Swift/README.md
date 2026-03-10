# SitStraight - Native Swift Version

This folder contains the complete native Swift/SwiftUI implementation of the SitStraight application.

## How to run this in Xcode:

1. Open Xcode and create a new **macOS App** project (Interface: SwiftUI, Language: Swift).
2. Delete the default `ContentView.swift` and `SitStraightApp.swift` (or whatever your app file is named).
3. Drag and drop all the files from this folder into your Xcode project.
4. **CRITICAL STEP (Camera Permission):**
   - Click on your project target in Xcode.
   - Go to the **Info** tab.
   - Add a new row: `Privacy - Camera Usage Description` (Key: `NSCameraUsageDescription`).
   - Set the value to something like: `"SitStraight needs camera access to detect your posture."`
   - Go to the **Signing & Capabilities** tab.
   - Under **App Sandbox**, check the box for **Camera**.
5. Build and Run (Cmd + R).

## Features Replicated:
- **Vision Framework Integration:** Replaces MediaPipe with Apple's native `VNDetectHumanBodyPoseRequest` for highly efficient, on-device machine learning posture detection.
- **Dynamic Island UI:** Fully replicated using SwiftUI's `.animation(.spring(...))` for the exact same fluid layout transitions.
- **Pomodoro Timer:** Built with Combine and `Timer.publish`.
- **Posture Logic:** Includes the exact same math for tilt detection, slouch detection, distance monitoring, and the newly added "Leaning Forward" ratio detection.
