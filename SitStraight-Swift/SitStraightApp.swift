import SwiftUI

@main
struct SitStraightApp: App {
    @StateObject private var postureDetector = PostureDetector()
    @StateObject private var pomodoroTimer = PomodoroTimer()

    var body: some Scene {
        WindowGroup {
            ZStack(alignment: .top) {
                ContentView()
                    .environmentObject(postureDetector)
                    .environmentObject(pomodoroTimer)

                DynamicIslandView(
                    state: determineIslandState(),
                    timeLeft: pomodoroTimer.timeLeft,
                    isCameraEnabled: postureDetector.isEnabled
                )
                .padding(.top, 16)
            }
            .frame(minWidth: 800, minHeight: 600)
            .background(Color(NSColor.windowBackgroundColor))
        }
        // Hide title bar for a cleaner look similar to the web version
        .windowStyle(HiddenTitleBarWindowStyle())
    }

    private func determineIslandState() -> IslandState {
        if pomodoroTimer.state == .rest { return .rest }
        if !postureDetector.isEnabled { return .hidden }

        switch postureDetector.currentState {
        case .slouch: return .warningSlouch
        case .leanForward: return .warningLeanForward
        case .tooClose: return .warningTooClose
        case .tooFar: return .warningTooFar
        case .tiltLeft: return .warningLeft
        case .tiltRight: return .warningRight
        case .good: return .good
        default: break
        }

        if pomodoroTimer.isActive { return .idle }
        return .hidden
    }
}
