import Foundation
import Combine

enum TimerState {
    case work, rest
}

class PomodoroTimer: ObservableObject {
    @Published var timeLeft: Int = 25 * 60
    @Published var isActive: Bool = false
    @Published var state: TimerState = .work
    
    private var timer: AnyCancellable?
    
    let workDuration = 25 * 60
    let restDuration = 5 * 60
    
    func toggle() {
        if isActive {
            pause()
        } else {
            start()
        }
    }
    
    func start() {
        isActive = true
        timer = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.tick()
            }
    }
    
    func pause() {
        isActive = false
        timer?.cancel()
    }
    
    func reset() {
        pause()
        state = .work
        timeLeft = workDuration
    }
    
    private func tick() {
        if timeLeft > 0 {
            timeLeft -= 1
        } else {
            // Switch state
            if state == .work {
                state = .rest
                timeLeft = restDuration
            } else {
                state = .work
                timeLeft = workDuration
            }
        }
    }
}
