// Initialize an array to store expression logs
let expressionLogs = [];

// Function to reset global counts
function resetGlobalCounts() {
  globalExpressionsCount = {
    angry: 0,
    disgusted: 0,
    fearful: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    surprised: 0,
  };
  globalTotalExpressions = 0;
}

// Function to log expressions every second
function logExpressions() {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp };

  for (let expression in globalExpressionsCount) {
    const percentage =
      globalTotalExpressions > 0
        ? ((globalExpressionsCount[expression] / globalTotalExpressions) * 100).toFixed(2)
        : "0.00";
    logEntry[expression] = percentage;
  }

  expressionLogs.push(logEntry);
}


// Function to export logs as a CSV file
function exportToCSV() {
  const headers = ["Timestamp", "Angry", "Disgusted", "Fearful", "Happy", "Neutral", "Sad", "Surprised"];

  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  expressionLogs.forEach(log => {
    const row = headers.map(header => log[header.toLowerCase()] || log.timestamp).join(",");
    csvContent += row + "\n";
  });

  // Create a blob and download the CSV file
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "facial_expressions_log.csv";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
}


//Create a link element and appends it to the document head.
function createLinkElement(href, rel) {
  const link = document.createElement('link');
  link.href = href;
  link.rel = rel;
  document.head.appendChild(link);
}

//Create a style element and appends it to the document head.
function createStyleElement(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Load the Google Sans font by creating a link element.
function loadGoogleSansFont() {
  createLinkElement('https://fonts.googleapis.com/css?family=Google+Sans', 'stylesheet');
}

// Create the highlight style by creating a style element.
function createHighlightStyle() {
  const css = `
    .highlighted {
      background-color: rgba(255, 255, 255, 0.8);
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
    }
  `;
  createStyleElement(css);
}

// Initialize global styles by loading the font and creating the highlight style.
function initializeGlobalStyles() {
  loadGoogleSansFont();
  createHighlightStyle();
}

// Create and return the expressions table element, applying necessary styles.
function createExpressionsTable() {
  const table = document.createElement('table');
  table.id = 'expressionsTable';
  Object.assign(table.style, {
    position: 'fixed',
    left: '0',
    top: '20%',
    transform: 'translateY(-50%)',
    zIndex: '101',
    boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(236, 233, 24, 0.77)',
    padding: '10px',
    borderRadius: '5px',
    fontFamily: "'Google Sans', sans-serif",
  });
  document.body.appendChild(table);  // Add table to body of the document
  return table;
}

// Initialization logic for the face-api models.
async function initializeFaceApiModels() {
  const MODEL_URL = chrome.runtime.getURL('models/');
  await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
}

// Initialize an object to store the count of each expression globally
let globalExpressionsCount = {
  angry: 0,
  disgusted: 0,
  fearful: 0,
  happy: 0,
  neutral: 0,
  sad: 0,
  surprised: 0,
};
let globalTotalExpressions = 0;

let globalLastValidPercentages = {
  angry: '',
  disgusted: '',
  fearful: '',
  happy: '',
  neutral: '',
  sad: '',
  surprised: '',
};

function resetGlobalCounts() {
  globalExpressionsCount = {
    angry: 0,
    disgusted: 0,
    fearful: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    surprised: 0,
  };
  globalTotalExpressions = 0;
}


async function detectFaces(canvas, video) {
  lastDetectionTime = Date.now();
  // Perform detection regardless of visibility to ensure all participants are processed
  const detections = await faceapi.detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options()).withFaceExpressions();
  if (detections.length > 0) {
    detections.forEach(detection => {
      const { expressions } = detection;
      for (let expression in expressions) {
        if (expressions[expression] >= 0.5) {
          globalExpressionsCount[expression]++;
          globalTotalExpressions++;
        }
      }
    });
  }
}

// Throttle function to limit the rate of frame processing
let lastCall = 0;

function throttle(fn, limit) {
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

function updateUI(table) {
  while (table.firstChild) {
    table.removeChild(table.firstChild);
  }
  for (let expression in globalExpressionsCount) {
    let row = document.createElement('tr');
    let nameCell = document.createElement('td');
    let countCell = document.createElement('td');
    nameCell.textContent = expression;
    let percentage = globalTotalExpressions > 0 ? ((globalExpressionsCount[expression] / globalTotalExpressions) * 100).toFixed(2) : "0.00";
    globalLastValidPercentages[expression] = percentage + '%';
    countCell.textContent = globalLastValidPercentages[expression];
    row.appendChild(nameCell);
    row.appendChild(countCell);
    table.appendChild(row);
    highlightMaxRow(table);
  }
}

function highlightMaxRow(table) {
  const rows = table.getElementsByTagName('tr');
  let maxPercentage = 0;
  let maxRow = null;
  for (let row of rows) {
    const expression = row.getElementsByTagName('td')[0].textContent;
    const percentage = parseFloat(globalLastValidPercentages[expression]);
    row.classList.remove('highlighted');
    if (percentage > maxPercentage) {
      maxPercentage = percentage;
      maxRow = row;
    }
  }
  if (maxRow) {
    maxRow.classList.add('highlighted');
  }
}

async function position_canvas(video, canvas) {
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.position = "absolute";
  canvas.style.left = rect.left + "px";
  canvas.style.top = rect.top + "px";
  // canvas.getContext("2d", { willReadFrequently: true });
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0, rect.width, rect.height);
}

window.onload = async () => {
  initializeGlobalStyles();
  await initializeFaceApiModels();
  const videoMap = new Map();
  resetGlobalCounts();
  let lastDetectionTime = Date.now();
  const expressionsTable = createExpressionsTable();

  setInterval(() => {
    logExpressions();
    resetGlobalCounts();
  }, 1000);

  const exportButton = document.createElement("button");
  exportButton.textContent = "Export CSV";
  Object.assign(exportButton.style, {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    zIndex: '102',
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Google Sans', sans-serif",
  });
  exportButton.addEventListener("click", exportToCSV);
  document.body.appendChild(exportButton);

  const updateCanvas = async (canvas, video) => {
    // Process video regardless of visibility
    await position_canvas(video, canvas);

    const throttledDetect = throttle(async () => {
      if (Date.now() - lastDetectionTime > 500) {
        lastDetectionTime = Date.now();
        await detectFaces(canvas, video);
        updateUI(document.getElementById("expressionsTable"));
      }
    }, 500);
    throttledDetect();
    requestAnimationFrame(() => updateCanvas(canvas, video));
  };


  // Function to process all participant video elements
  const processAllVideos = () => {
    // Select all video elements in Google Meet
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (!videoMap.has(video)) {
        const canvas = document.createElement("canvas");
        const table = document.createElement("div");
        table.id = "table" + Math.random().toString(36).substring(2);
        document.body.appendChild(table);

        const resizeObserver = new ResizeObserver(() => {
          updateCanvas(canvas, video);
        });
        resizeObserver.observe(video);

        const mutationObserver = new MutationObserver(() => {
          updateCanvas(canvas, video);
        });
        mutationObserver.observe(video, { attributes: true });

        videoMap.set(video, {
          canvas: canvas,
          table: table,
          resizeObserver: resizeObserver,
          mutationObserver: mutationObserver,
        });

        // Start processing immediately
        updateCanvas(canvas, video);
      }
    });
  };

  // Periodically check for new video elements (in case DOM updates)
  setInterval(processAllVideos, 20000);

  const observeDocument = (document) => {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeName.toLowerCase() === "video") {
              processAllVideos();
            }
            if (node.nodeName.toLowerCase() === "iframe") {
              try {
                const iframeDoc = node.contentWindow.document;
                observeDocument(iframeDoc);
              } catch (error) {
                console.error("Unable to access iframe's document:", error);
              }
            }
          });
        }
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach(function (node) {
            if (node.nodeName.toLowerCase() === "video") {
              const data = videoMap.get(node);
              if (data) {
                if (data.canvas.parentNode) {
                  data.canvas.parentNode.removeChild(data.canvas);
                  const table = document.getElementById(data.table.id);
                  if (table) {
                    table.parentNode.removeChild(table);
                  }
                }
                data.resizeObserver.disconnect();
                data.mutationObserver.disconnect();
                videoMap.delete(node);
              }
            }
          });
        }
      });
    });
    observer.observe(document, { childList: true, subtree: true });
  };
  observeDocument(document);
};
