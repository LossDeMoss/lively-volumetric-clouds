(function() {
    let gl, program, uniformLocations, cameraState;

    function initWebGL() {
        const canvas = document.getElementById('canvas');
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            alert('WebGL2 is not supported. Try a different browser or update your drivers.');
            return null;
        }
        return gl;
    }

    function createNoiseTexture(gl) {
        const SIZE = 64;
        const data = new Uint8Array(SIZE * SIZE * SIZE);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, texture);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, SIZE, SIZE, SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);
        return texture;
    }

    async function loadShader(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        return await response.text();
    }

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Shader compile error:`, gl.getShaderInfoLog(shader));
            alert('Shader compilation error. See console.');
            return null;
        }
        return shader;
    }

    function createProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        if (!vertexShader || !fragmentShader) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            alert('Program linking error');
            return null;
        }
        return program;
    }

    function setupBuffers(gl, program) {
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionAttrib = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionAttrib);
        gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    function initUniforms(gl, program) {
        return {
            time: gl.getUniformLocation(program, 'iTime'),
            resolution: gl.getUniformLocation(program, 'iResolution'),
            noise: gl.getUniformLocation(program, 'u_noise'),
            cameraPos: gl.getUniformLocation(program, 'u_cameraPos'),
            cameraTarget: gl.getUniformLocation(program, 'u_cameraTarget'),
            noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
            fov: gl.getUniformLocation(program, 'u_fov'),
            cloudSpeed: gl.getUniformLocation(program, 'u_cloudSpeed'),
            cloudType: gl.getUniformLocation(program, 'u_cloudType'),
            lightPreset: gl.getUniformLocation(program, 'u_lightPreset')
        };
    }

    function updateCamera(azimuthDeg, elevationDeg, distance) {
        const target = [0.0, -0.5, 0.0];
        const az = azimuthDeg * Math.PI / 180.0;
        const el = elevationDeg * Math.PI / 180.0;
        const x = distance * Math.cos(el) * Math.sin(az);
        const y = distance * Math.sin(el);
        const z = distance * Math.cos(el) * Math.cos(az);
        const pos = [x, y, z];

        gl.uniform3fv(uniformLocations.cameraPos, pos);
        gl.uniform3fv(uniformLocations.cameraTarget, target);
    }

    function setupResizeListener(canvas) {
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function startRenderLoop() {
        let startTime = performance.now() / 1000;
        function render() {
            const time = (performance.now() / 1000) - startTime;
            gl.uniform1f(uniformLocations.time, time);
            gl.uniform3f(uniformLocations.resolution, canvas.width, canvas.height, 1.0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        }
        render();
    }

    (async function main() {
        gl = initWebGL();
        if (!gl) return;

        const canvas = document.getElementById('canvas');
        const noiseTexture = createNoiseTexture(gl);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, noiseTexture);

        try {
            const fragmentSource = await loadShader('shader.frag');
            const vertexSource = `#version 300 es
                in vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `;

            program = createProgram(gl, vertexSource, fragmentSource);
            if (!program) return;
            gl.useProgram(program);

            uniformLocations = initUniforms(gl, program);
            gl.uniform1i(uniformLocations.noise, 0);

            setupBuffers(gl, program);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.uniform1f(uniformLocations.noiseScale, 0.15);
            gl.uniform1f(uniformLocations.fov, 1.5);
            gl.uniform1f(uniformLocations.cloudSpeed, 1.0);
            gl.uniform1i(uniformLocations.cloudType, 0);
            gl.uniform1i(uniformLocations.lightPreset, 0);

            cameraState = { azimuth: 45, elevation: 20, distance: 6 };
            updateCamera(cameraState.azimuth, cameraState.elevation, cameraState.distance);

            setupResizeListener(canvas);
            startRenderLoop();

            window.livelyPropertyListener = function(name, value) {
                console.log('Property changed:', name, value);
                switch(name) {
                    case 'noiseScale':
                        gl.uniform1f(uniformLocations.noiseScale, value); break;
                    case 'fov':
                        gl.uniform1f(uniformLocations.fov, value); break;
                    case 'cloudSpeed':
                        gl.uniform1f(uniformLocations.cloudSpeed, value); break;
                    case 'cloudType':
                        gl.uniform1i(uniformLocations.cloudType, value); break;
                    case 'lightPreset':
                        gl.uniform1i(uniformLocations.lightPreset, value); break;
                    case 'cameraAzimuth':
                        cameraState.azimuth = value;
                        updateCamera(cameraState.azimuth, cameraState.elevation, cameraState.distance);
                        break;
                    case 'cameraElevation':
                        cameraState.elevation = value;
                        updateCamera(cameraState.azimuth, cameraState.elevation, cameraState.distance);
                        break;
                    case 'cameraDistance':
                        cameraState.distance = value;
                        updateCamera(cameraState.azimuth, cameraState.elevation, cameraState.distance);
                        break;
                }
            };

        } catch (err) {
            console.error('Initialization error:', err);
            alert('Failed to load or compile shader. Check console.');
        }
    })();
})();