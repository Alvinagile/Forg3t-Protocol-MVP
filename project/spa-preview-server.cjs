const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4173;
const distPath = path.join(__dirname, 'dist');

// Serve static files
app.use(express.static(distPath));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  // Check if the file exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

app.listen(port, () => {
  console.log(`SPA Preview Server running at http://localhost:${port}`);
  console.log(`Serving files from: ${distPath}`);
});