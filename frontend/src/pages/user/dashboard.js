import './dashboard-premium.css';
import { useState, useEffect } from 'react';
import useDashboard from '../../hooks/useDashboard';
import Loading from '../../components/utils/loading';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, PlusCircle, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import UserService from '../../services/userService';

function Dashboard() {
    const navigate = useNavigate();
    const months = getMonths()
    const [currentMonth, setMonth] = useState(months[0])
    const [recentTransactions, setRecentTransactions] = useState([]);

    const [total_expense, total_income, cash_in_hand, no_of_transactions, isLoading, isError] = useDashboard(currentMonth)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.email && UserService.get_transactions) {
            UserService.get_transactions(user.email, 0, 5, '', 'transactionDate', 'desc', null).then((response) => {
                const txns = response.data?.transactions || [];
                setRecentTransactions(Array.isArray(txns) ? txns.slice(0, 5) : []);
            }).catch(() => {});
        }
    }, []);

    const onMonthChange = (id) => {
        const month = months.find(m => m.id == id)
        if (month) setMonth(month)
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const greeting = getGreeting();
    const savings = (total_income || 0) - (total_expense || 0);
    const savingsPercent = total_income > 0 ? ((savings / total_income) * 100).toFixed(1) : 0;

    return (
        <div className="dashboard-premium">
            <Toaster position="top-right" />
            <div className="dashboard-premium__header">
                <div className="dashboard-premium__title-group">
                    <h1>{greeting}, {currentUser.username || 'User'}</h1>
                    <p className="dashboard-premium__subtitle">Your financial overview for {currentMonth.monthName} {currentMonth.year}</p>
                </div>
                <div className="dashboard-premium__actions">
                    <div className="dashboard-month-select">
                        <Calendar size={18} />
                        <select value={currentMonth.id} onChange={(e) => onMonthChange(e.target.value)} className="dashboard-month-select__select">
                            {months.map((m) => (
                                <option value={m.id} key={m.id}>{m.monthName} {m.year}</option>
                            ))}
                        </select>
                    </div>
                    <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/user/newTransaction')}>
                        Add Transaction
                    </Button>
                </div>
            </div>

            {isLoading && <Loading />}
            {isError && toast.error("Failed to fetch information. Try again later!")}

            {!isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="dashboard-summary-grid" style={{ gap: '12px' }}>
                        <div className="dashboard-summary-card" style={{ padding: '16px' }}>
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--balance">
                                    <Wallet size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Balance</p>
                                <h2 className="dashboard-summary-card__value" style={{ fontSize: '1.5rem' }}>₹{(cash_in_hand || 0).toLocaleString()}</h2>
                            </div>
                        </div>
                        <div className="dashboard-summary-card" style={{ padding: '16px' }}>
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--income">
                                    <ArrowUpRight size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Income</p>
                                <h2 className="dashboard-summary-card__value" style={{ fontSize: '1.5rem' }}>₹{(total_income || 0).toLocaleString()}</h2>
                            </div>
                        </div>
                        <div className="dashboard-summary-card" style={{ padding: '16px' }}>
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--expense">
                                    <ArrowDownRight size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Expenses</p>
                                <h2 className="dashboard-summary-card__value" style={{ fontSize: '1.5rem' }}>₹{(total_expense || 0).toLocaleString()}</h2>
                            </div>
                        </div>
                        <div className="dashboard-summary-card" style={{ padding: '16px' }}>
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--savings">
                                    <PiggyBank size={20} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Savings</p>
                                <h2 className="dashboard-summary-card__value" style={{ fontSize: '1.5rem' }}>₹{savings.toLocaleString()}</h2>
                                <p className="dashboard-summary-card__trend">{savingsPercent}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="dashboard-card__header" style={{ padding: '14px 18px 10px' }}>
                            <div className="dashboard-card__title-group">
                                <h3 style={{ fontSize: '15px' }}>Income vs Expenses</h3>
                            </div>
                        </div>
                        <div className="dashboard-card__content" style={{ padding: '0 18px 14px' }}>
                            <div style={{ display: 'flex', gap: '28px', alignItems: 'center', justifyContent: 'center', padding: '14px 10px', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'center', minWidth: '90px' }}>
                                    <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '4px', fontSize: '12px' }}>Income</p>
                                    <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--success)' }}>₹{(total_income || 0).toLocaleString()}</p>
                                </div>
                                <div style={{ width: '1px', height: '36px', background: 'var(--border)' }}></div>
                                <div style={{ textAlign: 'center', minWidth: '90px' }}>
                                    <p style={{ color: 'var(--warning)', fontWeight: 600, marginBottom: '4px', fontSize: '12px' }}>Expenses</p>
                                    <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--warning)' }}>₹{(total_expense || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="dashboard-card__header" style={{ padding: '14px 18px 10px' }}>
                            <div className="dashboard-card__title-group">
                                <h3 style={{ fontSize: '15px' }}>Recent Transactions</h3>
                                <p className="dashboard-card__description">Latest activity</p>
                            </div>
                            <Button variant="ghost" onClick={() => navigate('/user/transactions')}>View all</Button>
                        </div>
                        <div className="dashboard-card__content" style={{ padding: '0 18px 14px' }}>
                        {recentTransactions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {recentTransactions.map((tx, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', background: tx.transactionType === 'INCOME' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: tx.transactionType === 'INCOME' ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {tx.transactionType === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '13px' }}>{tx.transactionName || tx.categoryName || 'Transaction'}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{tx.transactionDate}</p>
                                            </div>
                                        </div>
                                        <p style={{ fontWeight: 700, fontSize: '13px', color: tx.transactionType === 'INCOME' ? 'var(--success)' : 'var(--warning)' }}>{tx.transactionType === 'INCOME' ? '+' : '-'}₹{tx.amount}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '14px', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '13px' }}>No recent transactions</p>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function getMonths() {
    const months = []
    const current_date = new Date()
    for (let i = 0; i <= 11; i++) {
        const date = new Date(current_date.getFullYear(), current_date.getMonth() - i, 1)
        months.push({
            id: date.getMonth() + 1,
            year: date.getFullYear(),
            monthName: date.toLocaleString('en-US', { month: 'long' })
        })
    }
    return months;
}

export default Dashboard;
