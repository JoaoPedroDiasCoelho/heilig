export const FRAMES = [
  ...Array.from(
    { length: 179 },
    (_, index) => `/frames/frame_${String(index + 1).padStart(3, "0")}.png`
  ),
  ...Array.from(
    { length: 6 },
    (_, index) => `/frames/frame_${String(index + 181).padStart(3, "0")}.png`
  ),
];
