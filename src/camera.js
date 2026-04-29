export class CameraController extends EventTarget {
  constructor(video) {
    super();
    this.video = video;
    this.stream = null;
    this.facingMode = "environment";
  }

  async start(facingMode = this.facingMode) {
    this.stop();
    this.facingMode = facingMode;
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    await this.video.play();
    this.dispatchEvent(new CustomEvent("ready", { detail: { facingMode } }));
    return this.stream;
  }

  async flip() {
    const next = this.facingMode === "environment" ? "user" : "environment";
    return this.start(next);
  }

  stop() {
    if (!this.stream) return;
    for (const track of this.stream.getTracks()) track.stop();
    this.stream = null;
  }
}
