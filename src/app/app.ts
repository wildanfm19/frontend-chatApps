import { Component, inject, OnInit, signal } from '@angular/core';
import { WebsocketService } from './services/websocket';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [FormsModule,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  username: string = ''; //Store the username entered by the user
  message: string = ''; // Stores the message entered by the user
  messages: any[] = []; // Stores all the chat messages
  isConnected = false; // Tracks whether the user is connected to the Websocket
  connectingMessage = 'Connecting..'; // Message to show while connecting
  private webSocketService = inject(WebsocketService);

  ngOnInit(): void {
    console.log('App initialized');

    // Subscribe to messages observables to receive messages from the Websocket service
    this.webSocketService.message$.subscribe((message) => {
      if (message) {
        // Log and add the received message to the array of messages
        console.log(
          `Message received from ${message.sender}: ${message.content}`
        );
        this.messages.push(message);
      }
    });

    //Subscrive to connection status observables to monitor connection status
    this.webSocketService.connectionStatus$.subscribe((connected) => {
      this.isConnected = connected; // Update the connection status
      if (connected) {
        this.connectingMessage = ''; // Clear the connecting message once connected
        console.log('WebSocket connection established');
      }
    });
  }

  connect() {
    console.log(
      'Attempting to connect to WebSocket at http://localhost:8080/ws with username: ' +
        this.username
    );
    this.webSocketService.connect(this.username); // Call the websocket service to connect
  }

  sendMessage() {
    if (this.message) {
      this.webSocketService.sendMessage(this.username, this.message); // Send the message via the websocket service
      this.message = ''; // Clear the input field after sending
    }
  }

  getAvatarColor(sender: string): string {
    // Generate a consistent color based on the sender's name
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      // Generate a hash from sender's name
     hash = 31 * hash + sender.charCodeAt(i);
    }
   // Return a color from the array based on the hash value
    return colors[Math.abs(hash) % colors.length];
  }
}
