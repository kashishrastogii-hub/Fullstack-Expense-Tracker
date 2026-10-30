import './dashboard-premium.css';
import { useState } from 'react';
import CategoryExpenseChart from '../../components/userDashboard/categoryExpenseChart';
import Budget from '../../components/userDashboard/budget';
import useDashboard from '../../hooks/useDashboard';
import Loading from '../../components/utils/loading';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, PlusCircle, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, BarChart3, Receipt, FileText, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import UserService from '../../services/userService';
import { useEffect } from 'react';

function Dashboard() {
    const navigate = useNavigate();
    const months = getMonths()
    const [currentMonth, setMonth] = useState(months[0])
    const [recentTransactions, setRecentTransactions] = useState([]);

    const [total_expense, total_income, cash_in_hand, no_of_transactions, categorySummary, budgetAmount,
        saveBudget, isLoading, isError] = useDashboard(currentMonth)

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
        setMonth(month)
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const greeting = getGreeting();
    const savings = total_income - total_expense;
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
                <>
                    <div className="dashboard-summary-grid">
                        <div className="dashboard-summary-card">
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--balance">
                                    <Wallet size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Total Balance</p>
                                <h2 className="dashboard-summary-card__value">₹{cash_in_hand?.toLocaleString() || 0}</h2>
                                <p className="dashboard-summary-card__trend">Net for {currentMonth.monthName}</p>
                            </div>
                        </div>
                        <div className="dashboard-summary-card">
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--income">
                                    <ArrowUpRight size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Total Income</p>
                                <h2 className="dashboard-summary-card__value">₹{total_income?.toLocaleString() || 0}</h2>
                                <p className="dashboard-summary-card__trend">{no_of_transactions} transactions</p>
                            </div>
                        </div>
                        <div className="dashboard-summary-card">
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--expense">
                                    <ArrowDownRight size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Total Expenses</p>
                                <h2 className="dashboard-summary-card__value">₹{total_expense?.toLocaleString() || 0}</h2>
                                <p className="dashboard-summary-card__trend">This month</p>
                            </div>
                        </div>
                        <div className="dashboard-summary-card">
                            <div className="dashboard-summary-card__header">
                                <div className="dashboard-summary-card__icon dashboard-summary-card__icon--savings">
                                    <PiggyBank size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="dashboard-summary-card__label">Savings</p>
                                <h2 className="dashboard-summary-card__value">₹{savings?.toLocaleString() || 0}</h2>
                                <p className="dashboard-summary-card__trend">{savingsPercent}% of income</p>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-main-grid">
                        <div className="dashboard-grid-left">
                            <div className="dashboard-card">
                                <div className="dashboard-card__header">
                                    <div className="dashboard-card__title-group">
                                        <h3>Income vs Expenses</h3>
                                        <p className="dashboard-card__description">Monthly comparison</p>
                                    </div>
                                </div>
                                <div className="dashboard-card__content">
                                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '8px' }}>Income</p>
                                            <h2 style={{ fontSize: '28px', color: 'var(--success)' }}>₹{total_income?.toLocaleString()}</h2>
                                        </div>
                                        <div style={{ width: '2px', height: '60px', background: 'var(--border)' }}></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ color: 'var(--warning)', fontWeight: 600, marginBottom: '8px' }}>Expenses</p>
                                            <h2 style={{ fontSize: '28px', color: 'var(--warning)' }}>₹{total_expense?.toLocaleString()}</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-charts-row">
                                <div className="dashboard-card">
                                    <div className="dashboard-card__header">
                                        <div className="dashboard-card__title-group">
                                            <h3>Spending by Category</h3>
                                            <p className="dashboard-card__description">Expense breakdown</p>
                                        </div>
                                    </div>
                                    <div className="dashboard-card__content">
                                        <CategoryExpenseChart categorySummary={categorySummary} />
                                    </div>
                                </div>
                                <div className="dashboard-card">
                                    <div className="dashboard-card__header">
                                        <div className="dashboard-card__title-group">
                                            <h3>Budget Overview</h3>
                                            <p className="dashboard-card__description">Track your spending</p>
                                        </div>
                                    </div>
                                    <div className="dashboard-card__content">
                                        <Budget totalExpense={total_expense} budgetAmount={budgetAmount} saveBudget={saveBudget} currentMonth={currentMonth} />
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card__header">
                                    <div className="dashboard-card__title-group">
                                        <h3>Recent Transactions</h3>
                                        <p className="dashboard-card__description">Latest activity</p>
                                    </div>
                                    <Button variant="ghost" onClick={() => navigate('/user/transactions')}>View all</Button>
                                </div>
                                <div className="dashboard-card__content">
                                {recentTransactions.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {recentTransactions.map((tx, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)', background: tx.transactionType === 'INCOME' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: tx.transactionType === 'INCOME' ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {tx.transactionType === 'INCOME' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '14px' }}>{tx.transactionName || tx.categoryName}</p>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{tx.transactionDate}</p>
                                                    </div>
                                                </div>
                                                <p style={{ fontWeight: 700, color: tx.transactionType === 'INCOME' ? 'var(--success)' : 'var(--warning)' }}>{tx.transactionType === 'INCOME' ? '+' : '-'}₹{tx.amount}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px' }}>No recent transactions</p>
                                )}
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-grid-right">
                            <div className="dashboard-card">
                                <div className="dashboard-card__header">
                                    <div className="dashboard-card__title-group">
                                        <h3>Quick Actions</h3>
                                        <p className="dashboard-card__description">Common tasks</p>
                                    </div>
                                </div>
                                <div className="dashboard-card__content">
                                    <div className="quick-actions">
                                        <button className="quick-action-btn" onClick={() => navigate('/user/newTransaction')}>
                                            <div className="quick-action-btn__icon"><PlusCircle size={18} /></div>
                                            <span>Add Transaction</span>
                                        </button>
                                        <button className="quick-action-btn" onClick={() => navigate('/user/transactions')}>
                                            <div className="quick-action-btn__icon"><Receipt size={18} /></div>
                                            <span>View All</span>
                                        </button>
                                        <button className="quick-action-btn" onClick={() => navigate('/user/statistics')}>
                                            <div className="quick-action-btn__icon"><BarChart3 size={18} /></div>
                                            <span>Statistics</span>
                                        </button>
                                        <button className="quick-action-btn" onClick={() => navigate('/user/savedTransactions')}>
                                            <div className="quick-action-btn__icon"><FileText size={18} /></div>
                                            <span>Templates</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card__header">
                                    <div className="dashboard-card__title-group">
                                        <h3>Insights</h3>
                                        <p className="dashboard-card__description">AI-powered tips</p>
                                    </div>
                                </div>
                                <div className="dashboard-card__content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ padding: '14px', background: 'var(--info-bg)', border: '1px solid var(--info)', borderRadius: 'var(--radius)', borderLeftWidth: '3px' }}>
                                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>You have {no_of_transactions} transactions this month</p>
                                    </div>
                                    {savings > 0 && (
                                        <div style={{ padding: '14px', background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 'var(--radius)', borderLeftWidth: '3px' }}>
                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Great! You saved {savingsPercent}% of your income</p>
                                        </div>
                                    )}
                                    {categorySummary.length > 0 && (
                                        <div style={{ padding: '14px', background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', borderLeftWidth: '3px' }}>
                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Top spending: {categorySummary[0]?.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
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

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default Dashboard;