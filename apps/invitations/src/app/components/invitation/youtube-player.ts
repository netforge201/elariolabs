'use client';

// A YouTube video as invitation music, played through the official YouTube
// IFrame Player API (https://developers.google.com/youtube/iframe_api_reference).
//
// YouTube's terms require the embedded player to stay visible while it plays
// (at least 200×200 px, nothing drawn over it), and audio may not be extracted.
// So while a YouTube track is active it is shown in a small docked card with
// the real player; YouTube's own controls stay usable. When nothing is playing
// the card is removed from view.

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  cueVideoById(videoId: string): void;
  setVolume(volume: number): void;
  getPlayerState(): number;
};

type YTNamespace = {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } as const;

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads https://www.youtube.com/iframe_api once per page. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      script.remove();
      reject(new Error('YouTube player could not be loaded'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export type YouTubeLabels = { close: string; tapToPlay: string; unavailable: string };
export type YouTubeEvent = 'playing' | 'paused' | 'buffering' | 'blocked' | 'error' | 'closed';

/** If playback has not begun this long after play(), the browser blocked it. */
const BLOCKED_AFTER_MS = 6000;

export class YouTubeDock {
  private readonly root: HTMLDivElement;
  private readonly titleEl: HTMLSpanElement;
  private readonly noteEl: HTMLParagraphElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly frame: HTMLDivElement;
  private player: YTPlayer | null = null;
  private creating = false;
  private ready = false;
  private videoId: string | null = null;
  private wantPlay = false;
  private volume = 80;
  private blockTimer: number | null = null;

  constructor(private readonly onEvent: (event: YouTubeEvent) => void, private labels: YouTubeLabels) {
    this.root = document.createElement('div');
    this.root.className = 'inv-yt-dock';
    this.root.setAttribute('role', 'region');

    const head = document.createElement('div');
    head.className = 'inv-yt-head';
    this.titleEl = document.createElement('span');
    this.titleEl.className = 'inv-yt-title';
    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'inv-yt-close';
    this.closeButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    this.closeButton.addEventListener('click', () => this.onEvent('closed'));
    head.append(this.titleEl, this.closeButton);

    this.frame = document.createElement('div');
    this.frame.className = 'inv-yt-frame';
    const mount = document.createElement('div');
    this.frame.append(mount);

    this.noteEl = document.createElement('p');
    this.noteEl.className = 'inv-yt-note';
    this.noteEl.hidden = true;

    this.root.append(head, this.frame, this.noteEl);
    this.setLabels(labels);
    this.hide();
    document.body.append(this.root);
  }

  setLabels(labels: YouTubeLabels) {
    this.labels = labels;
    this.closeButton.setAttribute('aria-label', labels.close);
    this.closeButton.title = labels.close;
    this.root.setAttribute('aria-label', 'YouTube');
  }

  /** Loads (or cues) a video without playing it. */
  load(videoId: string, title: string | null) {
    this.titleEl.textContent = title ?? 'YouTube';
    this.note(null);
    if (this.videoId === videoId && (this.player || this.creating)) return;
    this.videoId = videoId;
    if (this.player && this.ready) {
      this.player.cueVideoById(videoId);
      return;
    }
    if (this.creating) return; // onReady cues the latest id
    this.creating = true;
    loadYouTubeApi().then(YT => {
      const mount = this.frame.firstElementChild as HTMLElement;
      this.player = new YT.Player(mount, {
        width: '100%',
        height: '100%',
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { playsinline: 1, rel: 0, controls: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            this.ready = true;
            this.creating = false;
            this.player?.setVolume(this.volume);
            if (this.videoId && this.videoId !== videoId) this.player?.cueVideoById(this.videoId);
            if (this.wantPlay) this.play();
          },
          onStateChange: (event: { data: number }) => this.onState(event.data),
          onError: () => {
            this.clearBlockTimer();
            this.note(this.labels.unavailable);
            this.onEvent('error');
          },
        },
      });
    }).catch(() => {
      this.creating = false;
      this.note(this.labels.unavailable);
      this.onEvent('error');
    });
  }

  private onState(state: number) {
    if (state === STATE.PLAYING) {
      this.clearBlockTimer();
      this.note(null);
      this.onEvent('playing');
    } else if (state === STATE.PAUSED) {
      this.onEvent('paused');
    } else if (state === STATE.BUFFERING) {
      this.onEvent('buffering');
    } else if (state === STATE.ENDED) {
      // Background music loops.
      this.player?.seekTo(0, true);
      this.player?.playVideo();
    }
  }

  play() {
    this.show();
    this.wantPlay = true;
    if (!this.player || !this.ready) return; // starts from onReady
    this.player.playVideo();
    this.clearBlockTimer();
    this.blockTimer = window.setTimeout(() => {
      this.blockTimer = null;
      const state = this.player?.getPlayerState();
      if (state !== STATE.PLAYING && state !== STATE.BUFFERING) {
        // Some browsers (notably iOS) only allow a tap on the player itself.
        this.note(this.labels.tapToPlay);
        this.onEvent('blocked');
      }
    }, BLOCKED_AFTER_MS);
  }

  pause() {
    this.wantPlay = false;
    this.clearBlockTimer();
    if (this.ready) this.player?.pauseVideo();
  }

  stop() {
    this.wantPlay = false;
    this.clearBlockTimer();
    if (this.ready) this.player?.stopVideo();
    this.hide();
  }

  setVolume(volume: number) {
    this.volume = Math.round(Math.max(0, Math.min(1, volume)) * 100);
    if (this.ready) this.player?.setVolume(this.volume);
  }

  private show() {
    this.root.classList.add('is-active');
    this.root.removeAttribute('aria-hidden');
    this.root.inert = false;
  }

  private hide() {
    this.root.classList.remove('is-active');
    this.root.setAttribute('aria-hidden', 'true');
    this.root.inert = true;
    this.note(null);
  }

  private note(text: string | null) {
    this.noteEl.textContent = text ?? '';
    this.noteEl.hidden = !text;
  }

  private clearBlockTimer() {
    if (this.blockTimer !== null) window.clearTimeout(this.blockTimer);
    this.blockTimer = null;
  }
}
