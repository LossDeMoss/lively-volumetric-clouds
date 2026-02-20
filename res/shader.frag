#version 300 es
precision highp float;
precision highp sampler3D;

uniform vec3 iResolution;
uniform float iTime;
uniform sampler3D u_noise;

uniform vec3 u_cameraPos;
uniform vec3 u_cameraTarget;
uniform float u_noiseScale;
uniform float u_fov;
uniform float u_cloudSpeed;
uniform int u_cloudType;
uniform int u_lightPreset;

out vec4 fragColor;

float snoise(vec3 p) {
    return texture(u_noise, p * u_noiseScale).r * 2.0 - 1.0;
}

mat3 setCamera(vec3 ro, vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    return mat3(cu, cv, cw);
}

float densityCumulus(vec3 p, int highRes) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * iTime * u_cloudSpeed;
    float f = 0.0;
    if (highRes == 1) {
        f = 0.50000 * snoise(q); q = q * 2.02;
        f += 0.25000 * snoise(q); q = q * 2.03;
        f += 0.12500 * snoise(q); q = q * 2.01;
        f += 0.06250 * snoise(q); q = q * 2.02;
        f += 0.03125 * snoise(q);
    } else {
        f = 0.50000 * snoise(q); q = q * 2.02;
        f += 0.25000 * snoise(q); q = q * 2.03;
        f += 0.12500 * snoise(q); q = q * 2.01;
        f += 0.06250 * snoise(q);
    }
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
}

float densityCirrus(vec3 p, int highRes) {
    vec3 q = p - vec3(0.3, 0.5, 0.5) * iTime * u_cloudSpeed * 0.2;
    
    q.xz *= 0.2;
    q.y  *= 4.0;
    
    float n1 = snoise(q * 4.0);
    float n2 = snoise(q * 8.0 + 123.0);
    float n3 = highRes == 1 ? snoise(q * 16.0 + 456.0) : 0.0;
    
    float f = abs(n1) * 0.6 + abs(n2) * 0.3 + abs(n3) * 0.1;
    f = pow(f, 1.2);
    if (p.y < 0.0 || p.y > 1.0) return 0.0;
    float heightFactor = sin(p.y * 3.14159);
    
    return clamp(f * heightFactor * 0.8, 0.0, 0.8);
}

float densityStratus(vec3 p, int highRes) {
    vec3 q = p - vec3(0.2, 0.5, 0.3) * iTime * u_cloudSpeed * 0.3;
    
    float n1 = snoise(q * 1.5);
    float n2 = snoise(q * 3.0 + 10.0);
    float n3 = snoise(q * 6.0 + 20.0);
    float n4 = highRes == 1 ? snoise(q * 12.0 + 30.0) : 0.0;
    
    float f = n1 * 0.5 + n2 * 0.3 + n3 * 0.15 + n4 * 0.05;
    f = clamp(f * 1.2, 0.0, 1.0);
    float layer = exp(-abs(p.y - 0.5) * 3.0);
    float holes = 0.5 + 0.5 * sin(q.x * 5.0 + q.z * 4.0);
    
    return clamp(f * layer * holes * 0.8, 0.0, 0.8);
}


float densityCellular(vec3 p, int highRes) {
    vec3 q = p - vec3(0.0, 0.2, 1.0) * iTime * u_cloudSpeed;

    float n1 = abs(snoise(q * 2.0));
    float n2 = abs(snoise(q * 4.0));
    float n3 = highRes == 1 ? abs(snoise(q * 8.0)) : 0.0;

    float f = (n1 * 0.6 + n2 * 0.3 + n3 * 0.1);
    f = pow(f, 1.5);

    return clamp(1.5 - p.y - 1.5 + 1.5 * f, 0.0, 1.0);
}

float cloudDensity(vec3 p, int highRes) {
    if (u_cloudType == 0) {
        return densityCumulus(p, highRes);
    } else if (u_cloudType == 1) {
        return densityCirrus(p, highRes);
    } else if (u_cloudType == 2) {
        return densityStratus(p, highRes);
    } else {
        return densityCellular(p, highRes);
    }
}

vec3 getSunDir() {
    if (u_lightPreset == 0) return normalize(vec3(-0.7071, 0.0, -0.7071));
    else if (u_lightPreset == 1) return normalize(vec3(-0.5, 0.3, -0.8));
    else if (u_lightPreset == 2) return normalize(vec3(0.5, 0.2, -0.8));
    else if (u_lightPreset == 3) return normalize(vec3(0.0, -0.5, -1.0));
    else return normalize(vec3(-0.3, -0.2, -0.9));
}

vec3 getSunColor() {
    if (u_lightPreset == 0) return vec3(1.0, 0.95, 0.9);
    else if (u_lightPreset == 1) return vec3(1.0, 0.6, 0.3);
    else if (u_lightPreset == 2) return vec3(1.0, 0.4, 0.2);
    else if (u_lightPreset == 3) return vec3(1.0, 0.8, 0.6) * 0.5;
    else return vec3(0.5, 0.6, 1.0) * 0.3;
}

vec3 getAmbientColor(vec3 rd) {
    if (u_lightPreset == 0) return vec3(0.5, 0.8, 1.0) - rd.y * 0.15 * vec3(0.8, 0.5, 0.7);
    else if (u_lightPreset == 1) return vec3(0.8, 0.5, 0.3) - rd.y * 0.1 * vec3(0.5, 0.3, 0.2);
    else if (u_lightPreset == 2) return vec3(0.7, 0.4, 0.2) - rd.y * 0.1 * vec3(0.4, 0.2, 0.1);
    else if (u_lightPreset == 3) {
        float up = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
        return mix(vec3(0.2, 0.1, 0.05), vec3(0.0, 0.0, 0.02), up);
    } else return vec3(0.02, 0.03, 0.05);
}

float stars(vec3 rd) {
    if (u_lightPreset != 4) return 0.0;
    float n1 = snoise(rd * 50.0);
    float n2 = snoise(rd * 80.0 + 10.0);
    float twinkle = sin(iTime * 5.0 + rd.x * 100.0) * 0.5 + 0.5;
    float threshold = 0.995 + 0.003 * twinkle;
    float star1 = step(threshold, abs(n1)) * 0.8;
    float star2 = step(threshold * 1.1, abs(n2)) * 0.4;
    return star1 + star2;
}

float cityLights(vec3 rd) {
    if (u_lightPreset != 3) return 0.0;
    if (rd.y > 0.1) return 0.0;
    float n = snoise(rd * 100.0 + 20.0);
    float n2 = snoise(rd * 150.0 - 30.0);
    float light1 = step(0.998, abs(n)) * 0.8;
    float light2 = step(0.997, abs(n2)) * 0.5;
    float fade = clamp(1.0 - abs(rd.y) * 2.0, 0.0, 1.0);
    return (light1 + light2) * fade;
}

vec4 raymarch(vec3 ro, vec3 rd, vec3 bgcol, ivec2 px) {
    const float MAX_DIST = 30.0;
    vec4 sum = vec4(0.0);
    float t = 0.05 * fract(sin(float(px.x) * 12.9898 + float(px.y) * 78.233) * 43758.5453);

    for (int i = 0; i < 30; i++) {
        if (t >= MAX_DIST || sum.a > 0.99) break;
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0) break;

        float den = cloudDensity(pos, 1);
        if (den > 0.01) {
            vec3 sunDir = getSunDir();
            vec3 sunCol = getSunColor();
            float dif = clamp((den - cloudDensity(pos + 0.3 * sunDir, 1)) / 0.6, 0.0, 1.0);
            vec3 lin = sunCol * dif + getAmbientColor(rd);
            vec3 color = mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den);
            color *= lin;
            color = mix(color, bgcol, 1.0 - exp(-0.003 * t * t));

            float alpha = den * 0.8;
            sum += vec4(color * alpha, alpha) * (1.0 - sum.a);
        }
        t += max(0.08, 0.06 * t);
    }

    for (int i = 0; i < 25; i++) {
        if (t >= MAX_DIST || sum.a > 0.99) break;
        vec3 pos = ro + t * rd;
        if (pos.y < -3.0 || pos.y > 2.0) break;

        float den = cloudDensity(pos, 0);
        if (den > 0.01) {
            vec3 sunDir = getSunDir();
            vec3 sunCol = getSunColor();
            float dif = clamp((den - cloudDensity(pos + 0.3 * sunDir, 0)) / 0.6, 0.0, 1.0);
            vec3 lin = sunCol * dif + getAmbientColor(rd);
            vec3 color = mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den);
            color *= lin;
            color = mix(color, bgcol, 1.0 - exp(-0.003 * t * t));

            float alpha = den * 0.8;
            sum += vec4(color * alpha, alpha) * (1.0 - sum.a);
        }
        t += max(0.08, 0.06 * t);
    }

    return clamp(sum, 0.0, 1.0);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    vec3 ro = u_cameraPos;
    vec3 ta = u_cameraTarget;
    float fl = 1.5 * u_fov;
    mat3 ca = setCamera(ro, ta, 0.0);
    vec3 rd = ca * normalize(vec3(p.xy, fl));

    vec3 sunDir = getSunDir();
    float sun = clamp(dot(sunDir, rd), 0.0, 1.0);

    vec3 bgcol;
    if (u_lightPreset == 3) {
        float up = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
        bgcol = mix(vec3(0.2, 0.1, 0.05), vec3(0.0, 0.0, 0.1), up);
        bgcol += vec3(1.0, 0.6, 0.2) * pow(sun, 16.0) * 0.5;
        bgcol += vec3(1.0, 0.8, 0.4) * cityLights(rd);
    } else if (u_lightPreset == 4) {
        bgcol = vec3(0.02, 0.03, 0.05);
        bgcol += vec3(stars(rd));
    } else {
        bgcol = getAmbientColor(rd);
        bgcol += getSunColor() * 0.2 * pow(sun, 8.0);
    }

    vec4 res = raymarch(ro, rd, bgcol, ivec2(fragCoord));
    vec3 col = bgcol * (1.0 - res.w) + res.xyz;

    if (u_lightPreset != 4) {
        col += getSunColor() * 0.2 * pow(sun, 3.0);
    }

    fragColor = vec4(col, 1.0);
}