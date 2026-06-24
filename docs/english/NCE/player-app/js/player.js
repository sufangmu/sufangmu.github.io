/**
 * NCE Audio Player Engine
 * Handles: LRC parsing, audio playback sync, and 4 playback modes.
 *
 * Modes:
 *   'normal'      — play all sentences of a lesson, then auto-advance to next lesson
 *   'loopAll'     — loop the entire lesson forever
 *   'sentenceOnce'— play one sentence then pause
 *   'sentenceLoop'— loop current sentence N times with an interval between loops
 */

/**
 * Encode a file path for safe use in fetch()/Audio.src.
 * For absolute URLs, only encodes the path portion (preserves protocol+host).
 * For relative paths, encodes each segment separately.
 * This handles special characters like & and fullwidth symbols.
 */
function encodePath(p) {
  // If it's an absolute URL, separate protocol+host from the path
  const match = p.match(/^(https?:\/\/[^\/]+)(\/.*)$/);
  if (match) {
    return match[1] + match[2].split('/').map(encodeURIComponent).join('/');
  }
  // Relative path
  return p.split('/').map(encodeURIComponent).join('/');
}

class NCEPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto'; // Preload entire file for smooth seeking
    this.lyrics = [];           // [{startTime, endTime, text}]
    this.currentIndex = -1;     // current lyric line index
    this.mode = 'normal';       // 'normal' | 'loopAll' | 'sentenceOnce' | 'sentenceLoop'
    this.isPlaying = false;

    // SentenceLoop settings
    this.loopCount = 3;         // how many times to repeat (1-10)
    this.loopInterval = 2;      // seconds between repetitions (1-10)

    // Internal
    this.listeners = [];
    this._boundTimeUpdate = this._onTimeUpdate.bind(this);
    this._boundEnded = this._onEnded.bind(this);
    this._boundLoaded = this._onLoaded.bind(this);
    this._sentencePauseAt = -1; // endTime to pause at (for sentenceOnce/sentenceLoop)
    this._currentLoopCount = 0; // current repetition count within a sentenceLoop
    this._loopTimer = null;     // setTimeout ID for loop interval
  }

  /**
   * Load audio and LRC, prepare for playback.
   */
  async load(audioUrl, lrcUrl) {
    this.pause();
    this.lyrics = [];
    this.currentIndex = -1;
    this._sentencePauseAt = -1;
    this._currentLoopCount = 0;
    clearTimeout(this._loopTimer);
    this._loopTimer = null;

    // Encode URLs to handle special characters in filenames (&, －, etc.)
    const encodedLrcUrl = encodePath(lrcUrl);
    const encodedAudioUrl = encodePath(audioUrl);

    // Fetch and parse LRC
    const resp = await fetch(encodedLrcUrl);
    if (!resp.ok) throw new Error(`Failed to load LRC: ${resp.status}`);
    const text = await resp.text();
    this.lyrics = this._parseLRC(text);

    // Bind events BEFORE setting source (avoid race with loadedmetadata)
    this.audio.removeEventListener('timeupdate', this._boundTimeUpdate);
    this.audio.removeEventListener('ended', this._boundEnded);
    this.audio.removeEventListener('loadedmetadata', this._boundLoaded);
    this.audio.addEventListener('timeupdate', this._boundTimeUpdate);
    this.audio.addEventListener('ended', this._boundEnded);
    this.audio.addEventListener('loadedmetadata', this._boundLoaded);

    // Set audio source
    this.audio.src = encodedAudioUrl;
    this.audio.load();

    this._notify('loaded');
  }

  /**
   * Parse LRC text into structured array.
   * Format: [mm:ss.ms]lyric text
   */
  _parseLRC(text) {
    const lines = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Extract all timestamps on this line
      const timestamps = [];
      let match;
      while ((match = timeRegex.exec(trimmed)) !== null) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        let ms = parseInt(match[3], 10);
        if (match[3].length === 2) ms *= 10; // 2-digit ms → milliseconds
        timestamps.push(mins * 60 + secs + ms / 1000);
      }

      if (timestamps.length === 0) continue;

      // Get text after last timestamp
      const textPart = trimmed.replace(timeRegex, '').trim();
      if (!textPart) continue;

      // Add each timestamp as a separate entry
      // (some LRC files use multiple timestamps per line for repeated lyrics)
      for (const ts of timestamps) {
        lines.push({ startTime: ts, text: textPart });
      }
    }

    // Sort by start time
    lines.sort((a, b) => a.startTime - b.startTime);

    // Compute endTime for each line
    for (let i = 0; i < lines.length; i++) {
      if (i < lines.length - 1) {
        lines[i].endTime = lines[i + 1].startTime;
      } else {
        lines[i].endTime = lines[i].startTime + 10; // last line: assume 10s duration
      }
    }

    return lines;
  }

  /**
   * Play audio.
   */
  play() {
    if (this.audio.src) {
      this.audio.play();
      this.isPlaying = true;
      this._notify('playState', { isPlaying: true });
    }
  }

  /**
   * Pause audio.
   */
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this._sentencePauseAt = -1;
    clearTimeout(this._loopTimer);
    this._loopTimer = null;
    this._notify('playState', { isPlaying: false });
  }

  /**
   * Toggle play/pause.
   */
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to a specific lyric line index.
   */
  seekTo(index) {
    if (index >= 0 && index < this.lyrics.length) {
      clearTimeout(this._loopTimer);
      this._loopTimer = null;
      this._currentLoopCount = 0;
      const time = this.lyrics[index].startTime;
      this.audio.currentTime = time;
      this.currentIndex = index;
      this._sentencePauseAt = -1;
      this._notify('seek', { index, time });
      // If was playing, continue
      if (this.isPlaying) {
        this._updateSentencePause();
      }
    }
  }

  /**
   * Seek to a specific time in seconds.
   */
  seekToTime(seconds) {
    this.audio.currentTime = Math.max(0, seconds);
    this._sentencePauseAt = -1;
    this._currentLoopCount = 0;
    clearTimeout(this._loopTimer);
    this._loopTimer = null;
    if (this.isPlaying) {
      this._updateSentencePause();
    }
  }

  /**
   * Go to next sentence.
   */
  nextSentence() {
    if (this.currentIndex < this.lyrics.length - 1) {
      this.seekTo(this.currentIndex + 1);
      if (!this.isPlaying && this.mode === 'sentenceOnce') {
        this.play();
      }
    }
  }

  /**
   * Go to previous sentence.
   */
  prevSentence() {
    if (this.currentIndex > 0) {
      this.seekTo(this.currentIndex - 1);
      if (!this.isPlaying && this.mode === 'sentenceOnce') {
        this.play();
      }
    }
  }

  /**
   * Set playback mode.
   * @param {'normal'|'loopAll'|'sentenceOnce'|'sentenceLoop'} mode
   */
  setMode(mode) {
    this.mode = mode;
    this._sentencePauseAt = -1;
    this._currentLoopCount = 0;
    clearTimeout(this._loopTimer);
    this._loopTimer = null;
    if (this.isPlaying) {
      this._updateSentencePause();
    }
    this._notify('modeChange', { mode });
  }

  /**
   * Set loop count for sentenceLoop mode.
   * @param {number} n - 1 to 10
   */
  setLoopCount(n) {
    this.loopCount = Math.max(1, Math.min(10, Math.round(n)));
  }

  /**
   * Set loop interval (seconds) for sentenceLoop mode.
   * @param {number} n - 1 to 10
   */
  setLoopInterval(n) {
    this.loopInterval = Math.max(1, Math.min(10, Math.round(n)));
  }

  /**
   * Register a callback for player events.
   * @param {(event, data) => void} callback
   */
  onUpdate(callback) {
    this.listeners.push(callback);
  }

  /**
   * Get current audio time.
   */
  getCurrentTime() {
    return this.audio.currentTime;
  }

  /**
   * Get audio duration.
   */
  getDuration() {
    return this.audio.duration || 0;
  }

  // --- Private methods ---

  _onTimeUpdate() {
    const time = this.audio.currentTime;

    // Find current lyric line
    let newIndex = -1;
    for (let i = 0; i < this.lyrics.length; i++) {
      if (time >= this.lyrics[i].startTime && time < this.lyrics[i].endTime) {
        newIndex = i;
        break;
      }
    }

    // Also check if we're before the first line
    if (newIndex === -1 && this.lyrics.length > 0 && time < this.lyrics[0].startTime) {
      newIndex = -1; // not yet started
    }

    // Check sentenceOnce / sentenceLoop pause point
    if (this.isPlaying && this._sentencePauseAt > 0 && time >= this._sentencePauseAt) {
      if (this.mode === 'sentenceOnce') {
        this.pause();
      } else if (this.mode === 'sentenceLoop') {
        this._currentLoopCount++;
        if (this._currentLoopCount < this.loopCount) {
          // More repetitions remain — pause for interval seconds, then replay
          this.audio.pause();
          this.isPlaying = false;
          this._sentencePauseAt = -1;
          this._notify('playState', { isPlaying: false });
          this._loopTimer = setTimeout(() => {
            this._loopTimer = null;
            if (this.mode === 'sentenceLoop' &&
                this.currentIndex >= 0 &&
                this.currentIndex < this.lyrics.length) {
              this.isPlaying = true;
              this.audio.currentTime = this.lyrics[this.currentIndex].startTime;
              this._updateSentencePause();
              this.audio.play();
              this._notify('playState', { isPlaying: true });
            }
          }, this.loopInterval * 1000);
        } else {
          // All repetitions complete — stop on this sentence
          this._currentLoopCount = 0;
          this.pause();
        }
      }
      return;
    }

    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      this._updateSentencePause();
      this._notify('lyricChange', {
        index: newIndex,
        time: time,
        lyric: newIndex >= 0 ? this.lyrics[newIndex] : null,
      });
    }

    // Always notify time update for progress bar
    this._notify('timeUpdate', {
      currentTime: time,
      duration: this.getDuration(),
    });
  }

  _onEnded() {
    if (this.mode === 'loopAll') {
      // Loop the entire lesson
      this.audio.currentTime = 0;
      this.currentIndex = -1;
      this._sentencePauseAt = -1;
      this.audio.play();
    } else if (this.mode === 'normal') {
      // Sequential book playback: signal app to load the next lesson
      this.isPlaying = false;
      this.currentIndex = -1;
      this._sentencePauseAt = -1;
      this._notify('playState', { isPlaying: false });
      this._notify('ended');
      this._notify('requestNextLesson');
    } else {
      this.isPlaying = false;
      this.currentIndex = -1;
      this._sentencePauseAt = -1;
      this._notify('playState', { isPlaying: false });
      this._notify('ended');
    }
  }

  _onLoaded() {
    this._notify('timeUpdate', {
      currentTime: 0,
      duration: this.getDuration(),
    });
  }

  /**
   * In sentenceOnce/sentenceLoop mode, set the pause point.
   */
  _updateSentencePause() {
    if ((this.mode === 'sentenceOnce' || this.mode === 'sentenceLoop') &&
        this.isPlaying &&
        this.currentIndex >= 0 &&
        this.currentIndex < this.lyrics.length) {
      this._sentencePauseAt = this.lyrics[this.currentIndex].endTime;
    } else {
      this._sentencePauseAt = -1;
    }
  }

  _notify(event, data = {}) {
    for (const cb of this.listeners) {
      try {
        cb(event, data);
      } catch (e) {
        console.error('Player listener error:', e);
      }
    }
  }
}

// Export as global
window.NCEPlayer = NCEPlayer;
