import { Injectable, inject, effect } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

interface NotificationData {
  type: string;
  data: {
    pitchId: string;
    pitchTitle: string;
    message: string;
    vote?: {
      id: string;
      score: number;
    };
    comment?: {
      id: string;
      content: string;
    };
    investor?: {
      firstName: string;
      lastName: string;
    };
    oldScore?: number;
    newScore?: number;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  
  // Backend URL - should match your AuthService API_URL
  private readonly API_URL = "http://localhost:5000/api";
  
  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  constructor() {
    // Use effect to watch for authentication changes
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Add a small delay to ensure token is set
        setTimeout(() => {
          this.initializeSSEConnection();
        }, 100);
      } else {
        this.disconnect();
      }
    });
  }

  // Initialize the service - called by APP_INITIALIZER
  public initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if user is authenticated before connecting
      if (this.authService.isAuthenticated()) {
        this.initializeSSEConnection();
      }
      
      resolve(true);
    });
  }

  private initializeSSEConnection(): void {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('No token found. SSE connection not established.');
      return;
    }

    // Prevent multiple connections
    if (this.connectionStatus.value) {
      console.log('SSE connection already established');
      return;
    }

    // Check if user is a founder (only founders should receive notifications)
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'founder') {
      console.log('SSE notifications only available for founders');
      return;
    }

    // Use Fetch approach for better authentication support
    this.connectWithFetch(token);
  }

  // Using Fetch with custom headers for authentication
  private async connectWithFetch(token: string): Promise<void> {
    try {
      if (this.abortController) {
        this.abortController.abort();
      }

      this.abortController = new AbortController();

      const sseUrl = `${this.API_URL}/pitches/notifications/stream`;
      console.log('Connecting to SSE endpoint via Fetch:', sseUrl);
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        signal: this.abortController.signal
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.connectionStatus.next(true);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      console.log('SSE connection established via Fetch');
      this.showSnackBar('🔔 Notifications connected', 'success');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('SSE stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        // Process complete lines
        this.processSSELines(lines);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('SSE connection aborted');
        return;
      }
      
      console.error('SSE connection error:', error);
      this.connectionStatus.next(false);
      this.handleConnectionError();
    }
  }

  private processSSELines(lines: string[]): void {
    let eventType = '';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.substring(5).trim();
      } else if (line === '' && eventType && eventData) {
        this.handleSSEEvent(eventType, eventData);
        eventType = '';
        eventData = '';
      }
    }
  }

  private handleSSEEvent(eventType: string, eventData: string): void {
    try {
      const data = JSON.parse(eventData);

      switch (eventType) {
        case 'connected':
          console.log('SSE connection confirmed:', data);
          break;
        case 'heartbeat':
          console.debug('Heartbeat received');
          break;
        case 'new_vote':
          this.handleNewVote(data);
          break;
        case 'vote_updated':
          this.handleVoteUpdate(data);
          break;
        case 'new_comment':
          this.handleNewComment(data);
          break;
        default:
          console.log('Unknown event type:', eventType, data);
      }
    } catch (error) {
      console.error('Error parsing SSE event data:', error);
    }
  }

  private handleNewVote(notification: NotificationData): void {
    const { data } = notification;
    const investorName = `${data.investor?.firstName} ${data.investor?.lastName}`;
    const score = data.vote?.score;
    
    this.showSnackBar(
      `🗳️ New Vote: ${score}/10 from ${investorName} on "${data.pitchTitle}"`,
      'success',
      8000
    );

    this.playNotificationSound();
  }

  private handleVoteUpdate(notification: NotificationData): void {
    const { data } = notification;
    const investorName = `${data.investor?.firstName} ${data.investor?.lastName}`;
    const oldScore = data.oldScore;
    const newScore = data.newScore;
    
    this.showSnackBar(
      `📊 Vote Updated: ${investorName} changed vote from ${oldScore} to ${newScore} on "${data.pitchTitle}"`,
      'info',
      6000
    );

    this.playNotificationSound();
  }

  private handleNewComment(notification: NotificationData): void {
    const { data } = notification;
    const investorName = `${data.investor?.firstName} ${data.investor?.lastName}`;
    
    this.showSnackBar(
      `💬 New Comment from ${investorName} on "${data.pitchTitle}"`,
      'success',
      8000
    );

    this.playNotificationSound();
  }

  private showSnackBar(
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
    duration: number = 5000
  ): void {
    console.log('Showing snackbar:', message, type);
    
    const config = {
      duration,
      horizontalPosition: 'right' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${type}`]
    };

    this.snackBar.open(message, 'Close', config);
  }

  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.authService.isAuthenticated()) {
          this.initializeSSEConnection();
        }
      }, this.reconnectDelay);

      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
      this.showSnackBar(
        '⚠️ Connection Lost - Unable to reconnect to notifications. Please refresh the page.',
        'error',
        0 // Don't auto-dismiss
      );
    }
  }

  private playNotificationSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.debug('Audio notification not available:', error);
    }
  }

  // Public methods
  public reconnect(): void {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.initializeSSEConnection();
  }

  public disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.connectionStatus.next(false);
    console.log('SSE connection closed');
  }

  public isConnected(): boolean {
    return this.connectionStatus.value;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}