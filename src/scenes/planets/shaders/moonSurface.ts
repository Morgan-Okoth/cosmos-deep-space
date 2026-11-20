/**
 * LUNA-01 surface shader — rocky grey cratered moon.
 *
 * Uses 4-octave FBM to generate a rough, varied grey surface with subtle
 * crater-like depressions (darker low-frequency patches).  Lighting uses
 * the same directional light as Aurelia for visual consistency.
 */

export const MOON_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  void main() {
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPosition    = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const MOON_FRAG = /* glsl */ `
  uniform vec3 uLightDir;
  uniform vec3 uCameraPos;

  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  // ---- noise primitives ---------------------------------------------------

  vec3 hashM(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  float noiseM(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(dot(hashM(i            ) * 2.0 - 1.0, f            ),
            dot(hashM(i + vec3(1,0,0)) * 2.0 - 1.0, f - vec3(1,0,0)), u.x),
        mix(dot(hashM(i + vec3(0,1,0)) * 2.0 - 1.0, f - vec3(0,1,0)),
            dot(hashM(i + vec3(1,1,0)) * 2.0 - 1.0, f - vec3(1,1,0)), u.x),
        u.y),
      mix(
        mix(dot(hashM(i + vec3(0,0,1)) * 2.0 - 1.0, f - vec3(0,0,1)),
            dot(hashM(i + vec3(1,0,1)) * 2.0 - 1.0, f - vec3(1,0,1)), u.x),
        mix(dot(hashM(i + vec3(0,1,1)) * 2.0 - 1.0, f - vec3(0,1,1)),
            dot(hashM(i + vec3(1,1,1)) * 2.0 - 1.0, f - vec3(1,1,1)), u.x),
        u.y),
      u.z);
  }

  // 4-octave FBM — higher frequency than planet to show fine rocky detail
  float fbmMoon(vec3 p) {
    float v   = 0.0;
    float amp = 0.5;
    float frq = 1.0;
    for (int i = 0; i < 4; i++) {
      v   += amp * noiseM(p * frq);
      frq *= 2.18;
      amp *= 0.46;
    }
    return v * 0.5 + 0.5;
  }

  void main() {
    vec3  N      = normalize(vWorldNormal);
    vec3  domain = N * 3.2;

    // Large-scale variation — crater basins (low values = dark mare regions)
    float coarse = fbmMoon(domain + vec3(1.3, 4.7, 2.1));
    // Fine surface roughness
    float fine   = fbmMoon(domain * 2.5 + vec3(7.2, 3.1, 8.6));

    // Base grey: mid-tone rocky surface
    float grey = mix(0.28, 0.58, coarse);
    // Overlay fine detail for surface texture
    grey = mix(grey, grey * mix(0.75, 1.15, fine), 0.45);

    // Crater-like darkening: sharp dips in coarse noise
    float craterMask = smoothstep(0.30, 0.42, 1.0 - coarse);
    grey = mix(grey, grey * 0.60, craterMask * 0.7);

    vec3 baseColor = vec3(grey);

    // ---- Blinn-Phong lighting (matte — no specular on a dry rock) ---------
    vec3  L   = normalize(uLightDir);
    vec3  V   = normalize(uCameraPos - vPosition);
    vec3  H   = normalize(L + V);
    float NdL = dot(N, L);

    float wrap    = (NdL + 0.08) / 1.08;
    float diffuse = smoothstep(-0.05, 0.25, wrap);
    float ambient = 0.04;

    // Night-side fade to dark
    float nightFade = smoothstep(-0.02, 0.22, NdL);

    vec3 finalColor = baseColor * (ambient + diffuse * nightFade * 0.95);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`
