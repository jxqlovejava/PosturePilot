import SwiftUI

struct ContentView: View {
    @EnvironmentObject var postureDetector: PostureDetector
    @EnvironmentObject var pomodoroTimer: PomodoroTimer

    var body: some View {
        HStack(spacing: 24) {
            // Left Column: Camera Feed & Status
            VStack(alignment: .leading, spacing: 20) {
                Text("SitStraight")
                    .font(.largeTitle)
                    .bold()
                
                Text("智能坐姿助手")
                    .font(.title3)
                    .foregroundColor(.secondary)
                
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color(NSColor.controlBackgroundColor))
                        .shadow(radius: 5)
                    
                    if postureDetector.isEnabled {
                        CameraPreview(session: postureDetector.captureSession)
                            .clipShape(RoundedRectangle(cornerRadius: 24))
                    } else {
                        VStack {
                            Image(systemName: "video.slash")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                            Text("摄像头未开启")
                                .foregroundColor(.gray)
                                .padding(.top, 8)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Status Bar
                HStack {
                    Text("状态:")
                        .font(.headline)
                    Text(statusText)
                        .font(.headline)
                        .foregroundColor(statusColor)
                    Spacer()
                    Toggle("开启检测", isOn: $postureDetector.isEnabled)
                        .toggleStyle(.switch)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 16).fill(Color(NSColor.controlBackgroundColor)))
            }
            .frame(maxWidth: .infinity)
            
            // Right Column: Pomodoro & Settings
            VStack(spacing: 24) {
                // Pomodoro Card
                VStack(spacing: 16) {
                    Text("番茄钟")
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Text(formatTime(pomodoroTimer.timeLeft))
                        .font(.system(size: 64, weight: .light, design: .monospaced))
                    
                    HStack(spacing: 16) {
                        Button(action: {
                            pomodoroTimer.toggle()
                        }) {
                            Text(pomodoroTimer.isActive ? "暂停" : "开始")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(pomodoroTimer.isActive ? Color.orange : Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Button(action: {
                            pomodoroTimer.reset()
                        }) {
                            Image(systemName: "arrow.counterclockwise")
                                .padding()
                                .background(Color(NSColor.controlBackgroundColor))
                                .cornerRadius(12)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 24).fill(Color(NSColor.controlBackgroundColor)))
                
                // Settings Card
                VStack(spacing: 16) {
                    Text("设置")
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    VStack(alignment: .leading) {
                        Text("坐姿敏感度")
                        Slider(value: $postureDetector.sensitivity, in: 5...25)
                    }
                    
                    Toggle("开启距离检测", isOn: $postureDetector.enableDistanceMonitoring)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 24).fill(Color(NSColor.controlBackgroundColor)))
                
                Spacer()
            }
            .frame(width: 300)
        }
        .padding(32)
    }
    
    var statusText: String {
        if !postureDetector.isEnabled { return "未开启" }
        switch postureDetector.currentState {
        case .good: return "坐姿端正"
        case .tiltLeft: return "向左倾斜"
        case .tiltRight: return "向右倾斜"
        case .slouch: return "弯腰驼背"
        case .leanForward: return "身体前倾"
        case .tooClose: return "距离过近"
        case .tooFar: return "距离过远"
        case .unknown: return "检测中..."
        }
    }
    
    var statusColor: Color {
        if !postureDetector.isEnabled { return .gray }
        return postureDetector.currentState == .good ? .green : .red
    }
    
    func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}
