import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, ShieldAlert, WifiOff } from "lucide-react";

export interface CameraScannerProps {
  /** Called with the raw decoded string every time a NEW code is read. */
  onDecode: (raw: string) => void;
}

type CameraStatus =
  | "starting"
  | "active"
  | "permission-denied"
  | "no-camera"
  | "insecure-context"
  | "error";

/** Ignore repeats of the same value scanned within this window — a QR held
 * steady in frame must not fire the same scan dozens of times a second. */
const DEBOUNCE_MS = 3000;

/**
 * Minimal shape of the native BarcodeDetector API (Chrome on Android). Not
 * yet part of TypeScript's DOM lib, so declared locally rather than adding
 * an `any`. Used as a fast path — much lighter than the ZXing fallback —
 * where the browser supports it.
 */
interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
interface NativeBarcodeDetectorCtor {
  new (options: { formats: string[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
}

function getNativeDetectorCtor(): NativeBarcodeDetectorCtor | null {
  const ctor = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorCtor })
    .BarcodeDetector;
  return ctor ?? null;
}

export function CameraScanner({ onDecode }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");

  // Mutable scan-loop state that must not trigger re-renders on every frame.
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const nativeStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDecodedRef = useRef<{ value: string; time: number }>({ value: "", time: 0 });
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    function handleDecoded(raw: string) {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const now = Date.now();
      const last = lastDecodedRef.current;
      if (trimmed === last.value && now - last.time < DEBOUNCE_MS) return;
      lastDecodedRef.current = { value: trimmed, time: now };
      onDecode(trimmed);
    }

    function stopAll() {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop();
        zxingControlsRef.current = null;
      }
      if (nativeStreamRef.current) {
        for (const track of nativeStreamRef.current.getTracks()) track.stop();
        nativeStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    async function startNative(DetectorCtor: NativeBarcodeDetectorCtor) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (stoppedRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      nativeStreamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new DetectorCtor({ formats: ["qr_code"] });
      setStatus("active");

      const loop = async () => {
        if (stoppedRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) handleDecoded(codes[0].rawValue);
        } catch {
          // A transient decode failure (e.g. frame not ready) is normal —
          // just try again next frame rather than surfacing an error.
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    async function startZxing() {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" }, audio: false },
        videoRef.current ?? undefined,
        (result) => {
          if (result) handleDecoded(result.getText());
        },
      );
      if (stoppedRef.current) {
        controls.stop();
        return;
      }
      zxingControlsRef.current = controls;
      setStatus("active");
    }

    async function start() {
      if (!window.isSecureContext) {
        setStatus("insecure-context");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("no-camera");
        return;
      }

      setStatus("starting");
      try {
        const NativeDetector = getNativeDetectorCtor();
        if (NativeDetector) {
          await startNative(NativeDetector);
        } else {
          await startZxing();
        }
      } catch (err) {
        const name = (err as { name?: string })?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("permission-denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("no-camera");
        } else {
          setStatus("error");
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopAll();
      } else if (!stoppedRef.current) {
        start();
      }
    }

    start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stoppedRef.current = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAll();
    };
    // onDecode is expected to be stable (or the caller accepts a restart);
    // re-running this effect on every render identity change would tear
    // down and reacquire the camera constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "insecure-context") {
    return (
      <StatusMessage
        icon={ShieldAlert}
        title="Camera needs a secure connection"
        detail="This page must be loaded over HTTPS for camera access to work. Use the short code below instead."
      />
    );
  }

  if (status === "permission-denied") {
    return (
      <StatusMessage
        icon={CameraOff}
        title="Camera access denied"
        detail="Re-enable it in your browser's site settings, then reload. The short code below still works while you fix this."
      />
    );
  }

  if (status === "no-camera") {
    return (
      <StatusMessage
        icon={CameraOff}
        title="No camera found"
        detail="Use the short code below to check tickets in on this device."
      />
    );
  }

  if (status === "error") {
    return (
      <StatusMessage
        icon={WifiOff}
        title="Camera could not start"
        detail="Use the short code below, or reload the page to try again."
      />
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-inverse-surface">
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="aspect-square w-full object-cover"
      />
      {status === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-inverse-surface/80">
          <p className="flex items-center gap-2 text-body-lg font-semibold text-inverse-on-surface">
            <Camera className="h-6 w-6 animate-pulse" aria-hidden="true" />
            Starting camera…
          </p>
        </div>
      )}
      {status === "active" && (
        <div className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-white/70" />
      )}
    </div>
  );
}

function StatusMessage({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Camera;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-outline-variant bg-surface-container p-8 text-center">
      <Icon className="h-10 w-10 text-on-surface-variant" aria-hidden="true" />
      <p className="text-headline-md font-semibold text-on-surface">{title}</p>
      <p className="text-body-md text-on-surface-variant">{detail}</p>
    </div>
  );
}
