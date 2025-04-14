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
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideos);

function startVideos() {
  videoElements.forEach((video, index) => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
          if (index === 0) startRoundRobinProcessing(); // Start round-robin processing when the first video is ready
        });
      })
      .catch((err) => console.error(`Error accessing webcam for video ${index + 1}:`, err));
  });
}

function startRoundRobinProcessing() {
  let currentIndex = 0; // Start with the first video

  setInterval(async () => {
    const video = videoElements[currentIndex];
    if (video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA && !video.paused) {
      const canvas = getOrCreateCanvas(video, currentIndex);
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0) {
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
      }
    }

    // Move to the next video in a round-robin fashion
    currentIndex = (currentIndex + 1) % videoElements.length;
  }, 100); // Adjust interval as needed
}

function getOrCreateCanvas(video, index) {
  let canvas = document.getElementById(`canvas${index + 1}`);
  if (!canvas) {
    canvas = faceapi.createCanvasFromMedia(video);
    canvas.id = `canvas${index + 1}`;
    canvas.style.position = 'absolute';

    const videoRect = video.getBoundingClientRect();
    canvas.style.left = `${videoRect.left}px`;
    canvas.style.top = `${videoRect.top}px`;
    canvas.width = videoRect.width;
    canvas.height = videoRect.height;

    document.body.append(canvas);
  }
  return canvas;
}
