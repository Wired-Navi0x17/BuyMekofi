/**
 * Burning-paper shader. Adapted from Ksenia Kondrashova's CodePen demo
 * (MIT, see CREDITS.md). Changes: paper tinted to the `sheet` token,
 * premultiplied-alpha output, monochrome ash edge instead of orange fire,
 * WebGL setup returns a disposable handle instead of using globals.
 */

export const VERTEX_SHADER = `
precision mediump float;
varying vec2 vUv;
attribute vec2 a_position;
void main() {
  vUv = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

float rand(vec2 n) {
  return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
float noise(vec2 n) {
  const vec2 d = vec2(0., 1.);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
  return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}
float fbm(vec2 n) {
  float total = 0.0, amplitude = .4;
  for (int i = 0; i < 4; i++) {
    total += noise(n) * amplitude;
    n += n;
    amplitude *= 0.6;
  }
  return total;
}

void main() {
  vec2 uv = vUv;
  uv.x *= min(1., u_resolution.x / u_resolution.y);
  uv.y *= min(1., u_resolution.y / u_resolution.x);

  float t = u_progress;
  // sheet token #F6F1E4 (newsprint)
  vec3 color = vec3(.965, .945, .894);

  float main_noise = 1. - fbm(.75 * uv + 10. - vec2(.3, .9 * t));

  float paper_darkness = smoothstep(main_noise - .1, main_noise, t);
  // Char towards neutral ink black (subtracting the paper itself avoids a colour cast).
  color -= vec3(.965, .945, .894) * paper_darkness * .97;

  // Monochrome: an ash-white smoulder instead of orange flame (founder, no orange).
  vec3 fire_color = fbm(6. * uv - vec2(0., .005 * u_time)) * vec3(2.6);
  float show_fire = smoothstep(.4, .9, fbm(10. * uv + 2. - vec2(0., .005 * u_time)));
  show_fire += smoothstep(.7, .8, fbm(.5 * uv + 5. - vec2(0., .001 * u_time)));

  float fire_border = .02 * show_fire;
  float fire_edge = smoothstep(main_noise - fire_border, main_noise - .5 * fire_border, t);
  fire_edge *= (1. - smoothstep(main_noise - .5 * fire_border, main_noise, t));
  color += fire_color * fire_edge;

  float opacity = 1. - smoothstep(main_noise - .0005, main_noise, t);
  // Premultiplied output: burnt-through pixels must add no colour to the page.
  gl_FragColor = vec4(clamp(color, 0., 1.) * opacity, opacity);
}`;

export type BurnRenderer = {
  resize(): void;
  draw(progress: number, timeMs: number): void;
  dispose(): void;
};

function compile(gl: WebGLRenderingContext, source: string, type: number): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

/** Returns null when WebGL is unavailable; callers fall back to no intro. */
export function createBurnRenderer(canvas: HTMLCanvasElement, maxDpr = 2): BurnRenderer | null {
  const gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) return null;

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  try {
    const vs = compile(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
    const fs = compile(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    program = gl.createProgram();
    if (!program) throw new Error("createProgram failed");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
    }
  } catch (error) {
    console.error(error);
    return null;
  }

  gl.useProgram(program);
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uProgress = gl.getUniformLocation(program, "u_progress");
  const uTime = gl.getUniformLocation(program, "u_time");

  const glRef = gl;
  return {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      glRef.viewport(0, 0, canvas.width, canvas.height);
      glRef.uniform2f(uResolution, canvas.width, canvas.height);
    },
    draw(progress, timeMs) {
      glRef.uniform1f(uTime, timeMs);
      glRef.uniform1f(uProgress, progress);
      glRef.drawArrays(glRef.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      if (buffer) glRef.deleteBuffer(buffer);
      if (program) glRef.deleteProgram(program);
      // Not calling loseContext(): the same canvas can be re-initialised
      // (StrictMode, <Activity> re-show). The context is freed with the canvas.
    },
  };
}
