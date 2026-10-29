import { ArrowDownRight, ArrowUpRight, Wallet, Receipt } from 'lucide-react';
import './dashboardDetailBox.css';

function DashboardDetailBox({ total_expense, total_income, cash_in_hand, no_of_transactions }) {
    return (
        <div className='stats-grid'>
            <div className='stat-card stat-card--income'>
                <div className='stat-card__header'>
                    <div className='stat-card__icon stat-card__icon--income'>
                        <ArrowUpRight size={22} />
                    </div>
                    <span className='stat-card__trend stat-card__trend--up'>+12.5%</span>
                </div>
                <div className='stat-card__body'>
                    <p className='stat-card__label'>Total Income</p>
                    <h2 className='stat-card__value'>₹{total_income?.toLocaleString() || 0}</h2>
                </div>
            </div>
            <div className='stat-card stat-card--expense'>
                <div className='stat-card__header'>
                    <div className='stat-card__icon stat-card__icon--expense'>
                        <ArrowDownRight size={22} />
                    </div>
                    <span className='stat-card__trend stat-card__trend--down'>+8.2%</span>
                </div>
                <div className='stat-card__body'>
                    <p className='stat-card__label'>Total Expenses</p>
                    <h2 className='stat-card__value'>₹{total_expense?.toLocaleString() || 0}</h2>
                </div>
            </div>
            <div className='stat-card stat-card--balance'>
                <div className='stat-card__header'>
                    <div className='stat-card__icon stat-card__icon--balance'>
                        <Wallet size={22} />
                    </div>
                    <span className='stat-card__trend'>This month</span>
                </div>
                <div className='stat-card__body'>
                    <p className='stat-card__label'>Net Balance</p>
                    <h2 className='stat-card__value'>₹{cash_in_hand?.toLocaleString() || 0}</h2>
                </div>
            </div>
            <div className='stat-card stat-card--transactions'>
                <div className='stat-card__header'>
                    <div className='stat-card__icon stat-card__icon--transactions'>
                        <Receipt size={22} />
                    </div>
                    <span className='stat-card__trend'>This month</span>
                </div>
                <div className='stat-card__body'>
                    <p className='stat-card__label'>Transactions</p>
                    <h2 className='stat-card__value'>{no_of_transactions || 0}</h2>
                </div>
            </div>
        </div>
    )
}

export default DashboardDetailBox;
