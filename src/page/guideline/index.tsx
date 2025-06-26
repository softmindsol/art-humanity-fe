import React from 'react';
// import './GuidelinePage.css'; // Optional: import a CSS file for styles
import MexicoCity_2018 from '../../assets/images/Mexico+City_2018.jpg'; // Adjust the path as necessary
const GuidelinePage: React.FC = () => {
    return (
        <div className="container">
            <main>
                <section className="rules-header">
                    <h2>Project Guideline</h2>
                    <p>Guidelines applicable to all projects</p>
                </section>

                <section className="rules-content">
                    <div className="rule-card">
                        <h3>How It Works</h3>
                        <p>
                            Make a contribution in the contributions page and start painting. Each pixel you paint will become yours
                            and cannot be changed by other contributors. All painted pixels will be automatically saved to the
                            currently selected contribution. Each user is allowed 10 contributions per project and can be as big or as
                            small as you want. If you want to paint on a different section of the canvas, create a new contribution
                            and have it selected as you paint. All other contributors can upvote your contribution to permanently keep
                            it in the canvas or downvote it to be deleted from the canvas. If a contribution receives over 50%
                            downvotes from all project contributors it will be rejected and deleted from the canvas. The project is
                            only complete when almost all pixels are painted and not a single contribution receives over 50%
                            downvotes for 1 week. If a contribution is rejected, the week resets.
                        </p>
                    </div>

                    <div className="rule-card">
                        <h3>The Rules Are Simple</h3>
                        <p>
                            We have three fundamental rules that all contributions must follow and should be taken into account when
                            voting for other contributions:
                        </p>
                        <ul className="rule-list">
                            <li>Your contribution must follow the theme of the project.</li>
                            <li>Your contribution must be as detailed and as realistic as possible.</li>
                            <li>
                                Your contribution, its colors, and lighting must integrate and flow with other contributions.
                            </li>
                        </ul>
                        <p>Graphic content is allowed as long as it follows the other rules. Nudity is prohibited.</p>
                        <img
                            src={MexicoCity_2018}
                            alt="Detailed aerial drawing of Mexico City"
                            style={{
                                maxWidth: '60%',
                                height: 'auto',
                                marginTop: '15px',
                                borderRadius: '8px',
                                display: 'block',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                            }}
                        />
                        <p
                            style={{
                                fontStyle: 'italic',
                                fontSize: '0.9em',
                                textAlign: 'center',
                                marginTop: '5px',
                            }}
                        >
                            MEXICO CITY - Benjiman Sack
                        </p>
                        <p>
                            When zooming in to draw, your contribution should maintain an isometric-like perspective so the canvas is
                            consistent as seen when fully zoomed out. This approach ensures other contributions can integrate smoothly
                            with each other, resulting in a cohesive and consistent final piece.
                        </p>
                    </div>

                    <div className="rule-card">
                        <h3>Troll Prevention and Promoting Quality over Quantity</h3>
                        <p>
                            We only want painters who are passionate about the project, no matter how small your contribution is. You
                            will also only be able to paint a certain number of pixels per minute to prevent pixel hogging. You will
                            also be removed from the project if 3 of your contributions get rejected from the canvas. Also moderators
                            will be monitoring contributions live and at any point can immediately reject your contribution from the
                            canvas if your contribution clearly doesn't follow the rules. The painting system is designed to emphasize
                            a slow and steady process for your contribution. Take your time, even if it means painting one small
                            detail, and solidify your spot in the canvas.
                        </p>

                        <p>
                            With all of these systems in place, you still might encounter trolls interfering with your contribution.
                            And you still might have to wait until it gets rejected to continue your contribution. The process will be
                            long and vigorous but eventually, pixel by pixel, the canvas will become one breathtaking, cohesive, final
                            piece of art.
                        </p>

                        <blockquote className="guideline-quote">
                            "Success is the sum of small efforts, repeated day in and day out."
                            <cite>– Robert Collier</cite>
                        </blockquote>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default GuidelinePage;
