# Interactive 2D Neural Network Classifier

This project is an interactive web-based tool for visualizing and understanding how neural networks classify 2D data. You can draw regions, sample points, train a neural network, and visualize the decision boundary—all in your browser.

Check here https://itshrr17.github.io/2d_classifier_nn/

## Features

- **Draw**: Use the brush to draw colored regions on a 2D canvas.
- **Sample**: Populate the canvas with labeled sample points from your drawing.
- **Train**: Train a customizable neural network (number and size of hidden layers) on your sample data.
- **Visualize**: Overlay the decision boundary to see how the model classifies the space.
- **Predict**: Hover the mouse to see the predicted class and confidence at any point.
- **Flexible UI**: Add/remove hidden layers, adjust learning rate, and more.

## Usage
1. **Open `index.html` in your browser** (no build step required).

2. **Workflow:**
   - Draw regions with the brush (change color with mouse down).
   - Click **Populate** to sample labeled points from the canvas.
   - Click **Train** to train the neural network.
   - Click **Show Decision Boundary** to overlay the model's decision regions.
   - Toggle **Prediction Mode** and move your mouse over the canvas to see live predictions.
   - Use the UI to add/remove hidden layers, adjust learning rate, and more.
   - Click **Clear** to reset everything.

## Project Structure

- `index.html` — Main UI and canvas
- `style.css` — Styling for the app and floating prediction label
- `index.js` — Main logic, training, and UI wiring
- `draw.js` — Canvas drawing, sampling, and decision boundary rendering
- `db.js` — App state and color mapping
- `model/model.js` — Neural network implementation (ReLU, softmax, etc.)
- `utils.js` — Utility functions (e.g., label encoding)

## Customization

- **Hidden Layers**: Add/remove layers and set their sizes in the UI.
- **Learning Rate & Epochs**: Tune these for better training results.
- **Block Size**: (Advanced) Change the block size for faster/slower decision boundary rendering.

## Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)
- No server or build step required for basic use
- For development: Node.js (for npm install)

## License

MIT License

---

**Educational Purpose:**
This project is designed for learning and experimenting with neural networks in a visual, interactive way. Perfect for students, teachers, and anyone curious about machine learning boundaries!
