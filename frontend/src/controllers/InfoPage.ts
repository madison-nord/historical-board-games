/**
 * InfoPage - Full-screen information page for Nine Men's Morris.
 *
 * Displays original historical content and complete rules explanation
 * as a full-screen page element integrated with UIManager navigation.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.3, 3.4, 3.5, 4.3
 */
export class InfoPage {
  private pageElement: HTMLDivElement | null = null;
  private onBackToMenu: (() => void) | null = null;

  /**
   * Register callback for when user clicks "Back to Menu".
   */
  public setOnBackToMenu(callback: () => void): void {
    this.onBackToMenu = callback;
  }

  /**
   * Build and return the complete HTML content for the history section.
   * All content is original — written specifically for this project.
   */
  public getHistoryContent(): string {
    return [
      '<section class="info-section" aria-labelledby="history-heading">',
      '<h2 id="history-heading" class="info-section-title">A Game Older Than Empires</h2>',
      '<p>',
      "Nine Men's Morris is one of the oldest board games still played today. ",
      'Its origins stretch back thousands of years, with carved game boards discovered ',
      'at archaeological sites across the ancient world. The earliest known boards were ',
      'etched into roofing tiles at an Egyptian temple in Kurna, dating to roughly ',
      '1400 BCE — meaning people were playing this game before the fall of Troy.',
      '</p>',
      '<p>',
      'The game flourished across cultures and continents. Roman soldiers carved boards ',
      'into stone pavements to pass time between campaigns, and fragments have been found ',
      'at sites from Roman Britain to the ruins of Pompeii. In medieval Europe, the game ',
      'became enormously popular among all social classes. Monks played it in monastery ',
      'cloisters, merchants played it in market squares, and nobility played it on finely ',
      'crafted wooden boards inlaid with ivory.',
      '</p>',
      '<p>',
      'The name "Nine Men\'s Morris" comes from the English tradition, where "morris" ',
      'likely derives from the Latin word "merellus," meaning a game token or counter. ',
      'Across the world the game goes by many names: "Mühle" in German-speaking countries, ',
      '"Jeu de Moulin" in France, "Morabaraba" in southern Africa, and "Navakankari" in ',
      'parts of India. Each culture adapted the game slightly, but the core mechanics — ',
      'placing pieces, forming lines of three, and capturing your opponent — have remained ',
      'remarkably consistent for millennia.',
      '</p>',
      '<p>',
      "Shakespeare referenced the game in <em>A Midsummer Night's Dream</em>, where ",
      'Titania laments that "the nine men\'s morris is filled up with mud," painting a ',
      'picture of outdoor boards cut into village greens. This tradition of carving boards ',
      'into public spaces meant that anyone could play, making it a truly democratic pastime.',
      '</p>',
      '<p>',
      "Today, Nine Men's Morris endures as a compelling strategy game. Its simple rules ",
      'hide surprising depth — the game has been studied by mathematicians and computer ',
      'scientists, and was computationally solved in 1993, proving that perfect play by ',
      'both sides results in a draw. Yet for human players, the rich tactical possibilities ',
      'ensure that every match feels fresh and challenging.',
      '</p>',
      '</section>',
    ].join('\n');
  }

  /**
   * Build and return the complete HTML content for the rules section.
   * Covers all three phases, mill formation, piece removal, and win conditions.
   */
  public getRulesContent(): string {
    return [
      '<section class="info-section" aria-labelledby="rules-heading">',
      '<h2 id="rules-heading" class="info-section-title">How to Play</h2>',
      '',
      '<h3 class="info-subsection-title">Overview</h3>',
      '<p>',
      "Nine Men's Morris is a two-player strategy game played on a board with 24 ",
      'positions arranged across three concentric squares connected by lines. Each player ',
      'starts with nine pieces (one player takes white, the other black). The goal is to ',
      'reduce your opponent to fewer than three pieces or to block all of their moves.',
      '</p>',
      '',
      '<h3 class="info-subsection-title">The Board</h3>',
      '<img src="/images/board-layout.svg" alt="Board layout diagram showing three concentric squares with 24 numbered positions" class="info-diagram">',
      '<p class="info-diagram-caption">The board has 24 positions across three concentric squares, connected by lines.</p>',
      '',
      '<h3 class="info-subsection-title">Phase 1 — Placement</h3>',
      '<p>',
      'Players take turns placing one piece at a time on any empty position on the board. ',
      'White always goes first. During this phase, each player places all nine of their ',
      'pieces. Strategic placement is critical — you want to set up future mills while ',
      "disrupting your opponent's plans.",
      '</p>',
      '',
      '<h3 class="info-subsection-title">Phase 2 — Movement</h3>',
      '<p>',
      'Once all pieces have been placed, players take turns sliding one of their pieces ',
      'along a line to an adjacent empty position. You can only move along the lines drawn ',
      'on the board — diagonal moves are not allowed, and you cannot jump over other pieces. ',
      'The key to this phase is maneuvering your pieces to form mills while preventing your ',
      'opponent from doing the same.',
      '</p>',
      '<img src="/images/piece-movement.svg" alt="Movement diagram showing a piece at position 1 can move to positions 0, 2, or 9" class="info-diagram">',
      '<p class="info-diagram-caption">Pieces move along lines to adjacent empty positions only.</p>',
      '',
      '<h3 class="info-subsection-title">Phase 3 — Flying</h3>',
      '<p>',
      'When a player is reduced to exactly three pieces, that player gains the ability to ',
      '"fly." Flying means you can move any of your pieces to any empty position on the ',
      'board, not just adjacent ones. This powerful ability gives the disadvantaged player ',
      'a fighting chance and often leads to dramatic comebacks.',
      '</p>',
      '',
      '<h3 class="info-subsection-title">Forming a Mill</h3>',
      '<p>',
      'A mill is formed when three of your pieces occupy three positions in a straight line ',
      "along one of the board's connecting lines. When you complete a mill, you earn the ",
      "right to remove one of your opponent's pieces from the board. The removed piece is ",
      'out of the game permanently.',
      '</p>',
      '<img src="/images/mill-example.svg" alt="Mill example showing three white pieces in a row along the top of the outer square" class="info-diagram">',
      '<p class="info-diagram-caption">Forming a mill lets you remove one of your opponent\'s pieces.</p>',
      '<p>',
      'There is one important restriction: you cannot remove a piece that is currently part ',
      "of an opponent's mill, unless every one of your opponent's pieces is in a mill. ",
      'This rule prevents players from being completely helpless when they have strong ',
      'defensive formations.',
      '</p>',
      '<p>',
      'A clever tactic is to "open" and "close" a mill repeatedly. By moving a piece out ',
      "of a mill on one turn and back into it on the next, you can remove an opponent's ",
      'piece every other turn — a devastating strategy when executed well.',
      '</p>',
      '',
      '<h3 class="info-subsection-title">Winning the Game</h3>',
      '<p>',
      'You win the game in one of two ways:',
      '</p>',
      '<ul class="info-list">',
      '<li>Reduce your opponent to fewer than three pieces, making it impossible for them ',
      'to form a mill.</li>',
      "<li>Block all of your opponent's pieces so they have no legal moves on their turn.</li>",
      '</ul>',
      '<p>',
      'Both conditions are checked at the start of each turn. If your opponent cannot move ',
      'or has too few pieces, you are declared the winner.',
      '</p>',
      '',
      '<h3 class="info-subsection-title">Tips for New Players</h3>',
      '<ul class="info-list">',
      '<li>During placement, try to occupy positions where multiple lines intersect — these ',
      'give you more options for forming mills later.</li>',
      "<li>Watch for your opponent's potential mills and block them before they complete.</li>",
      '<li>Setting up two potential mills that share a piece (a "double mill") is one of the ',
      'strongest strategies in the game.</li>',
      '<li>In the movement phase, keep your pieces connected so they can support each other.</li>',
      "<li>Don't panic if you reach the flying phase — the extra mobility can turn the game ",
      'around.</li>',
      '</ul>',
      '</section>',
    ].join('\n');
  }

  /**
   * Create and display the full-screen info page.
   * Removes existing page first if open (idempotent).
   */
  public show(): void {
    this.close();

    this.pageElement = document.createElement('div');
    this.pageElement.className = 'info-page';
    this.pageElement.setAttribute('aria-label', "Nine Men's Morris — History and Rules");

    const content = document.createElement('div');
    content.className = 'info-page-content';

    // Title
    const title = document.createElement('h1');
    title.className = 'info-page-title';
    title.textContent = "Nine Men's Morris";

    const subtitle = document.createElement('p');
    subtitle.className = 'info-page-subtitle';
    subtitle.textContent = 'History & Rules';

    // Scrollable body
    const body = document.createElement('div');
    body.className = 'info-page-body';
    body.innerHTML = this.getHistoryContent() + this.getRulesContent();

    // Back to Menu button
    const backBtn = document.createElement('button');
    backBtn.className = 'game-button primary-button info-page-back';
    backBtn.textContent = 'Back to Menu';
    backBtn.addEventListener('click', () => {
      if (this.onBackToMenu) {
        this.onBackToMenu();
      }
    });

    // Fixed header with back button
    const header = document.createElement('div');
    header.className = 'info-page-header';
    backBtn.classList.add('info-page-back');
    header.appendChild(backBtn);

    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(body);
    this.pageElement.appendChild(header);
    this.pageElement.appendChild(content);

    document.body.appendChild(this.pageElement);
  }

  /**
   * Remove the page element from the DOM.
   */
  public close(): void {
    if (this.pageElement) {
      this.pageElement.remove();
      this.pageElement = null;
    }
  }

  /**
   * Returns true if the page element is currently in the DOM.
   */
  public isOpen(): boolean {
    return this.pageElement !== null && document.body.contains(this.pageElement);
  }
}
