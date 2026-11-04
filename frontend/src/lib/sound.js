/* Tiny synthesized UI sounds — no audio files; disabled until the visitor opts in. */

export const sound = (() => {
  let ctx = null;
  let enabled = false;
  const TONES = {
    click: [[880, 0.03]],
    open: [[520, 0.05], [780, 0.07]],
    close: [[600, 0.05], [400, 0.07]],
    toggle: [[700, 0.04], [1050, 0.05]],
    notify: [[660, 0.08], [990, 0.12]],
    achieve: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.16]],
    error: [[200, 0.14]],
  };
  const play = (name) => {
    if (!enabled) return;
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      for (const [freq, dur] of TONES[name] || []) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
        t += dur * 0.9;
      }
    } catch { /* audio unavailable — stay silent */ }
  };
  return { play, setEnabled: (v) => { enabled = v; } };
})();
