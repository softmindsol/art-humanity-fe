import React from 'react';
import '../../style/demo.css'; // Import the CSS for the demo canvas
const DemoCanvas: React.FC = () => {
    return (
        <div className="container">
            <main>
                <section className="contribute-header">
                    <h2>Demo Canvas</h2>
                    <p>This canvas is 10240px by 10240px, don't believe us? Load the reference images!</p>
                </section>

                {/* Reference Images Button */}
                <div className="reference-images-container">
                    <button id="load-reference-images" className="reference-btn">Load Reference Images</button>
                </div>

                <section className="contribute-instructions">
                    <p>
                        Use the mouse wheel to zoom, right-click to pan, and left click to draw when zoomed in to at least 100%.
                        Drag the drawings tools and canvas info boxes to wherever you like. Use the scale reference on the right
                        and bottom sides of the viewport to keep scale while drawing. The scale reference will accurately display
                        the sizes of the reference items.
                    </p>
                </section>

                {/* Drawing Toolbox */}
                <div className="drawing-toolbox" id="drawing-toolbox">
                    <div className="toolbox-header">
                        <h3>Drawing Tools</h3>
                        <div className="toolbox-controls">
                            <button className="color-picker-btn" id="color-picker-btn" title="Color Picker (Eyedropper)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#8d6e63" strokeWidth="2">
                                    <path d="M19 5a3.5 3.5 0 0 0-5 0L12.5 6.5l5 5L19 10a3.5 3.5 0 0 0 0-5z" />
                                    <path d="M12.5 6.5l-8.615 8.615a2 2 0 0 0-.578 1.238l-.29 2.901a1 1 0 0 0 1.088 1.088l2.901-.29a2 2 0 0 0 1.238-.578L17.5 11.5l-5-5z" />
                                </svg>
                            </button>
                            <button className="eraser-btn" id="eraser-btn" title="Eraser Tool">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#8d6e63" strokeWidth="2">
                                    <path d="M18 13L11 6L4 13L11 20L18 13Z" />
                                    <path d="M11 6L18 13L21 10L14 3L11 6Z" />
                                </svg>
                            </button>
                            <div className="toolbox-drag-handle" id="toolbox-drag-handle">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="4" cy="4" r="1.5" fill="#8d6e63" />
                                    <circle cx="12" cy="4" r="1.5" fill="#8d6e63" />
                                    <circle cx="4" cy="12" r="1.5" fill="#8d6e63" />
                                    <circle cx="12" cy="12" r="1.5" fill="#8d6e63" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Color</div>
                        <div className="color-disc-container">
                            <div className="color-disc" id="color-disc"></div>
                            <div className="color-disc-selector" id="color-selector"></div>
                            <div className="color-disc-brightness" id="color-brightness">
                                <div className="brightness-selector"></div>
                            </div>
                        </div>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Brush Size</div>
                        <div className="brush-controls">
                            <div className="brush-size-controls">
                                <div className="brush-size-slider-container">
                                    <input type="range" min="1" max="20" defaultValue="3" id="brush-size-slider" />
                                    <span id="brush-size-value" className="brush-size-value">3</span>
                                </div>
                            </div>
                            <div className="brush-preview">
                                <div className="brush-circle" id="brush-size-preview"></div>
                            </div>
                        </div>
                    </div>

                    <div className="toolbox-section">
                        <div className="toolbox-section-title">Recent Colors</div>
                        <div className="recent-colors">
                            {/* Dynamic recent colors will go here */}
                        </div>
                    </div>
                </div>

                <section className="canvas-container">
                    <div className="canvas-info-container">
                        <div className="canvas-info-header">
                            <h3>Canvas Info</h3>
                            <div className="canvas-info-drag-handle">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="4" cy="4" r="1.5" fill="#8d6e63" />
                                    <circle cx="12" cy="4" r="1.5" fill="#8d6e63" />
                                    <circle cx="4" cy="12" r="1.5" fill="#8d6e63" />
                                    <circle cx="12" cy="12" r="1.5" fill="#8d6e63" />
                                </svg>
                            </div>
                        </div>
                        <div className="canvas-info">
                            <span id="zoom-level">Zoom: 100%</span>
                            <span id="coordinates">Position: (0, 0)</span>
                        </div>
                    </div>

                    <div className="canvas-drawing-area">
                        <div id="canvas-viewport">
                            <div id="canvas-wrapper">
                                <div className="canvas-boundary"></div>
                                {/* Tiles rendered dynamically */}
                            </div>
                        </div>

                        <div className="scale-reference vertical-scale">
                            <div className="scale-line">
                                <div className="scale-arrow top"></div>
                                <div className="scale-arrow bottom"></div>
                            </div>
                            <div className="scale-text">
                                <span id="vertical-pixels">1024px</span>
                                <span id="vertical-meters">1.7m</span>
                            </div>
                        </div>

                        <div className="scale-reference horizontal-scale">
                            <div className="scale-line">
                                <div className="scale-arrow left"></div>
                                <div className="scale-arrow right"></div>
                            </div>
                            <div className="scale-text">
                                <span id="horizontal-pixels">1024px</span>
                                <span id="horizontal-meters">1.7m</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DemoCanvas;
