import { PlayerColor } from '../models/PlayerColor';

/**
 * UIManager handles all menu and dialog interactions for the game.
 * Uses HTML dialog elements for modals and provides methods for showing
 * different UI states.
 */
export class UIManager {
  private currentDialog: HTMLDialogElement | null = null;
  private onGameModeSelected: ((mode: string) => void) | null = null;
  private onColorSelected: ((color: PlayerColor) => void) | null = null;
  private onResumeGame: (() => void) | null = null;
  private onNewGame: (() => void) | null = null;

  /**
   * Show the main menu with game mode selection buttons
   */
  public showMainMenu(): void {
    this.closeCurrentDialog();

    const dialog = this.createDialog();
    dialog.classList.add('main-menu-dialog');

    const content = document.createElement('div');
    content.className = 'dialog-content main-menu-content';

    const title = document.createElement('h1');
    title.textContent = 'Nine Men\'s Morris';
    title.className = 'menu-title';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Choose a game mode to begin';
    subtitle.className = 'menu-subtitle';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'menu-buttons';

    const singlePlayerBtn = this.createButton('Single Player', 'primary');
    singlePlayerBtn.addEventListener('click', () => {
      this.showGameModeSelection();
    });

    const localTwoPlayerBtn = this.createButton('Local Two Player', 'primary');
    localTwoPlayerBtn.addEventListener('click', () => {
      if (this.onGameModeSelected) {
        this.onGameModeSelected('local-two-player');
      }
      this.closeCurrentDialog();
    });

    const onlineMultiplayerBtn = this.createButton('Online Multiplayer', 'primary');
    onlineMultiplayerBtn.addEventListener('click', () => {
      if (this.onGameModeSelected) {
        this.onGameModeSelected('online-multiplayer');
      }
      this.closeCurrentDialog();
    });

    const tutorialBtn = this.createButton('Tutorial', 'secondary');
    tutorialBtn.addEventListener('click', () => {
      if (this.onGameModeSelected) {
        this.onGameModeSelected('tutorial');
      }
      this.closeCurrentDialog();
    });

    buttonContainer.appendChild(singlePlayerBtn);
    buttonContainer.appendChild(localTwoPlayerBtn);
    buttonContainer.appendChild(onlineMultiplayerBtn);
    buttonContainer.appendChild(tutorialBtn);

    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(buttonContainer);

    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();

    this.currentDialog = dialog;
  }

  /**
   * Show game mode selection dialog (currently used for single-player color selection)
   */
  public showGameModeSelection(): void {
    this.showColorSelection();
  }

  /**
   * Show color selection dialog for single-player mode
   * Player chooses to play as white or black
   */
  public showColorSelection(): void {
    this.closeCurrentDialog();

    const dialog = this.createDialog();
    dialog.classList.add('color-selection-dialog');

    const content = document.createElement('div');
    content.className = 'dialog-content color-selection-content';

    const title = document.createElement('h2');
    title.textContent = 'Choose Your Color';
    title.className = 'dialog-title';

    const description = document.createElement('p');
    description.textContent = 'White moves first. Black moves second.';
    description.className = 'dialog-description';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'color-buttons';

    const whiteBtn = this.createButton('Play as White', 'primary');
    whiteBtn.classList.add('white-button');
    whiteBtn.addEventListener('click', () => {
      if (this.onColorSelected) {
        this.onColorSelected(PlayerColor.WHITE);
      }
      this.closeCurrentDialog();
    });

    const blackBtn = this.createButton('Play as Black', 'primary');
    blackBtn.classList.add('black-button');
    blackBtn.addEventListener('click', () => {
      if (this.onColorSelected) {
        this.onColorSelected(PlayerColor.BLACK);
      }
      this.closeCurrentDialog();
    });

    const backBtn = this.createButton('Back', 'secondary');
    backBtn.addEventListener('click', () => {
      this.showMainMenu();
    });

    buttonContainer.appendChild(whiteBtn);
    buttonContainer.appendChild(blackBtn);

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(buttonContainer);
    content.appendChild(backBtn);

    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();

    this.currentDialog = dialog;
  }

  /**
   * Show game result dialog displaying the winner
   * @param winner - The color of the winning player, or null for a draw
   */
  public showGameResult(winner: PlayerColor | null): void {
    this.closeCurrentDialog();

    const dialog = this.createDialog();
    dialog.classList.add('game-result-dialog');

    const content = document.createElement('div');
    content.className = 'dialog-content game-result-content';

    const title = document.createElement('h2');
    title.className = 'dialog-title result-title';

    if (winner === null) {
      title.textContent = 'Game Draw!';
      title.classList.add('draw');
    } else if (winner === PlayerColor.WHITE) {
      title.textContent = 'White Wins!';
      title.classList.add('white-wins');
    } else {
      title.textContent = 'Black Wins!';
      title.classList.add('black-wins');
    }

    const message = document.createElement('p');
    message.className = 'result-message';
    message.textContent = winner === null
      ? 'The game ended in a draw.'
      : `${winner === PlayerColor.WHITE ? 'White' : 'Black'} player has won the game!`;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'result-buttons';

    const newGameBtn = this.createButton('New Game', 'primary');
    newGameBtn.addEventListener('click', () => {
      if (this.onNewGame) {
        this.onNewGame();
      }
      this.closeCurrentDialog();
    });

    const mainMenuBtn = this.createButton('Main Menu', 'secondary');
    mainMenuBtn.addEventListener('click', () => {
      this.showMainMenu();
    });

    buttonContainer.appendChild(newGameBtn);
    buttonContainer.appendChild(mainMenuBtn);

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonContainer);

    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();

    this.currentDialog = dialog;
  }

  /**
   * Show error dialog with a custom message
   * @param message - The error message to display
   */
  public showErrorDialog(message: string): void {
    this.closeCurrentDialog();

    const dialog = this.createDialog();
    dialog.classList.add('error-dialog');

    const content = document.createElement('div');
    content.className = 'dialog-content error-content';

    const title = document.createElement('h2');
    title.textContent = 'Error';
    title.className = 'dialog-title error-title';

    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorMessage.className = 'error-message';

    const okBtn = this.createButton('OK', 'primary');
    okBtn.addEventListener('click', () => {
      this.closeCurrentDialog();
    });

    content.appendChild(title);
    content.appendChild(errorMessage);
    content.appendChild(okBtn);

    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();

    this.currentDialog = dialog;
  }

  /**
   * Show resume game dialog offering to continue a saved game
   */
  public showResumeGameDialog(): void {
    this.closeCurrentDialog();

    const dialog = this.createDialog();
    dialog.classList.add('resume-game-dialog');

    const content = document.createElement('div');
    content.className = 'dialog-content resume-game-content';

    const title = document.createElement('h2');
    title.textContent = 'Resume Game?';
    title.className = 'dialog-title';

    const message = document.createElement('p');
    message.textContent = 'You have a saved game in progress. Would you like to continue?';
    message.className = 'dialog-description';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'resume-buttons';

    const resumeBtn = this.createButton('Resume Game', 'primary');
    resumeBtn.addEventListener('click', () => {
      if (this.onResumeGame) {
        this.onResumeGame();
      }
      this.closeCurrentDialog();
    });

    const newGameBtn = this.createButton('Start New Game', 'secondary');
    newGameBtn.addEventListener('click', () => {
      if (this.onNewGame) {
        this.onNewGame();
      }
      this.closeCurrentDialog();
    });

    buttonContainer.appendChild(resumeBtn);
    buttonContainer.appendChild(newGameBtn);

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonContainer);

    dialog.appendChild(content);
    document.body.appendChild(dialog);
    dialog.showModal();

    this.currentDialog = dialog;
  }

  /**
   * Set callback for when a game mode is selected
   */
  public setOnGameModeSelected(callback: (mode: string) => void): void {
    this.onGameModeSelected = callback;
  }

  /**
   * Set callback for when a color is selected in single-player mode
   */
  public setOnColorSelected(callback: (color: PlayerColor) => void): void {
    this.onColorSelected = callback;
  }

  /**
   * Set callback for when user chooses to resume a saved game
   */
  public setOnResumeGame(callback: () => void): void {
    this.onResumeGame = callback;
  }

  /**
   * Set callback for when user chooses to start a new game
   */
  public setOnNewGame(callback: () => void): void {
    this.onNewGame = callback;
  }

  /**
   * Close the currently open dialog if any
   */
  public closeCurrentDialog(): void {
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog.remove();
      this.currentDialog = null;
    }
  }

  /**
   * Create a new dialog element
   */
  private createDialog(): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.className = 'game-dialog';

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        this.closeCurrentDialog();
      }
    });

    return dialog;
  }

  /**
   * Create a styled button element
   */
  private createButton(text: string, variant: 'primary' | 'secondary'): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `game-button ${variant}-button`;
    return button;
  }
}
