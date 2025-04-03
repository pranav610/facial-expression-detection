const videoElements = [
  document.getElementById('video1'),
  document.getElementById('video2'),
  document.getElementById('video3'),
  document.getElementById('video4'),
  document.getElementById('video5'),
  document.getElementById('video6'),
  document.getElementById('video7'),
  document.getElementById('video8'),
  document.getElementById('video9'),
  document.getElementById('video10')
];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideos);

function startVideos() {
  videoElements.forEach((video, index) => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
          processVideo(video, index); // Start processing once metadata is loaded
        });
      })
      .catch((err) => console.error(`Error accessing webcam for video ${index + 1}:`, err));
  });
}

function processVideo(video, index) {
  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.id = `canvas${index + 1}`;
    canvas.style.position = 'absolute'; // Position canvas absolutely

    // Get the exact position and dimensions of the video element
    const videoRect = video.getBoundingClientRect();
    canvas.style.left = `${videoRect.left}px`;
    canvas.style.top = `${videoRect.top}px`;
    canvas.width = videoRect.width; // Match canvas width to video width
    canvas.height = videoRect.height; // Match canvas height to video height
    document.body.append(canvas);

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detections.length) return; // Skip if no detections

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw detections, landmarks, and expressions
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      // Display facial expression scores
      resizedDetections.forEach((detection) => {
        const { expressions } = detection;
        const maxExpression = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );

        const { x, y } = detection.detection.box;
        context.font = '16px Arial';
        context.fillStyle = 'red';
        context.fillText(
          `Expression: ${maxExpression} (${(expressions[maxExpression] * 100).toFixed(2)}%)`,
          x,
          y - 10
        );
      });
    }, 100);
  });
}
