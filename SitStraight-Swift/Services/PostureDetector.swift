import Foundation
import AVFoundation
import Vision
import Combine

enum PostureState {
    case good, tiltLeft, tiltRight, slouch, tooClose, tooFar, leanForward, unknown
}

class PostureDetector: NSObject, ObservableObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    @Published var currentState: PostureState = .unknown
    @Published var isEnabled: Bool = false {
        didSet {
            if isEnabled { startCamera() } else { stopCamera() }
        }
    }
    @Published var sensitivity: Double = 15.0
    @Published var enableDistanceMonitoring: Bool = true

    let captureSession = AVCaptureSession()
    private let videoDataOutput = AVCaptureVideoDataOutput()

    // Baselines for calibration
    private var baselineFaceWidth: CGFloat = 0
    private var baselineTorsoHeight: CGFloat = 0
    private var frameCount = 0

    override init() {
        super.init()
        setupCamera()
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
              let input = try? AVCaptureDeviceInput(device: device) else { return }

        if captureSession.canAddInput(input) { captureSession.addInput(input) }

        videoDataOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "videoQueue"))
        if captureSession.canAddOutput(videoDataOutput) { captureSession.addOutput(videoDataOutput) }
    }

    func startCamera() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }

    func stopCamera() {
        captureSession.stopRunning()
        frameCount = 0
        DispatchQueue.main.async {
            self.currentState = .unknown
        }
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        // Using Vision Framework to detect body pose (similar to MediaPipe Pose)
        let request = VNDetectHumanBodyPoseRequest { [weak self] request, error in
            guard let observations = request.results as? [VNHumanBodyPoseObservation],
                  let observation = observations.first else { return }
            self?.analyzePosture(observation: observation)
        }

        try? VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:]).perform([request])
    }

    private func analyzePosture(observation: VNHumanBodyPoseObservation) {
        // Extract points: neck, shoulders, ears, etc.
        guard let leftShoulder = try? observation.recognizedPoint(.leftShoulder),
              let rightShoulder = try? observation.recognizedPoint(.rightShoulder),
              let neck = try? observation.recognizedPoint(.neck),
              let leftEar = try? observation.recognizedPoint(.leftEar),
              let rightEar = try? observation.recognizedPoint(.rightEar),
              leftShoulder.confidence > 0.5, rightShoulder.confidence > 0.5, neck.confidence > 0.5 else {
            return
        }

        // 1. Calculate Tilt (Angle between shoulders)
        let dx = rightShoulder.location.x - leftShoulder.location.x
        let dy = rightShoulder.location.y - leftShoulder.location.y
        let angleRad = atan2(dy, dx)
        let angleDeg = abs(angleRad * 180 / .pi)
        
        // 2. Calculate Distance & Slouch metrics
        let faceWidth = abs(rightEar.location.x - leftEar.location.x)
        // Using distance from neck to midpoint of shoulders as a proxy for torso height
        let midShoulderY = (leftShoulder.location.y + rightShoulder.location.y) / 2
        let torsoHeight = abs(neck.location.y - midShoulderY)

        DispatchQueue.main.async {
            self.frameCount += 1
            
            // Calibration phase (first 30 frames)
            if self.frameCount < 30 {
                self.baselineFaceWidth = (self.baselineFaceWidth * CGFloat(self.frameCount - 1) + faceWidth) / CGFloat(self.frameCount)
                self.baselineTorsoHeight = (self.baselineTorsoHeight * CGFloat(self.frameCount - 1) + torsoHeight) / CGFloat(self.frameCount)
                self.currentState = .good
                return
            }

            // Detection Logic
            var newState: PostureState = .good
            
            let isTooClose = self.enableDistanceMonitoring && faceWidth > self.baselineFaceWidth * 1.2
            let isTooFar = self.enableDistanceMonitoring && faceWidth < self.baselineFaceWidth * 0.8
            let isSlouching = torsoHeight < self.baselineTorsoHeight * 0.8
            
            let currentRatio = torsoHeight > 0 ? faceWidth / torsoHeight : 0
            let baselineRatio = self.baselineTorsoHeight > 0 ? self.baselineFaceWidth / self.baselineTorsoHeight : 0
            let isLeaningForward = currentRatio > baselineRatio * 1.2

            if isLeaningForward {
                newState = .leanForward
            } else if isTooClose && isSlouching {
                newState = .slouch
            } else if isTooClose {
                newState = .tooClose
            } else if isTooFar {
                newState = .tooFar
            } else if isSlouching {
                newState = .slouch
            } else if angleDeg > self.sensitivity {
                newState = dy > 0 ? .tiltRight : .tiltLeft
            }

            // Add debounce logic here if needed
            self.currentState = newState
        }
    }
}
