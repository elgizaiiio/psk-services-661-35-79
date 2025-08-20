export async function generateKenBurnsVideo(
  imageSrc: string,
  durationSec: number = 5,
  width: number = 768,
  height: number = 432
): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    try {
      if (typeof window === 'undefined' || typeof (window as any).MediaRecorder === 'undefined') {
        return reject(new Error('Your browser does not support video recording'));
      }

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const waitForImage = new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('Failed to load image'));
      });
      img.src = imageSrc;
      await waitForImage;

      // Prepare canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to initialize canvas'));

      // Capture stream
      const stream = (canvas as HTMLCanvasElement).captureStream(30);
      const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = types.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      recorder.start();

      const start = performance.now();
      const total = Math.max(1, durationSec) * 1000;

      function draw(now: number) {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / total);
        const ease = t * (2 - t); // easeOutQuad
        const scale = 1 + 0.12 * ease; // gentle zoom in

        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        let drawW: number, drawH: number;

        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawH = height * scale;
          drawW = drawH * imgAspect;
        } else {
          // Image is taller than canvas
          drawW = width * scale;
          drawH = drawW / imgAspect;
        }

        // Subtle pan
        const panX = (drawW - width) * ease * 0.5;
        const panY = (drawH - height) * (1 - ease) * 0.5;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, -panX, -panY, drawW, drawH);

        if (elapsed < total) {
          requestAnimationFrame(draw);
        } else {
          // Give recorder a short moment to finalize the last frame
          setTimeout(() => recorder.stop(), 120);
        }
      }

      requestAnimationFrame(draw);
    } catch (error) {
      reject(error);
    }
  });
}
