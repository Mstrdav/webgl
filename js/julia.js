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
        uniform float r;
        uniform float g;
        uniform float b;
      
        vec3 palette(float t) {
            return vec3(sin(t*r), sin(t*g), sin(t*b));
        }
    
        void main() {
            vec2 uv = gl_FragCoord.xy / canvasSize * 2.0 - 1.0;
            uv.x *= canvasSize.x / canvasSize.y;
    
            vec2 c = mouse;
            c = c / canvasSize * 2.0 - 1.0;
            c *= 1.5;



            vec2 z = uv;

            float count = 0.0;
            float z_fin = 0.0;

            for (float i = 0.0; i < 100.0; i++) {
                z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
                z_fin = length(z);
                if (length(z) > 2.0) break;
                count++;
            }

            float t = count / 100.0;
            // simple smoothing
            if (z_fin > 2.0) {
                t -= (z_fin - 2.0) / 200.0;
            }

            vec3 color = palette(t*0.95);
    
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

        // r = r + 0.001;
        // g = g + 0.002;
        // b = b + 0.003;

        // set uniform rgb values
        const rUniform = gl.getUniformLocation(program, "r");
        gl.uniform1f(rUniform, (r/10)**2);

        const gUniform = gl.getUniformLocation(program, "g");
        gl.uniform1f(gUniform, (g/10)**2);

        const bUniform = gl.getUniformLocation(program, "b");
        gl.uniform1f(bUniform, (b/10)**2);

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

    // update mouse position on mouse move
    let mouse = { x: 0, y: 0 };
    isAnimating = false;
    let r = 20;
    let g = 3;
    let b = 10;

    // window.addEventListener("mousemove", (e) => {
    //     isAnimating = false;
    //     mouse.x = e.clientX;
    //     mouse.y = e.clientY;
    // });

    // // and on touch move
    // window.addEventListener("touchmove", (e) => {
    //     isAnimating = false;
    //     mouse.x = e.touches[0].clientX;
    //     mouse.y = e.touches[0].clientY;
    // });

    // create 3 sliders for rgb values
    const rSlider = document.createElement("input");
    rSlider.type = "range";
    rSlider.min = 0;
    rSlider.max = 100;
    rSlider.step = 0.001;
    rSlider.value = r;
    rSlider.addEventListener("input", (e) => {
        r = e.target.value;
    });

    const gSlider = document.createElement("input");
    gSlider.type = "range";
    gSlider.min = 0;
    gSlider.max = 100;
    gSlider.step = 0.001;
    gSlider.value = g;
    gSlider.addEventListener("input", (e) => {
        g = e.target.value;
    });

    const bSlider = document.createElement("input");
    bSlider.type = "range";
    bSlider.min = 0;
    bSlider.max = 100;
    bSlider.step = 0.001;
    bSlider.value = b;
    bSlider.addEventListener("input", (e) => {
        b = e.target.value;
    });

    // style the sliders
    // should be at the bottom of the page, fixed
    // should look nice
    const sliders = document.createElement("div");
    sliders.style.position = "fixed";
    sliders.style.bottom = "0";
    sliders.style.left = "0";
    sliders.style.width = "100%";
    sliders.style.display = "flex";
    sliders.style.justifyContent = "center";
    sliders.style.alignItems = "center";
    sliders.style.backgroundColor = "rgba(0,0,0,0.5)";
    sliders.style.padding = "10px";
    sliders.style.boxSizing = "border-box";
    sliders.style.zIndex = "1000";

    const rLabel = document.createElement("label");
    rLabel.innerText = "R";
    rLabel.style.color = "red";
    rLabel.style.marginRight = "10px";

    const gLabel = document.createElement("label");
    gLabel.innerText = "G";
    gLabel.style.color = "green";
    gLabel.style.marginRight = "10px";

    const bLabel = document.createElement("label");
    bLabel.innerText = "B";
    bLabel.style.color = "blue";
    bLabel.style.marginRight = "10px";

    sliders.appendChild(rLabel);
    sliders.appendChild(rSlider);
    sliders.appendChild(gLabel);
    sliders.appendChild(gSlider);
    sliders.appendChild(bLabel);
    sliders.appendChild(bSlider);

    // add a button to save rgb presets under a name in the local storage
    // add a button to load rgb presets from the local storage

    // save
    const saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.style.marginLeft = "10px";
    saveButton.addEventListener("click", (e) => {
        const name = prompt("Enter a name for this preset");
        localStorage.setItem(name, JSON.stringify({ r, g, b }));
    });

    sliders.appendChild(saveButton);

    // load
    let loadPopupOpen = false;
    let popup;
    const loadButton = document.createElement("button");
    loadButton.innerText = "Load";
    loadButton.style.marginLeft = "10px";
    loadButton.addEventListener("click", (e) => {
        if (loadPopupOpen) {
            // close popup
            loadPopupOpen = false;
            document.body.removeChild(popup);
        } else {
            // open popup
            loadPopupOpen = true;

            // show a list of saved presets
            // when clicked, load the preset
            const presets = Object.keys(localStorage);

            // build popup
            popup = document.createElement("div");
            // popup is fixed at the bottom of the page
            // in the middle of the x axis
            popup.style.position = "fixed";
            popup.style.bottom = "0";
            popup.style.left = "50%";
            popup.style.transform = "translateX(-50%)";
            popup.style.width = "80%";
            popup.style.maxWidth = "500px";
            popup.style.backgroundColor = "rgba(0,0,0,0.5)";
            popup.style.padding = "10px";
            popup.style.boxSizing = "border-box";
            popup.style.zIndex = "1000";
            popup.style.marginBottom = "30px";
            popup.style.borderRadius = "10px";

            // add a close button
            const closeButton = document.createElement("button");
            closeButton.innerText = "X";
            closeButton.style.position = "absolute";
            closeButton.style.top = "0";
            closeButton.style.right = "0";
            closeButton.style.transform = "translate(50%, -50%)";
            closeButton.style.borderRadius = "50%";
            closeButton.style.width = "30px";
            closeButton.style.height = "30px";
            closeButton.style.backgroundColor = "rgba(255,255,255,0.5)";
            closeButton.style.border = "none";
            closeButton.style.outline = "none";
            closeButton.style.cursor = "pointer";
            closeButton.addEventListener("click", (e) => {
                document.body.removeChild(popup);
                loadPopupOpen = false;
            });

            popup.appendChild(closeButton);

            // add a list of presets
            const list = document.createElement("ul");
            list.style.listStyle = "none";
            list.style.padding = "0";
            list.style.margin = "0";

            // if there are no presets, show a message
            if (presets.length === 0) {
                const message = document.createElement("p");
                message.innerText = "No presets saved";
                message.style.color = "white";
                message.style.textAlign = "center";
                message.style.margin = "0";
                list.appendChild(message);
            }

            presets.forEach((preset) => {
                const li = document.createElement("li");
                // each li contains the name of the preset (clickable), and a delete button

                const item = document.createElement("button");
                item.innerText = preset;
                item.style.padding = "10px";
                item.style.margin = "10px";
                item.style.backgroundColor = "rgba(255,255,255,0.5)";
                item.style.borderRadius = "10px";
                item.style.cursor = "pointer";
                item.addEventListener("click", (e) => {
                    ({ r, g, b } = JSON.parse(localStorage.getItem(preset)));
                    rSlider.value = r;
                    gSlider.value = g;
                    bSlider.value = b;
                });
                li.appendChild(item);

                const deleteButton = document.createElement("button");
                deleteButton.innerText = "X";
                deleteButton.style.padding = "10px";
                deleteButton.style.margin = "10px";
                deleteButton.style.backgroundColor = "rgba(255,255,255,0.5)";
                deleteButton.style.borderRadius = "10px";
                deleteButton.style.cursor = "pointer";
                deleteButton.addEventListener("click", (e) => {
                    localStorage.removeItem(preset);
                    list.removeChild(li);
                });
                li.appendChild(deleteButton);

                list.appendChild(li);
            });

            popup.appendChild(list);

            document.body.appendChild(popup);
        }
    });

    sliders.appendChild(loadButton);

    document.body.appendChild(sliders);

    // record a path to repeat when mouse is pressed
    let path = [];
    let isRecording = false;
    let isPlaying = false;

    target.addEventListener("mousedown", (e) => {
        path = [];
        isRecording = true;
    });

    target.addEventListener("mouseup", (e) => {
        // if the new path is too short, don't play it
        if (path.length < 2) {
            isRecording = false;
            return;
        }
        console.log(path);

        // fill the path with an interpolated path between the first and last point
        const firstPoint = path[0];
        const lastPoint = path[path.length - 1];
        const dx = lastPoint.x - firstPoint.x;
        const dy = lastPoint.y - firstPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const segments = distance / 3;
        console.log(segments);
        console.log(dx, dy);
        for (let i = 0; i < segments; i++) {
            let x = lastPoint.x - dx * (i / segments);
            let y = lastPoint.y - dy * (i / segments);
            path.push({ x: x, y: y });
        }
        console.log(path)

        isRecording = false;
        isPlaying = true;
        playPath();
    });

    target.addEventListener("touchstart", (e) => {
        path = [];
        isRecording = true;
    }
    );

    target.addEventListener("touchend", (e) => {
        isRecording = false;
        isPlaying = true;
        playPath();
    }
    );

    function playPath() {
        if (path.length < 5) {
            isPlaying = false;
            return;
        } else {
            // play the path, never stop
            // play a position, remove it from the path and append it to the end
            // repeat
            const point = path.shift();
            mouse.x = point.x;
            mouse.y = point.y;
            path.push(point);
            requestAnimationFrame(playPath);
        }
    }

    // record mouse position when recording
    target.addEventListener("mousemove", (e) => {
        if (isRecording) {
            path.push({ x: e.clientX, y: e.clientY });
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        } else if (isPlaying) {
            e.preventDefault();
        } else {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }
    });

    drawFrame();
}

