import '../../assets/styles/dashboard.css';
import './dashboard-new.css';
import { useState } from 'react';
import DashboardDetailBox from '../../components/userDashboard/dashboardDetailBox';
import CategoryExpenseChart from '../../components/userDashboard/categoryExpenseChart';
import Budget from '../../components/userDashboard/budget';
import useDashboard from '../../hooks/useDashboard';
import Loading from '../../components/utils/loading';
import Info from '../../components/utils/Info';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, TrendingUp, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function Dashboard() {
    const navigate = useNavigate();
    const months = getMonths()
    const [currentMonth, setMonth] = useState(months[0])

    const [total_expense, total_income, cash_in_hand, no_of_transactions, categorySummary, budgetAmount,
        saveBudget, isLoading, isError] = useDashboard(currentMonth)

    const onMonthChange = (id) => {
        const month = months.find(m => m.id == id)
        setMonth(month)
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const greeting = getGreeting();

    return (
        <div className="dashboard-page">
            <Toaster position="top-right" />
            <div className="dashboard-header">
                <div className="dashboard-header__content">
                    <div>
                        <h1 className="dashboard-header__title">{greeting}, {currentUser.username || 'User'}</h1>
                        <p className="dashboard-header__subtitle">Here's your financial overview</p>
                    </div>
                    <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/user/newTransaction')}>
                        Add Transaction
                    </Button>
                </div>
                <div className="dashboard-header__actions">
                    <div className="month-selector">
                        <Calendar size={18} />
                        <select value={currentMonth.id} onChange={(e) => onMonthChange(e.target.value)} className="month-selector__select">
                            {months.map((m) => (
                                <option value={m.id} key={m.id}>{m.monthName} {m.year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {(isLoading) && <Loading />}
            {(isError) && toast.error("Failed to fetch information. Try again later!")}
            {(!isLoading && total_expense === 0 && total_income === 0) && <Info text={"You have no transactions in this month!"} />}
            {(!isError && (total_expense > 0 || total_income > 0)) && <>
                <DashboardDetailBox total_expense={total_expense} total_income={total_income} cash_in_hand={cash_in_hand} no_of_transactions={no_of_transactions} />
                <div className='dashboard-charts'>
                    <Card className="dashboard-chart-card">
                        <Card.Header>
                            <Card.Title>Spending by Category</Card.Title>
                            <Card.Description>Breakdown of your expenses</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <CategoryExpenseChart categorySummary={categorySummary} />
                        </Card.Content>
                    </Card>
                    <Card className="dashboard-chart-card">
                        <Card.Header>
                            <Card.Title>Budget Overview</Card.Title>
                            <Card.Description>Track your spending against budget</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <Budget totalExpense={total_expense} budgetAmount={budgetAmount} saveBudget={saveBudget} currentMonth={currentMonth} />
                        </Card.Content>
                    </Card>
                </div>
            </>}
        </div>
    )
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default Dashboard;

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

function SelectMonth({ months, onMonthChange }) {
    return (
        <div>
            <select onChange={(e) => onMonthChange(e.target.value)}>
                {
                    months.map((m) => {
                        return (
                            <option value={m.id} key={m.id}>{m.monthName} {m.year}</option>
                        )
                    })
                }
            </select>
        </div>
    )
}