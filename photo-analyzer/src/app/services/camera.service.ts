import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private frameSubject = new BehaviorSubject<string | null>(null);
  private frameSubscription: Subscription | null = null;
  private lastFrame: string | null = null;
  private readonly FRAME_THRESHOLD = 0.15; // Umbral para detectar cambios significativos
  private readonly CAPTURE_INTERVAL = 500; // Intervalo de captura en ms

  constructor() {}

  async startContinuousDetection(): Promise<Observable<string | null>> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
      }

      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      this.startFrameCapture();
      return this.frameSubject.asObservable();
    } catch (error) {
      console.error('Error al iniciar la detección continua:', error);
      throw error;
    }
  }

  private calculateFrameDifference(frame1: string, frame2: string): number {
    // Implementación simple de comparación de frames usando longitud de strings
    const length = Math.min(frame1.length, frame2.length);
    let differences = 0;
    
    for (let i = 0; i < length; i += 100) { // Muestreo cada 100 caracteres
      if (frame1[i] !== frame2[i]) differences++;
    }
    
    return differences / (length / 100);
  }

  async startFrameCapture() {
    if (!this.videoElement) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    // Configurar captura con intervalo
    this.frameSubscription = interval(this.CAPTURE_INTERVAL)
      .pipe(throttleTime(this.CAPTURE_INTERVAL))
      .subscribe(() => {
        if (context && this.videoElement) {
          context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
          const currentFrame = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

          // Verificar si hay cambios significativos
          if (!this.lastFrame || 
              this.calculateFrameDifference(currentFrame, this.lastFrame) > this.FRAME_THRESHOLD) {
            this.lastFrame = currentFrame;
            this.frameSubject.next(currentFrame);
          }
        }
      });
  }

  stopContinuousDetection() {
    if (this.frameSubscription) {
      this.frameSubscription.unsubscribe();
      this.frameSubscription = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.lastFrame = null;
    this.frameSubject.next(null);
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      return image.base64String;
    } catch (error) {
      console.error('Error al caurar la foto:', error);
      throw error;
    }
  }

  async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      
      return image.base64String;
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
      throw error;
    }
  }
}