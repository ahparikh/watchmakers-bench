/** Movement speed control: a stepped slider inside the drawing panel.
 *  It drives the hidden <select id="speed"> that main.ts listens to, so the frame loop is untouched. */

export const SPEED_STOPS: { value: number; label: string }[] = [
  { value: 0.01, label: "1/100" },
  { value: 0.05, label: "1/20" },
  { value: 0.1, label: "1/10" },
  { value: 0.2, label: "1/5" },
  { value: 1, label: "real time" },
];
export const DEFAULT_SPEED = 0.1;

export function mountSpeedControl(host: HTMLElement, select: HTMLSelectElement, pause: HTMLElement): void {
  const start = Math.max(0, SPEED_STOPS.findIndex((s) => s.value === DEFAULT_SPEED));
  host.innerHTML = `<label class="tempo-label" for="speed-slider">Movement speed</label>
    <div class="tempo-track">
      <input id="speed-slider" type="range" min="0" max="${SPEED_STOPS.length - 1}" step="1" value="${start}" aria-valuetext="${SPEED_STOPS[start].label}" />
      <div class="tempo-stops" aria-hidden="true" style="--n:${SPEED_STOPS.length - 1}">${SPEED_STOPS.map((s, i) => `<span style="--i:${i}">${s.label}</span>`).join("")}</div>
    </div>`;
  host.appendChild(pause);
  const slider = host.querySelector<HTMLInputElement>("#speed-slider")!;
  const apply = () => {
    const stop = SPEED_STOPS[Number(slider.value)];
    slider.setAttribute("aria-valuetext", stop.label);
    host.querySelectorAll<HTMLElement>(".tempo-stops span").forEach((el, i) => el.classList.toggle("on", i === Number(slider.value)));
    select.value = String(stop.value);
    select.dispatchEvent(new Event("change"));
  };
  slider.oninput = apply;
  apply();
}
