import React from 'react';
import { Link } from 'react-router-dom';

const ActiveProjects: React.FC = () => {
    return (
        <div id="projects-content" className="projects-content">
            <section className="projects-header page-header">
                <h2>Active Projects</h2>
                <p style={{ color: '#8d6e63' }}>Enter a project, sign up to contribute!</p>
            </section>

            <section className="projects-grid">
                {/* Active Project */}
                <div className="project-card active medieval-theme">
                    <div className="project-image">
                        <div className="image-loading">
                            <div className="loading-spinner"></div>
                        </div>
                        <img
                            src=""
                            alt="Medieval Town"
                            data-preview="medieval_town"
                            style={{ display: 'none' }}
                        />
                        <div className="project-progress">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '0%' }}></div>
                            </div>
                            <div className="progress-text">0% Complete</div>
                        </div>
                    </div>
                    <div className="project-info">
                        <h3>Medieval Town</h3>
                        <div className="project-stats">
                            <div className="stat">
                                <span className="stat-value" data-stat="contributors">0</span>
                                <span className="stat-label">Contributors</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value" data-stat="pixels">0</span>
                                <span className="stat-label">Pixels Painted</span>
                            </div>
                        </div>
                        <Link to="/medieval-town" className="btn-contribute">
                            Enter Project
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ActiveProjects;
