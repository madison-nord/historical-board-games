import { PlayerColor } from '../models';

export interface ChatMessage {
  senderId: string;
  senderColor: PlayerColor;
  content: string;
  timestamp: string;
}

/**
 * ChatPanel manages the in-game chat UI
 * Displays messages, handles input, and provides mute functionality
 */
export class ChatPanel {
  private container: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private inputField: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private muteButton: HTMLButtonElement | null = null;
  private isMuted: boolean = false;
  private onSendMessage: ((content: string) => void) | null = null;

  /**
   * Create and show the chat panel
   */
  public show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
      return;
    }

    this.createChatPanel();
  }

  /**
   * Hide the chat panel
   */
  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Add a message to the chat
   */
  public addMessage(message: ChatMessage): void {
    if (!this.messagesContainer || this.isMuted) {
      return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';

    const senderElement = document.createElement('span');
    senderElement.className = `chat-sender ${message.senderColor.toLowerCase()}`;
    senderElement.textContent = `${message.senderColor}:`;

    const contentElement = document.createElement('span');
    contentElement.className = 'chat-content';
    contentElement.textContent = message.content;

    const timeElement = document.createElement('span');
    timeElement.className = 'chat-time';
    const time = new Date(message.timestamp);
    timeElement.textContent = time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    messageElement.appendChild(senderElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);

    this.messagesContainer.appendChild(messageElement);

    // Auto-scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Clear all messages
   */
  public clearMessages(): void {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }
  }

  /**
   * Set callback for when user sends a message
   */
  public setOnSendMessage(callback: (content: string) => void): void {
    this.onSendMessage = callback;
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.muteButton) {
      this.muteButton.textContent = this.isMuted ? '🔇 Unmute' : '🔊 Mute';
      this.muteButton.classList.toggle('muted', this.isMuted);
    }
  }

  /**
   * Create the chat panel DOM structure
   */
  private createChatPanel(): void {
    this.container = document.createElement('div');
    this.container.className = 'chat-panel';
    this.container.id = 'chat-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'chat-header';

    const title = document.createElement('h3');
    title.textContent = 'Chat';
    title.className = 'chat-title';

    this.muteButton = document.createElement('button');
    this.muteButton.className = 'chat-mute-button';
    this.muteButton.textContent = '🔊 Mute';
    this.muteButton.addEventListener('click', () => this.toggleMute());

    header.appendChild(title);
    header.appendChild(this.muteButton);

    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-messages';
    this.messagesContainer.id = 'chat-messages';

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chat-input-container';

    this.inputField = document.createElement('input');
    this.inputField.type = 'text';
    this.inputField.className = 'chat-input';
    this.inputField.placeholder = 'Type a message...';
    this.inputField.maxLength = 200;
    this.inputField.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });

    this.sendButton = document.createElement('button');
    this.sendButton.className = 'chat-send-button';
    this.sendButton.textContent = 'Send';
    this.sendButton.addEventListener('click', () => this.handleSendMessage());

    inputContainer.appendChild(this.inputField);
    inputContainer.appendChild(this.sendButton);

    // Assemble panel
    this.container.appendChild(header);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(inputContainer);

    document.body.appendChild(this.container);
  }

  /**
   * Handle sending a message
   */
  private handleSendMessage(): void {
    if (!this.inputField || !this.onSendMessage) {
      return;
    }

    const content = this.inputField.value.trim();
    if (content.length === 0) {
      return;
    }

    // Basic content filtering (client-side)
    const filtered = this.filterContent(content);

    this.onSendMessage(filtered);
    this.inputField.value = '';
  }

  /**
   * Basic client-side content filtering
   * Removes excessive whitespace and limits length
   */
  private filterContent(content: string): string {
    // Remove excessive whitespace
    let filtered = content.replace(/\s+/g, ' ').trim();

    // Limit length
    if (filtered.length > 200) {
      filtered = filtered.substring(0, 200);
    }

    return filtered;
  }

  /**
   * Destroy the chat panel
   */
  public destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.messagesContainer = null;
      this.inputField = null;
      this.sendButton = null;
      this.muteButton = null;
    }
  }
}
