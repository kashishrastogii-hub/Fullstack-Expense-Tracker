import { Link } from 'react-router-dom';
import '../assets/styles/welcome.css';
import Logo from '../components/utils/Logo';

function Welcome() {
    return (
        <section className="hero-section">
            <div className="hero-glow hero-glow-1" />
            <div className="hero-glow hero-glow-2" />

            <div className="hero-nav">
                <Logo />
            </div>

            <div className="hero-body">
                <span className="hero-badge">✨ Smart money management</span>
                <h1 className="hero-title">
                    Take control of your <span>finances</span>
                </h1>
                <p className="hero-subtitle">
                    PocketWise helps you track expenses, plan budgets, and understand your spending
                    with clear, beautiful insights — all in one place.
                </p>

                <div className="hero-actions">
                    <Link to="/auth/register"><button className="hero-cta">Get started free</button></Link>
                    <Link to="/auth/login"><button className="hero-cta hero-cta-outline">Log in</button></Link>
                </div>

                <div className="hero-stats">
                    <div><h2>Track</h2><p>Every transaction</p></div>
                    <div><h2>Budget</h2><p>Stay on target</p></div>
                    <div><h2>Insight</h2><p>Know your habits</p></div>
                </div>
            </div>
        </section>
    );
}

export default Welcome;
