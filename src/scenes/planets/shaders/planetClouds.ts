/**
 * Aurelia cloud layer shader — FBM cloud formations on a transparent sphere.
 *
 * Uses multi-octave 3-D noise sampled on the sphere normal to produce
 * irregular cloud patches.  The cloud layer rotates slightly faster than
 * the surface to simulate atmospheric circulation.
 *
 * depthWrite: false + NormalBlending lets the surface show through.
 */

export const CLOUDS_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  void main() {
    vNormal      = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPosition    = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const CLOUDS_FRAG = /* glsl */ `
  uniform vec3  uLightDir;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  // ---- noise primitives (same hash as surface) ----------------------------

  vec3 hash3c(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  float noise3c(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(dot(hash3c(i            ) * 2.0 - 1.0, f            ),
            dot(hash3c(i + vec3(1,0,0)) * 2.0 - 1.0, f - vec3(1,0,0)), u.x),
        mix(dot(hash3c(i + vec3(0,1,0)) * 2.0 - 1.0, f - vec3(0,1,0)),
            dot(hash3c(i + vec3(1,1,0)) * 2.0 - 1.0, f - vec3(1,1,0)), u.x),
        u.y),
      mix(
        mix(dot(hash3c(i + vec3(0,0,1)) * 2.0 - 1.0, f - vec3(0,0,1)),
            dot(hash3c(i + vec3(1,0,1)) * 2.0 - 1.0, f - vec3(1,0,1)), u.x),
        mix(dot(hash3c(i + vec3(0,1,1)) * 2.0 - 1.0, f - vec3(0,1,1)),
            dot(hash3c(i + vec3(1,1,1)) * 2.0 - 1.0, f - vec3(1,1,1)), u.x),
        u.y),
      u.z);
  }

  float fbmCloud(vec3 p) {
    float v   = 0.0;
    float amp = 0.55;
    float frq = 1.0;
    for (int i = 0; i < 4; i++) {
      v   += amp * noise3c(p * frq);
      frq *= 2.1;
      amp *= 0.44;
    }
    return v * 0.5 + 0.5;
  }

  void main() {
    vec3  domain = normalize(vWorldNormal) * 2.6;
    float cloud  = fbmCloud(domain + vec3(5.3, 8.1, 2.6));

    // Sharpen the cloud boundary — creates definite clouds vs clear sky
    float alpha = smoothstep(0.54, 0.74, cloud) * uOpacity;
    if (alpha < 0.01) discard;

    // Cloud lighting — bright on lit side, dimmed on night side
    vec3  N    = normalize(vWorldNormal);
    vec3  L    = normalize(uLightDir);
    float NdL  = dot(N, L);
    float lite = smoothstep(-0.1, 0.4, NdL);

    // Cloud color: bright white on day side, grey-blue tint at terminator
    vec3 dayColor   = vec3(0.95, 0.96, 1.00);
    vec3 nightColor = vec3(0.12, 0.14, 0.20);
    vec3 cloudColor = mix(nightColor, dayColor, lite);

    gl_FragColor = vec4(cloudColor, alpha);
  }
`
