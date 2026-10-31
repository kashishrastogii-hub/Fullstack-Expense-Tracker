import { useEffect, useState } from 'react';
import UserService from '../../services/userService';
import AuthService from '../../services/auth.service';
import Loading from '../../components/utils/loading';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Search, Filter, ChevronLeft, ChevronRight, PlusCircle, Edit2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Button from '../../components/ui/Button';

function Transactions() {
    const [userTransactions, setUserTransactions] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [transactionType, setTransactionType] = useState('');
    const [searchKey, setSearchKey] = useState('');
    const [pageNumber, setPageNumber] = useState(0);
    const [pageSize] = useState(10);
    const [noOfPages, setNoOfPages] = useState(0);
    const [sortField, setSortField] = useState('transactionDate');
    const [sortDirec, setSortDirec] = useState('desc');
    const location = useLocation();
    const navigate = useNavigate();

    const getTransactions = async () => {
        setIsFetching(true);
        try {
            const response = await UserService.get_transactions(
                AuthService.getCurrentUser().email, 
                pageNumber, 
                pageSize, 
                searchKey, 
                sortField, 
                sortDirec, 
                transactionType === 'expense' ? 'EXPENSE' : transactionType === 'income' ? 'INCOME' : null
            );
            if (response.data.status === 'SUCCESS') {
                setUserTransactions(response.data.response.data || []);
                setNoOfPages(response.data.response.totalNoOfPages || 0);
            }
        } catch (error) {
            toast.error('Failed to fetch transactions');
        }
        setIsFetching(false);
    };

    useEffect(() => {
        getTransactions();
    }, [pageNumber, searchKey, transactionType, sortDirec, sortField]);

    useEffect(() => {
        location.state && toast.success(location.state.text);
        location.state = null;
    }, []);

    const deleteTransaction = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await UserService.delete_transaction(id);
                toast.success('Transaction deleted successfully');
                getTransactions();
            } catch (error) {
                toast.error('Failed to delete transaction');
            }
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Transactions</h1>
                    <p style={{ color: 'var(--text-tertiary)' }}>Manage all your income and expenses</p>
                </div>
                <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/user/newTransaction')}>
                    Add Transaction
                </Button>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchKey}
                        onChange={(e) => setSearchKey(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 40px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px' }}
                    />
                </div>
                <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    style={{ padding: '10px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px' }}
                >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    style={{ padding: '10px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px' }}
                >
                    <option value="transactionDate">Date</option>
                    <option value="amount">Amount</option>
                </select>
                <select
                    value={sortDirec}
                    onChange={(e) => setSortDirec(e.target.value)}
                    style={{ padding: '10px 16px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px' }}
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            {isFetching ? (
                <Loading />
            ) : userTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>No transactions found</p>
                    <Button variant="primary" icon={PlusCircle} onClick={() => navigate('/user/newTransaction')} style={{ marginTop: '16px' }}>
                        Add Your First Transaction
                    </Button>
                </div>
            ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Transaction</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Category</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userTransactions.map((tx) => (
                                    <tr key={tx.transactionId} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)', background: tx.transactionType?.transactionTypeId === 2 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: tx.transactionType?.transactionTypeId === 2 ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {tx.transactionType?.transactionTypeId === 2 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', fontSize: '14px' }}>{tx.description || 'Transaction'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{tx.categoryName || '-'}</td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{tx.date}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: tx.transactionType?.transactionTypeId === 2 ? 'var(--success)' : 'var(--warning)' }}>
                                            {tx.transactionType?.transactionTypeId === 2 ? '+' : '-'}₹{tx.amount}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => navigate(/user/editTransaction/)} style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteTransaction(tx.transactionId)} style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {noOfPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                            <Button variant="ghost" icon={ChevronLeft} onClick={() => setPageNumber(Math.max(0, pageNumber - 1))} disabled={pageNumber === 0}>Previous</Button>
                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Page {pageNumber + 1} of {noOfPages}</span>
                            <Button variant="ghost" icon={ChevronRight} onClick={() => setPageNumber(Math.min(noOfPages - 1, pageNumber + 1))} disabled={pageNumber >= noOfPages - 1}>Next</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Transactions;
