import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';

function TransactionList({ list }) {

    if (!list || typeof list !== 'object' || Array.isArray(list)) {
        return null;
    }

    return (
        <>
            {
                Object.keys(list).map((date) => {
                    const transactions = Array.isArray(list[date]) ? list[date] : [];

                    if (transactions.length === 0) {
                        return null;
                    }

                    const dateInfo = formatDate(date);

                    return (
                        <section className='transaction-group' key={date}>
                            <header className='transaction-group__header'>
                                <div className='transaction-group__date'>
                                    <span
                                        className={date === 'Today' ? 'transaction-group__marker is-today' : 'transaction-group__marker'}
                                        aria-hidden='true'
                                    ></span>
                                    <div>
                                        <h2>{dateInfo.label}</h2>
                                        <p>{dateInfo.sublabel}</p>
                                    </div>
                                </div>
                                <span className='transaction-group__count'>
                                    {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
                                </span>
                            </header>

                            <div className='transaction-group__rows'>
                                {
                                    transactions.map((transaction) => {
                                        const isIncome = Number(transaction.transactionType) === 2;
                                        const category = transaction.categoryName || 'Transaction';
                                        const description = transaction.description && transaction.description.trim()
                                            ? transaction.description.trim()
                                            : 'No description added';
                                        const amount = formatAmount(transaction.amount);

                                        return (
                                            <Link
                                                to={`/user/editTransaction/${transaction.transactionId}`}
                                                className={isIncome ? 'transaction-row transaction-row--income' : 'transaction-row transaction-row--expense'}
                                                key={transaction.transactionId}
                                                title='Edit transaction'
                                            >
                                                <span className='transaction-row__icon' aria-hidden='true'>
                                                    {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                </span>

                                                <span className='transaction-row__details'>
                                                    <span className='transaction-row__category'>{category}</span>
                                                    <span className='transaction-row__description'>{description}</span>
                                                </span>

                                                <span className='transaction-row__type'>
                                                    <span className='transaction-row__badge'>
                                                        {isIncome ? 'Income' : 'Expense'}
                                                    </span>
                                                </span>

                                                <span className='transaction-row__amount'>
                                                    {isIncome ? '+' : '-'}&#8377;{amount}
                                                </span>

                                                <span className='transaction-row__chevron' aria-hidden='true'>
                                                    <ChevronRight size={17} />
                                                </span>
                                            </Link>
                                        );
                                    })
                                }
                            </div>
                        </section>
                    );
                })
            }
        </>
    );
}

function formatDate(dateString) {
    if (dateString === 'Today' || dateString === 'Yesterday') {
        const date = new Date();

        if (dateString === 'Yesterday') {
            date.setDate(date.getDate() - 1);
        }

        return {
            label: dateString,
            sublabel: formatFullDate(date)
        };
    }

    const parsedDate = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return {
            label: dateString,
            sublabel: ''
        };
    }

    return {
        label: formatFullDate(parsedDate),
        sublabel: parsedDate.toLocaleDateString('en-US', { weekday: 'long' })
    };
}

function formatFullDate(date) {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatAmount(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return '0';
    }

    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

export default TransactionList;
