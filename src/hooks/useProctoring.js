import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useProctoring: Comprehensive Anti-Cheat & Proctoring Hook for Q-Math
 * 
 * Features:
 *  - Tab switch & window blur detection (visibilitychange, blur, focus)
 *  - Camera & Webcam integration with live stream
 *  - Camera disconnect / permission revocation detection
 *  - Automatic timer pause during camera loss
 *  - Warning count tracking (exceeding 3 triggers auto-submit)
 *  - Chronological violation logging for Teacher Dashboard
 */

export function useProctoring({
  enabled = true,
  maxWarnings = 3,
  onMaxWarningsExceeded,
  onViolationLogged
} = {}) {
  const [warningCount, setWarningCount] = useState(0);
  const [violations, setViolations] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // null | { type: 'tab_switch' | 'camera_disconnected' | 'disqualified', title, message, count }
  
  // Camera Stream States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraPaused, setIsCameraPaused] = useState(false);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastBlurTimestampRef = useRef(0);
  const isInitializingCameraRef = useRef(false);

  // Helper to record a new violation
  const recordViolation = useCallback((type, reason) => {
    const violation = {
      id: `viol-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type, // 'Tab Switch' | 'Camera Disconnected'
      reason,
      timestamp: new Date().toISOString()
    };

    setViolations(prev => [...prev, violation]);
    if (onViolationLogged) {
      onViolationLogged(violation);
    }
    return violation;
  }, [onViolationLogged]);

  // Request & Initialize Webcam Stream
  const initCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Браузер камераны қолдамайды (Webcam not supported)');
      return;
    }

    isInitializingCameraRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraActive(true);
      setCameraError(null);
      setIsCameraPaused(false);
      setIsMonitoringActive(true);

      // Listen for unexpected track stops (e.g. unplugged webcam, permission revoked)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleCameraDisconnected('Камера байланысы үзілді немесе рұқсат тоқтатылды');
        };
      }
    } catch (err) {
      console.warn('Camera access denied or failed:', err);
      setCameraError(err.message || 'Камераға рұқсат берілмеді');
      setIsCameraActive(false);
      setIsCameraPaused(true);
      setActiveModal({
        type: 'camera_disconnected',
        title: 'Камераға рұқсат қажет 📷',
        message: 'ҰБТ ресми талаптары бойынша емтихан кезінде веб-камера үздіксіз қосулы болуы шарт. Камераны қайта қосыңыз.'
      });
    } finally {
      // Small timeout to avoid triggering blur on permission dialog
      setTimeout(() => {
        isInitializingCameraRef.current = false;
      }, 1200);
    }
  }, []);

  const handleCameraDisconnected = useCallback((reason) => {
    setIsCameraActive(false);
    setIsCameraPaused(true); // Pauses test countdown timer!

    recordViolation('Camera Disconnected', reason);

    setActiveModal({
      type: 'camera_disconnected',
      title: 'Камера өшірілді! ⚠️',
      message: 'Тест уақыты уақытша тоқтатылды. Емтиханды жалғастыру үшін камераға рұқсатты қайта қосыңыз.'
    });
  }, [recordViolation]);

  // Handle Tab Switch / Window Blur Event
  const handleTabSwitch = useCallback(() => {
    if (!enabled) return;
    if (isInitializingCameraRef.current) return;

    // Debounce to prevent double trigger when visibilitychange and blur fire together
    const now = Date.now();
    if (now - lastBlurTimestampRef.current < 1200) {
      return;
    }
    lastBlurTimestampRef.current = now;

    recordViolation('Tab Switch', 'Оқушы емтихан терезесінен немесе браузер қойындысынан шықты (Left Exam Window)');

    setWarningCount(prev => {
      const nextCount = prev + 1;

      if (nextCount >= maxWarnings) {
        // Disqualification / Auto-submit
        setActiveModal({
          type: 'disqualified',
          title: 'Ереже бұзушылық шегіне жетті! 🛑',
          message: `Сіз емтихан терезесінен ${maxWarnings} рет шықтыңыз. Тест автоматты түрде тоқтатылып, мұғалімге ереже бұзушылық хаттамасымен бірге тапсырылады.`,
          count: nextCount
        });

        if (onMaxWarningsExceeded) {
          setTimeout(() => {
            onMaxWarningsExceeded(nextCount);
          }, 2500);
        }
      } else {
        // Warning Modal
        setActiveModal({
          type: 'tab_switch',
          title: `Ескерту #${nextCount} / ${maxWarnings} ⚠️`,
          message: 'Назар аударыңыз: Сіз емтихан терезесінен шықтыңыз. Бұл әрекет қайталанса, тестіңіз автоматты түрде мерзімінен бұрын тапсырылады.',
          count: nextCount
        });
      }

      return nextCount;
    });
  }, [enabled, maxWarnings, onMaxWarningsExceeded, recordViolation]);

  // Attach Window & Visibility Listeners
  useEffect(() => {
    if (!enabled) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitch();
      }
    };

    const onBlur = () => {
      handleTabSwitch();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    // Initial camera startup
    initCamera();

    // Periodic camera sanity check every 3s
    const cameraCheckInterval = setInterval(() => {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (!track || track.readyState === 'ended' || !track.enabled) {
          handleCameraDisconnected('Камера белсенді емес');
        }
      }
    }, 3000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      clearInterval(cameraCheckInterval);

      // Stop camera stream tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [enabled, handleTabSwitch, initCamera, handleCameraDisconnected]);

  // Sync video element ref when ready
  const bindVideoRef = useCallback((element) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
    }
  }, []);

  const dismissModal = () => {
    setActiveModal(null);
  };

  const retryCamera = () => {
    setActiveModal(null);
    initCamera();
  };

  return {
    isMonitoringActive,
    isCameraActive,
    isCameraPaused,
    cameraError,
    warningCount,
    maxWarnings,
    violations,
    activeModal,
    dismissModal,
    retryCamera,
    bindVideoRef,
    // Proctoring payload to send with submission
    getProctoringReport: () => ({
      warningCount,
      violationsCount: violations.length,
      violations,
      cameraEnabled: isCameraActive,
      integrityScore: Math.max(0, 100 - violations.length * 25),
      autoSubmitted: warningCount >= maxWarnings
    })
  };
}

