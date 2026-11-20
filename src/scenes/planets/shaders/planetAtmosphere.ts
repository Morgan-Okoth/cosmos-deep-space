/**
 * Aurelia atmosphere shader — Fresnel rim effect.
 *
 * Rendered as a slightly larger sphere with BackSide so the inside of the
 * shell faces the camera.  The fragment computes a Fresnel term
 * (1 - |N·V|) to produce a bright rim and transparent interior.
 *
 * The atmosphere is confined to the lit hemisphere to avoid an unrealistic
 * glow on the night side.
 */

export const ATMO_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  void main() {
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPosition    = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const ATMO_FRAG = /* glsl */ `
  uniform vec3  uLightDir;
  uniform vec3  uCameraPos;
  uniform float uIntensity;

  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  void main() {
    vec3  N   = normalize(vWorldNormal);
    vec3  V   = normalize(uCameraPos - vPosition);
    vec3  L   = normalize(uLightDir);

    // Fresnel — strongest at grazing angle (rim), zero when facing camera
    float fresnel = 1.0 - abs(dot(N, V));
    fresnel = pow(fresnel, 3.5);

    // Lit-side modulation: fade atmosphere to near-zero on the night side
    float litFactor = smoothstep(-0.25, 0.4, dot(N, L));

    float alpha = fresnel * litFactor * uIntensity * 0.72;
    if (alpha < 0.005) discard;

    // Atmosphere hue: blue-cyan tint
    vec3 atmoColor = vec3(0.25, 0.60, 1.00);

    gl_FragColor = vec4(atmoColor * alpha, alpha);
  }
`
