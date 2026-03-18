/**
 * Options for displaying an announcement banner.
 */
export interface AnnouncementOptions {
  /** The main announcement message */
  message: string;
  /** Optional subtitle displayed below the message */
  subtitle?: string;
  /** Duration in ms before auto-dismiss. Default 2000. 0 = persistent (game-end). */
  duration?: number;
  /** The type of announcement */
  type: 'turn' | 'phase' | 'game-end';
}

/**
 * Transient overlay that displays prominent messages for game events.
 *
 * - Turn/phase announcements auto-dismiss after ~2 seconds with pointer-events: none.
 * - Game-end announcements persist (duration=0) with pointer-events: auto.
 * - Calling show() while another announcement is active dismisses the previous one first.
 */
export class AnnouncementBanner {
  private container: HTMLElement | null = null;
  private dismissTimer: number | null = null;

  /** Create the banner container (hidden by default) */
  public create(): void {
    this.container = document.createElement('div');
    this.container.className = 'announcement-banner';
    this.container.id = 'announcement-banner';
    this.container.style.display = 'none';

    const target = document.getElementById('announcement-container');
    if (target) {
      target.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
  }

  /** Show an announcement with the given options */
  public show(options: AnnouncementOptions): void {
    if (!this.container) return;

    // Dismiss any existing announcement first
    this.dismiss();

    const duration = options.duration ?? (options.type === 'game-end' ? 0 : 2000);

    // Build banner content
    this.container.innerHTML = '';

    const messageEl = document.createElement('div');
    messageEl.className = 'announcement-message';
    messageEl.textContent = options.message;
    this.container.appendChild(messageEl);

    if (options.subtitle) {
      const subtitleEl = document.createElement('div');
      subtitleEl.className = 'announcement-subtitle';
      subtitleEl.textContent = options.subtitle;
      this.container.appendChild(subtitleEl);
    }

    // Set type-specific CSS class
    this.container.classList.remove(
      'announcement-turn',
      'announcement-phase',
      'announcement-game-end'
    );
    this.container.classList.add(`announcement-${options.type}`);

    // Pointer events: none for transient, auto for persistent game-end
    if (options.type === 'game-end') {
      this.container.style.pointerEvents = 'auto';
    } else {
      this.container.style.pointerEvents = 'none';
    }

    // Show the banner
    this.container.style.display = '';

    // Set auto-dismiss timer for non-persistent announcements
    if (duration > 0) {
      this.dismissTimer = window.setTimeout(() => {
        this.dismiss();
      }, duration);
    }
  }

  /** Dismiss the current announcement */
  public dismiss(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.container) {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }
  }

  /** Remove the banner from the DOM */
  public destroy(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}
