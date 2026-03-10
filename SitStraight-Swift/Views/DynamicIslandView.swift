import SwiftUI

enum IslandState {
    case hidden, idle, warningLeft, warningRight, warningSlouch, warningLeanForward, warningTooClose, warningTooFar, rest, good
}

struct DynamicIslandView: View {
    var state: IslandState
    var timeLeft: Int
    var isCameraEnabled: Bool

    var body: some View {
        HStack {
            islandContent
        }
        .frame(width: islandSize.width, height: islandSize.height)
        .background(Color.black.opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: islandSize.cornerRadius, style: .continuous))
        .shadow(color: .black.opacity(0.2), radius: 20, x: 0, y: 10)
        // Spring animation to perfectly replicate the web version's Framer Motion feel
        .animation(.spring(response: 0.4, dampingFraction: 0.7, blendDuration: 0), value: state)
    }

    @ViewBuilder
    var islandContent: some View {
        switch state {
        case .idle, .hidden:
            HStack(spacing: 8) {
                Circle()
                    .fill(isCameraEnabled ? Color.green : Color.gray)
                    .frame(width: 8, height: 8)
                    .shadow(color: isCameraEnabled ? Color.green.opacity(0.6) : .clear, radius: 4)
                if state == .idle {
                    Text(formatTime(timeLeft))
                        .font(.system(.caption, design: .monospaced))
                        .foregroundColor(.gray)
                }
            }
        case .warningSlouch:
            warningView(icon: "arrow.up", text: "弯腰驼背了，请挺直腰板")
        case .warningLeanForward:
            warningView(icon: "arrow.down", text: "身体前倾了，请向后靠")
        case .warningTooClose:
            warningView(icon: "arrow.down.to.line", text: "离屏幕太近了，请保持距离")
        case .warningTooFar:
            warningView(icon: "arrow.up.to.line", text: "离屏幕太远了，请保持距离")
        case .warningLeft:
            warningView(icon: "arrow.left", text: "向左歪了，请向右偏头调整")
        case .warningRight:
            warningView(icon: "arrow.right", text: "向右歪了，请向左偏头调整")
        case .rest:
            HStack(spacing: 12) {
                Image(systemName: "cup.and.saucer.fill")
                    .font(.title3)
                    .foregroundColor(.green)
                VStack(alignment: .leading) {
                    Text("该休息了！").font(.subheadline).bold().foregroundColor(.white)
                    Text("点击查看放松动作").font(.caption).foregroundColor(.gray)
                }
            }
        case .good:
            HStack {
                Image(systemName: "checkmark.circle.fill").foregroundColor(.green)
                Text("坐姿端正").font(.subheadline).bold().foregroundColor(.green)
            }
        }
    }

    func warningView(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.red)
            Text(text)
                .font(.subheadline)
                .bold()
                .foregroundColor(.red)
        }
    }

    var islandSize: (width: CGFloat, height: CGFloat, cornerRadius: CGFloat) {
        switch state {
        case .warningLeft, .warningRight, .warningSlouch, .warningLeanForward, .warningTooClose, .warningTooFar:
            return (320, 48, 24)
        case .rest:
            return (220, 56, 28)
        case .good:
            return (160, 36, 18)
        case .hidden:
            return (48, 32, 16)
        case .idle:
            return (100, 32, 16)
        }
    }

    func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}
