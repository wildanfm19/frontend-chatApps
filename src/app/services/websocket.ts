import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  stompClient: Client | null = null; // STOP client instance to handle WebSocket connection

  //Subject to manage the stream of incoming messages
  private messageSubject = new BehaviorSubject<any>(null);
  public message$ = this.messageSubject.asObservable(); // Observable for components to subscribe to messages

  //Subject to track the connection status (connected /disconnected)
  private connectionSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionSubject.asObservable(); // Observable for components to subscribe to connection status

  connect(username: string) {
    const socket = new SockJS('http://localhost:8080/ws'); // Initialize the SockJS Websocket connection to the server

    // Configure the STOMP client
    this.stompClient = new Client({
      webSocketFactory: () => socket, // Use SockJS as the websocket factory
      reconnectDelay: 5000, //Reconnect delay if connection is lost
      debug: (str) => console.log(str), // Log STOMP debug messages for troubleshooting
    });

    // On Succesfull connection
    this.stompClient.onConnect = (frame) => {
      console.log('Connected: to WebSocket server');
      this.connectionSubject.next(true); // Notify that the connection is succesfull

      // Subscribe to the "/topic/public" topic to reveive public messages
      this.stompClient?.subscribe('/topic/public', (message: Message) => {
        this.messageSubject.next(JSON.parse(message.body));
      });

      //SEND a "JOIN" message to notify the server that a user has joined
      this.stompClient?.publish({
        destination: '/app/chat.addUser', // Server endpoint for adding users
        body: JSON.stringify({ sender: username, type: 'JOIN' }), // Send username and joint event
      });
    };

    // Handle error reported by the STOMP broker
    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']); // Log the error message
      console.error('Additional details: ' + frame.body); // Log additional error details
    };

    this.stompClient?.activate();
  }

  sendMessage(username: string, content: string) {
    if (this.stompClient && this.stompClient.connected) {
      // Create the message object
      const chatMessage = {
        sender: username,
        content: content,
        type: 'CHAT',
      };

      // Publish the message to the server endpoint
      this.stompClient.publish({
        destination: '/app/chat.sendMessage', // Server endpoint for sending messages
        body: JSON.stringify(chatMessage), // Send the message object as a JSON string
      });
    } else {
      // Log an error if the WebSocket connection is not active
      console.error('WebSocket is not connected. Unable to send message.');
    }
  }
  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}
