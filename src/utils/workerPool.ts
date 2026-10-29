import { OptimizationSettings } from '../types';
import { processImageMainThread, ProcessorOutput } from './imageProcessor';
import { WorkerJobPayload, WorkerJobResult } from '../workers/optimizer.worker';

export interface TaskCallbacks {
  onSuccess: (result: ProcessorOutput) => void;
  onError: (error: string) => void;
  onProgress?: (percent: number) => void;
}

export interface QueuedTask {
  id: string;
  blob: Blob;
  settings: OptimizationSettings;
  callbacks: TaskCallbacks;
  abortController: AbortController;
}

interface WorkerInstance {
  id: number;
  worker: Worker | null;
  busy: boolean;
  currentTaskId: string | null;
}

class WorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: QueuedTask[] = [];
  private concurrency: number;
  private workerSupported = true;
  private initialized = false;

  constructor() {
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
    // Keep between 2 and 8 threads to respect memory and CPU bounds
    this.concurrency = Math.max(2, Math.min(cores, 8));
  }

  public getConcurrency(): number {
    return this.concurrency;
  }

  public setConcurrency(newLimit: number): void {
    this.concurrency = Math.max(1, Math.min(newLimit, 16));
    this.adjustPoolSize();
  }

  private initWorkers(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
        this.workerSupported = false;
        return;
      }

      for (let i = 0; i < this.concurrency; i++) {
        this.createWorkerInstance(i);
      }
    } catch (err) {
      console.warn('Worker initialization failed, using main-thread fallback:', err);
      this.workerSupported = false;
    }
  }

  private createWorkerInstance(id: number): WorkerInstance {
    try {
      const worker = new Worker(
        new URL('../workers/optimizer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const instance: WorkerInstance = {
        id,
        worker,
        busy: false,
        currentTaskId: null,
      };

      worker.onmessage = (e: MessageEvent<WorkerJobResult>) => {
        this.handleWorkerMessage(instance, e.data);
      };

      worker.onerror = (e: ErrorEvent) => {
        console.error(`Worker #${id} crashed:`, e.message);
        this.handleWorkerCrash(instance, e.message || 'Worker unexpected crash');
      };

      this.workers.push(instance);
      return instance;
    } catch (err) {
      console.warn(`Could not spawn worker #${id}:`, err);
      this.workerSupported = false;
      const fallbackInstance: WorkerInstance = {
        id,
        worker: null,
        busy: false,
        currentTaskId: null,
      };
      this.workers.push(fallbackInstance);
      return fallbackInstance;
    }
  }

  private adjustPoolSize(): void {
    while (this.workers.length > this.concurrency) {
      const w = this.workers.pop();
      if (w?.worker) {
        w.worker.terminate();
      }
    }
    while (this.workers.length < this.concurrency && this.workerSupported) {
      this.createWorkerInstance(this.workers.length);
    }
  }

  private handleWorkerMessage(instance: WorkerInstance, result: WorkerJobResult): void {
    const taskId = instance.currentTaskId;
    instance.busy = false;
    instance.currentTaskId = null;

    const task = this.taskQueue.find(t => t.id === taskId);
    if (task) {
      this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
      if (result.success && result.blob && result.width && result.height && result.format) {
        task.callbacks.onSuccess({
          blob: result.blob,
          width: result.width,
          height: result.height,
          size: result.size || result.blob.size,
          format: result.format,
          ssimScore: result.ssimScore,
          qualityUsed: result.qualityUsed,
        });
      } else {
        task.callbacks.onError(result.error || 'Optimization failed');
      }
    }

    this.dispatchNext();
  }

  private handleWorkerCrash(instance: WorkerInstance, errorMsg: string): void {
    const taskId = instance.currentTaskId;
    if (instance.worker) {
      instance.worker.terminate();
    }

    // Replace crashed worker
    try {
      instance.worker = new Worker(
        new URL('../workers/optimizer.worker.ts', import.meta.url),
        { type: 'module' }
      );
      instance.worker.onmessage = (e) => this.handleWorkerMessage(instance, e.data);
      instance.worker.onerror = (e) => this.handleWorkerCrash(instance, e.message);
    } catch {
      instance.worker = null;
    }

    instance.busy = false;
    instance.currentTaskId = null;

    if (taskId) {
      const task = this.taskQueue.find(t => t.id === taskId);
      if (task) {
        this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
        task.callbacks.onError(`Process error: ${errorMsg}`);
      }
    }

    this.dispatchNext();
  }

  public enqueue(
    taskId: string,
    blob: Blob,
    settings: OptimizationSettings,
    callbacks: TaskCallbacks
  ): AbortController {
    this.initWorkers();
    const abortController = new AbortController();

    // Remove any existing task with same id
    this.cancelTask(taskId);

    const task: QueuedTask = {
      id: taskId,
      blob,
      settings,
      callbacks,
      abortController,
    };

    this.taskQueue.push(task);
    this.dispatchNext();

    return abortController;
  }

  public cancelTask(taskId: string): void {
    // Check if waiting in queue
    const queuedIdx = this.taskQueue.findIndex(t => t.id === taskId);
    if (queuedIdx !== -1) {
      const [t] = this.taskQueue.splice(queuedIdx, 1);
      t.abortController.abort();
      return;
    }

    // Check if running on a worker
    const workerInst = this.workers.find(w => w.currentTaskId === taskId);
    if (workerInst) {
      if (workerInst.worker) {
        workerInst.worker.terminate();
        // Respawn fresh worker
        try {
          workerInst.worker = new Worker(
            new URL('../workers/optimizer.worker.ts', import.meta.url),
            { type: 'module' }
          );
          workerInst.worker.onmessage = (e) => this.handleWorkerMessage(workerInst, e.data);
          workerInst.worker.onerror = (e) => this.handleWorkerCrash(workerInst, e.message);
        } catch {
          workerInst.worker = null;
        }
      }
      workerInst.busy = false;
      workerInst.currentTaskId = null;
      this.dispatchNext();
    }
  }

  public clearQueue(): void {
    for (const task of this.taskQueue) {
      task.abortController.abort();
    }
    this.taskQueue = [];
    for (const w of this.workers) {
      if (w.busy && w.worker) {
        w.worker.terminate();
        w.worker = null;
        w.busy = false;
        w.currentTaskId = null;
      }
    }
    this.adjustPoolSize();
  }

  private dispatchNext(): void {
    if (this.taskQueue.length === 0) return;

    // If workers are not supported or available, execute using main-thread fallback
    if (!this.workerSupported) {
      const task = this.taskQueue.shift();
      if (!task) return;
      if (task.abortController.signal.aborted) return;

      setTimeout(async () => {
        try {
          const res = await processImageMainThread(task.blob, {
            maxWidth: task.settings.maxWidth,
            maxHeight: task.settings.maxHeight,
            fit: task.settings.fit,
            format: task.settings.format,
            quality: task.settings.quality,
            autoQuality: task.settings.autoQuality,
            targetSimilarity: task.settings.targetSimilarity,
            keepPngTransparency: task.settings.keepPngTransparency,
            backgroundColor: task.settings.backgroundColor,
            watermark: task.settings.watermark,
            filters: task.settings.filters,
          });
          task.callbacks.onSuccess(res);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          task.callbacks.onError(message);
        }
        this.dispatchNext();
      }, 0);
      return;
    }

    const idleWorker = this.workers.find(w => !w.busy && w.worker !== null);
    if (!idleWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    if (task.abortController.signal.aborted) {
      this.dispatchNext();
      return;
    }

    idleWorker.busy = true;
    idleWorker.currentTaskId = task.id;

    // Send payload to worker
    const payload: WorkerJobPayload = {
      jobId: task.id,
      imageBlob: task.blob,
      maxWidth: task.settings.maxWidth,
      maxHeight: task.settings.maxHeight,
      fit: task.settings.fit,
      format: task.settings.format,
      quality: task.settings.quality,
      autoQuality: task.settings.autoQuality,
      targetSimilarity: task.settings.targetSimilarity,
      keepPngTransparency: task.settings.keepPngTransparency,
      backgroundColor: task.settings.backgroundColor,
      watermark: task.settings.watermark,
      filters: task.settings.filters,
    };

    idleWorker.worker!.postMessage(payload);
  }
}

export const globalWorkerPool = new WorkerPool();
