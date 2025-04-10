import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraService } from '../../services/camera.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-photo-analyzer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Analizador de Fotos con IA</h1>
      
      <div class="actions">
        <button (click)="toggleContinuousDetection()" [class]="'btn ' + (isDetecting ? 'active' : 'primary')">
          {{ isDetecting ? 'Detener Detección' : 'Iniciar Detección Continua' }}
        </button>
        <button (click)="takePicture()" class="btn primary" [disabled]="isDetecting">Tomar Foto</button>
        <button (click)="selectFromGallery()" class="btn secondary" [disabled]="isDetecting">Seleccionar de Galería</button>
      </div>

      <div *ngIf="imageBase64" class="preview">
        <img [src]="'data:image/jpeg;base64,' + imageBase64" alt="Preview" />
      </div>

      <div *ngIf="analyzing" class="loading">
        <p>Analizando imagen...</p>
      </div>

      <div *ngIf="analysis" class="analysis">
        <h2>Análisis de la Imagen</h2>
        <p>{{ analysis }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      text-align: center;
      color: #333;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin: 20px 0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }

    .primary {
      background-color: #007bff;
      color: white;
    }

    .active {
      background-color: #dc3545;
      color: white;
    }

    .secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .preview {
      margin: 20px 0;
      text-align: center;
    }

    .preview img {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .loading {
      text-align: center;
      margin: 20px 0;
    }

    .analysis {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
  `]
})
export class PhotoAnalyzerComponent {
  imageBase64: string | undefined;
  analysis: string | undefined;
  analyzing = false;
  isDetecting = false;

  constructor(
    private cameraService: CameraService,
    private geminiService: GeminiService
  ) {}

  async toggleContinuousDetection() {
    if (this.isDetecting) {
      this.cameraService.stopContinuousDetection();
      this.isDetecting = false;
      this.imageBase64 = undefined;
      this.analysis = undefined;
    } else {
      try {
        this.isDetecting = true;
        const frameObservable = await this.cameraService.startContinuousDetection();
        frameObservable.subscribe(async (frame) => {
          if (frame && !this.analyzing) {
            this.imageBase64 = frame;
            await this.analyzeImage();
          }
        });
      } catch (error) {
        console.error('Error en la detección continua:', error);
        this.isDetecting = false;
      }
    }
  }

  async takePicture() {
    try {
      this.imageBase64 = await this.cameraService.takePicture();
      await this.analyzeImage();
    } catch (error) {
      console.error('Error al tomar la foto:', error);
    }
  }

  async selectFromGallery() {
    try {
      this.imageBase64 = await this.cameraService.selectFromGallery();
      await this.analyzeImage();
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
    }
  }

  private async analyzeImage() {
    if (!this.imageBase64) return;

    this.analyzing = true;
    try {
      this.analysis = await this.geminiService.analyzeImage(this.imageBase64);
    } catch (error) {
      console.error('Error al analizar la imagen:', error);
    } finally {
      this.analyzing = false;
    }
  }
}