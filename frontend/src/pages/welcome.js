import { Link } from 'react-router-dom';
import './welcome.css';
import { Wallet, ArrowRight } from 'lucide-react';

function Welcome() {
    return (
        <section className='hero-section'>
            <div className='hero-glow hero-glow-1' />
            <div className='hero-glow hero-glow-2' />

            <div className='hero-nav'>
                <div className='auth-page__logo' style={{ marginBottom: 0 }}>
                    <div className='auth-page__logo-icon'>
                        <Wallet size={28} />
                    </div>
                    <div className='auth-page__logo-text'>
                        <span className='auth-page__logo-title'>PocketWise</span>
                        <span className='auth-page__logo-subtitle'>Finance</span>
                    </div>
                </div>
            </div>

            <div className='hero-body'>
                <span className='hero-badge'>Smart money management</span>
                <h1 className='hero-title'>
                    Take control of your <span>finances</span>
                </h1>
                <p className='hero-subtitle'>
                    PocketWise helps you track expenses, manage budgets, and gain powerful insights
                    into your spending habits with a beautiful, intuitive dashboard.
                </p>

                <div className='hero-actions'>
                    <Link to='/auth/register'><button className='hero-cta'>Get started free <ArrowRight size={18} /></button></Link>
                    <Link to='/auth/login'><button className='hero-cta hero-cta-outline'>Sign in</button></Link>
                </div>

                <div className='hero-stats'>
                    <div><h2>100%</h2><p>Secure</p></div>
                    <div><h2>Smart</h2><p>Insights</p></div>
                    <div><h2>Simple</h2><p>To use</p></div>
                </div>
            </div>
        </section>
    );
}

export default Welcome;
