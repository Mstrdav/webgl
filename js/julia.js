/*

Shader Art exploration, using webGL
compute julia set from mouse position

applyShader(target : HTMLCanvasElement) : void

*/

function applyShader(target) {
    let gl = target.getContext("webgl");
    if (!gl) {
        console.log("WebGL not supported, falling back on experimental-webgl");
        gl = target.getContext("experimental-webgl");
    }
    if (!gl) {
        alert("Your browser does not support WebGL");
        return;
    }

    // Set the viewport to the canvas size
    gl.viewport(0, 0, target.width, target.height);

    // on resize, update this
    window.addEventListener("resize", () => {
        gl.viewport(0, 0, target.width, target.height);
    });

    // simple vertex shader
    const vertexShader = `
          attribute vec4 position;
  
          void main() {
              gl_Position = position;
          }
      `;

    // simple fragment shader
    const fragmentShader = `
        precision mediump float;
        uniform vec2 canvasSize;
        uniform float time;
        uniform vec2 mouse;
      
        vec3 palette(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.263, 0.416, 0.557);
    
            return a + b*cos( 6.28318*(c*t+d) );
        }
    
        void main() {
            vec2 uv = gl_FragCoord.xy / canvasSize * 2.0 - 1.0;
            uv.x *= canvasSize.x / canvasSize.y;
    
            vec2 c = mouse;
            c = c / canvasSize * 2.0 - 1.0;
            c *= 1.5;



            vec2 z = uv;

            float count = 0.0;
            for (float i = 0.0; i < 100.0; i++) {
                z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
                if (length(z) > 2.0) break;
                count++;
            }

            float t = count / 100.0;
            vec3 color = palette(t*1.1);
    
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // apply the shader
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);

    // Compile fragment shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);

    // Create and launch the WebGL program
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Activate grid shaders
    gl.useProgram(program);

    drawFrame();

    function drawFrame() {
        // Set canvas size value
        const canvasSizeUniform = gl.getUniformLocation(program, "canvasSize");
        gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

        // Set uniform time value
        const timeUniform = gl.getUniformLocation(program, "time");
        gl.uniform1f(timeUniform, performance.now() / 1000);

        if (isAnimating) {
            mouse.x = Math.sin(performance.now() / 8000) * 450;
            mouse.y = Math.cos(performance.now() / 5000) * 300;

            // shift mouse position to center
            mouse.x += canvas.width / 2;
            mouse.y += canvas.height / 2;
        }

        // Set uniform mouse value
        const mouseUniform = gl.getUniformLocation(program, "mouse");
        gl.uniform2f(mouseUniform, mouse.x, mouse.y);


        // Four vertices represent corners of the canvas
        // Each row is x,y,z coordinate
        // -1,-1 is left bottom, z is always zero, since we draw in 2d
        const vertices = new Float32Array([
            1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0,
        ]);

        // Attach vertices to a buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set position to point to buffer
        const position = gl.getAttribLocation(program, "position");

        gl.vertexAttribPointer(
            position, // target
            3, // x,y,z
            gl.FLOAT, // type
            false, // normalize
            0, // buffer offset
            0 // buffer offset
        );

        gl.enableVertexAttribArray(position);

        // Finally draw our 4 vertices
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(drawFrame);
    }
}

// update mouse position on mouse move
let mouse = { x: 0, y: 0 };
isAnimating = true;

window.addEventListener("mousemove", (e) => {
    isAnimating = false;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// and on touch move
window.addEventListener("touchmove", (e) => {
    isAnimating = false;
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});
