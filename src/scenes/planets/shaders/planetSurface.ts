/**
 * Aurelia surface shader — procedural ocean/continent coloring + lighting.
 *
 * The fragment shader:
 *  1. Runs 5-octave FBM on the sphere's object-space normal (effectively
 *     spherical UV) to generate a coherent continent mask.
 *  2. Maps the mask to ocean/land/highland/snow colors using smoothstep bands.
 *  3. Applies Blinn-Phong lighting using the directional light direction
 *     passed as a uniform, producing a natural day/night terminator.
 *  4. Darkens the night hemisphere gradually to reveal the spherical form.
 */

export const SURFACE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;

  void main() {
    vNormal      = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPosition    = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const SURFACE_FRAG = /* glsl */ `
  uniform vec3  uLightDir;      // normalised direction TO the light
  uniform vec3  uCameraPos;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;

  // ---- noise primitives ----------------------------------------------------

  vec3 hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(dot(hash3(i            ) * 2.0 - 1.0, f            ),
            dot(hash3(i + vec3(1,0,0)) * 2.0 - 1.0, f - vec3(1,0,0)), u.x),
        mix(dot(hash3(i + vec3(0,1,0)) * 2.0 - 1.0, f - vec3(0,1,0)),
            dot(hash3(i + vec3(1,1,0)) * 2.0 - 1.0, f - vec3(1,1,0)), u.x),
        u.y),
      mix(
        mix(dot(hash3(i + vec3(0,0,1)) * 2.0 - 1.0, f - vec3(0,0,1)),
            dot(hash3(i + vec3(1,0,1)) * 2.0 - 1.0, f - vec3(1,0,1)), u.x),
        mix(dot(hash3(i + vec3(0,1,1)) * 2.0 - 1.0, f - vec3(0,1,1)),
            dot(hash3(i + vec3(1,1,1)) * 2.0 - 1.0, f - vec3(1,1,1)), u.x),
        u.y),
      u.z);
  }

  // 5-octave FBM on the sphere surface (uses world-space normal as domain)
  float fbm(vec3 p) {
    float v   = 0.0;
    float amp = 0.52;
    float frq = 1.0;
    for (int i = 0; i < 5; i++) {
      v   += amp * noise3(p * frq);
      frq *= 2.03;
      amp *= 0.48;
    }
    return v * 0.5 + 0.5;   // remap to [0, 1]
  }

  // ---- color palette -------------------------------------------------------

  // Ocean — deep blue to turquoise variation
  vec3 oceanColor(float depth) {
    vec3 deep    = vec3(0.04, 0.09, 0.22);
    vec3 shallow = vec3(0.08, 0.26, 0.42);
    vec3 tropic  = vec3(0.06, 0.38, 0.46);
    float t = smoothstep(0.0, 0.5, depth);
    return mix(mix(deep, shallow, t), tropic, smoothstep(0.6, 0.85, depth));
  }

  // Land — tan desert, green lowland, grey-brown highland
  vec3 landColor(float elevation) {
    vec3 lowland  = vec3(0.28, 0.38, 0.19);  // dark green
    vec3 midland  = vec3(0.42, 0.36, 0.22);  // earthy brown
    vec3 highland = vec3(0.52, 0.48, 0.44);  // grey-tan
    vec3 snow     = vec3(0.88, 0.90, 0.94);  // polar snow

    vec3 col = mix(lowland,  midland,  smoothstep(0.50, 0.65, elevation));
    col      = mix(col,      highland, smoothstep(0.65, 0.78, elevation));
    col      = mix(col,      snow,     smoothstep(0.80, 0.90, elevation));
    return col;
  }

  void main() {
    // ---- continent mask via FBM on the world-space normal ----------------
    // Using vWorldNormal as the 3-D domain gives seamless sphere-wrapping.
    // A slow time offset makes the texture appear truly static (we don't
    // want the surface pattern to rotate with the mesh — it's baked in
    // the rotation of the mesh itself via the vertex transform).
    vec3  domain   = normalize(vWorldNormal) * 2.0;
    float landMask = fbm(domain + vec3(3.7, 1.2, 5.3));

    // Second, finer FBM pass for color variation within each region
    float detail   = fbm(domain * 2.1 + vec3(8.1, 2.4, 1.7));

    // ---- base surface color (ocean vs land) ------------------------------
    float coastline = smoothstep(0.47, 0.54, landMask);
    vec3  surfaceCol;
    if (coastline < 0.5) {
      // Ocean depth variation using the detail pass
      surfaceCol = oceanColor(detail);
    } else {
      // Land elevation mapped to colors
      float elevation = smoothstep(0.47, 0.90, landMask);
      surfaceCol = landColor(elevation);
      // Subtle color variation using detail noise
      surfaceCol = mix(surfaceCol, surfaceCol * vec3(1.1, 0.95, 0.85), detail * 0.3);
    }

    // ---- Blinn-Phong lighting ---------------------------------------------
    vec3 N    = normalize(vWorldNormal);
    vec3 L    = normalize(uLightDir);
    vec3 V    = normalize(uCameraPos - vPosition);
    vec3 H    = normalize(L + V);

    float NdL = dot(N, L);                        // [-1, 1]
    float diff = max(NdL, 0.0);                   // diffuse term

    // Soft terminator — slightly wrap lighting into shadow for realism
    float wrap = (NdL + 0.12) / 1.12;
    float term = smoothstep(-0.08, 0.18, wrap);

    // Specular — ocean glint only (land is rough)
    float spec = 0.0;
    if (coastline < 0.4) {
      float roughness = 0.35;
      float shininess = 1.0 / (roughness * roughness);
      spec = pow(max(dot(N, H), 0.0), shininess) * 0.45 * (1.0 - coastline * 2.0);
    }

    // Ambient — night-side fill, very dark
    vec3 ambient  = surfaceCol * 0.045;
    vec3 diffuse  = surfaceCol * term * 0.92;
    vec3 specular = vec3(0.6, 0.75, 1.0) * spec * diff;

    // Night-side dark overlay — deepens shadow into the hemisphere
    float nightFade = smoothstep(0.0, 0.3, NdL);

    vec3 finalColor = ambient + (diffuse + specular) * nightFade;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`
