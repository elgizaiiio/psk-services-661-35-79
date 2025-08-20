export async function generateSlideshowVideo(
  imageSrcs: string[],
  durationSec: number = 5,
  width: number = 768,
  height: number = 432
): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    try {
      if (typeof window === 'undefined' || typeof (window as any).MediaRecorder === 'undefined') {
        return reject(new Error('Your browser does not support video recording'));
      }

      // Preload all images as blobs/object URLs if needed
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('Failed to load one of the images'));
          img.src = src;
        });

      const images = await Promise.all(imageSrcs.map(loadImage));
      if (images.length === 0) return reject(new Error('Not enough images'));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to initialize canvas'));

      const stream = (canvas as HTMLCanvasElement).captureStream(30);
      const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = types.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      recorder.start();

      const start = performance.now();
      const total = Math.max(1, durationSec) * 1000;
      const perSlide = total / images.length;
      const crossfade = Math.min(400, perSlide * 0.3); // ms

      function draw(now: number) {
        const elapsed = now - start;
        const t = Math.min(elapsed, total);
        // Determine current slide index
        const idx = Math.min(images.length - 1, Math.floor(t / perSlide));
        const slideStart = idx * perSlide;
        const slideT = t - slideStart;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Helper to draw cover with subtle zoom
        const drawCover = (img: HTMLImageElement, progress: number, alpha = 1) => {
          const ease = progress * (2 - progress);
          const scale = 1 + 0.08 * ease; // gentle zoom
          const imgAspect = img.width / img.height;
          const canvasAspect = width / height;
          let drawW: number, drawH: number;
          if (imgAspect > canvasAspect) {
            drawH = height * scale;
            drawW = drawH * imgAspect;
          } else {
            drawW = width * scale;
            drawH = drawW / imgAspect;
          }
          const panX = (drawW - width) * ease * 0.5;
          const panY = (drawH - height) * (1 - ease) * 0.5;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.drawImage(img, -panX, -panY, drawW, drawH);
          ctx.restore();
        };

        const progressInSlide = Math.min(1, slideT / perSlide);

        // Draw current
        drawCover(images[idx], progressInSlide, 1);

        // Crossfade to next if not last and within crossfade window
        if (idx < images.length - 1 && perSlide - slideT <= crossfade) {
          const cfT = 1 - (perSlide - slideT) / crossfade; // 0..1
          const nextAlpha = Math.min(1, Math.max(0, cfT));
          drawCover(images[idx + 1], cfT, nextAlpha);
        }

        if (elapsed < total) {
          requestAnimationFrame(draw);
        } else {
          setTimeout(() => recorder.stop(), 120);
        }
      }

      requestAnimationFrame(draw);
    } catch (error) {
      reject(error);
    }
  });
}
