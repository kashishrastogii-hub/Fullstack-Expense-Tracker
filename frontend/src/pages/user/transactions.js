import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowDown,
    ArrowDownRight,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    PlusCircle,
    Receipt,
    RefreshCw,
    Search,
    SlidersHorizontal,
    X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import UserService from '../../services/userService';
import AuthService from '../../services/auth.service';
import usePagination from '../../hooks/usePagination';
import Button from '../../components/ui/Button';
import TransactionList from '../../components/userTransactions/transactionList.js';
import './transactions-new.css';

const FILTERS = [
    { value: '', label: 'All', icon: SlidersHorizontal },
    { value: 'expense', label: 'Expense', icon: ArrowDownRight },
    { value: 'income', label: 'Income', icon: ArrowUpRight }
];

function Transactions() {

    const [userTransactions, setUserTransactions] = useState({});
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [transactionType, setTransactionType] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const latestRequest = useRef(0);

    const {
        pageSize, pageNumber, noOfPages, noOfRecords, sortField, sortDirec, searchKey,
        onNextClick, onPrevClick, setPageNumber, setNoOfPages, setNoOfRecords, setSearchKey
    } = usePagination('date');

    const hasTransactions = Object.keys(userTransactions || {}).length > 0;
    const hasActiveFilters = searchKey.trim() !== '' || transactionType !== '';
    const isInitialLoading = isFetching && !hasTransactions && !fetchError;
    const rangeStart = noOfRecords === 0 ? 0 : (pageNumber * pageSize) + 1;
    const rangeEnd = noOfRecords === 0 ? 0 : Math.min((pageNumber + 1) * pageSize, noOfRecords);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput !== searchKey) {
                setSearchKey(searchInput);
                setPageNumber(0);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchInput, searchKey, setPageNumber, setSearchKey]);

    useEffect(() => {
        const requestId = ++latestRequest.current;
        let isCancelled = false;

        const getTransactions = async () => {
            setIsFetching(true);
            setFetchError('');

            try {
                const response = await UserService.get_transactions(
                    AuthService.getCurrentUser().email,
                    pageNumber,
                    pageSize,
                    searchKey,
                    sortField,
                    sortDirec,
                    transactionType
                );

                if (isCancelled || requestId !== latestRequest.current) {
                    return;
                }

                if (response.data.status === 'SUCCESS') {
                    const page = response.data.response || {};
                    const data = page.data;

                    setUserTransactions(data && !Array.isArray(data) ? data : {});
                    setNoOfPages(page.totalNoOfPages || 0);
                    setNoOfRecords(page.totalNoOfRecords || 0);
                    return;
                }

                setFetchError('We could not load your transactions.');
            } catch (error) {
                if (isCancelled || requestId !== latestRequest.current) {
                    return;
                }

                setFetchError('We could not load your transactions.');
                toast.error('Failed to fetch transactions: Try again later!');
            } finally {
                if (!isCancelled && requestId === latestRequest.current) {
                    setIsFetching(false);
                }
            }
        };

        getTransactions();

        return () => {
            isCancelled = true;
        };
    }, [
        pageNumber, pageSize, searchKey, sortField, sortDirec, transactionType,
        reloadKey, setNoOfPages, setNoOfRecords
    ]);

    useEffect(() => {
        if (location.state && location.state.text) {
            toast.success(location.state.text);
            location.state = null;
        }
    }, [location]);

    const handleSearchChange = (value) => {
        setSearchInput(value);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        if (searchKey) {
            setSearchKey('');
            setPageNumber(0);
        }
    };

    const handleTypeChange = (value) => {
        if (value === transactionType) {
            return;
        }

        setTransactionType(value);
        setPageNumber(0);
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearchKey('');
        setTransactionType('');
        setPageNumber(0);
    };

    const retryFetch = () => {
        setFetchError('');
        setReloadKey((key) => key + 1);
    };

    return (
        <div className='transactions-page'>
            <Toaster position='top-right' />

            <header className='transactions-header'>
                <div className='transactions-header__title-group'>
                    <p className='transactions-eyebrow'>
                        <span className='transactions-eyebrow__dot' aria-hidden='true'></span>
                        Money activity
                    </p>
                    <h1 className='transactions-header__title'>Transactions</h1>
                    <p className='transactions-header__subtitle'>
                        Search, review, and manage every income and expense in one clear ledger.
                    </p>
                </div>

                <div className='transactions-header__actions'>
                    <div className='transactions-count' aria-live='polite'>
                        <Receipt size={16} aria-hidden='true' />
                        <strong>{noOfRecords.toLocaleString('en-IN')}</strong>
                        <span>{noOfRecords === 1 ? 'entry' : 'entries'}</span>
                    </div>
                    <Button
                        variant='primary'
                        icon={PlusCircle}
                        onClick={() => navigate('/user/newTransaction')}
                    >
                        Add Transaction
                    </Button>
                </div>
            </header>

            <section className='transactions-toolbar' aria-label='Transaction controls'>
                <div className='transactions-search' role='search'>
                    <Search className='transactions-search__icon' size={18} aria-hidden='true' />
                    <input
                        type='text'
                        value={searchInput}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        placeholder='Search by description or category'
                        aria-label='Search transactions'
                    />
                    {searchInput && (
                        <button
                            type='button'
                            className='transactions-search__clear'
                            onClick={handleClearSearch}
                            aria-label='Clear search'
                        >
                            <X size={15} aria-hidden='true' />
                        </button>
                    )}
                </div>

                <div className='transactions-filter' role='group' aria-label='Filter by transaction type'>
                    {FILTERS.map((filter) => {
                        const FilterIcon = filter.icon;

                        return (
                            <button
                                key={filter.value || 'all'}
                                type='button'
                                className={transactionType === filter.value ? 'transactions-filter__btn is-active' : 'transactions-filter__btn'}
                                onClick={() => handleTypeChange(filter.value)}
                                aria-pressed={transactionType === filter.value}
                            >
                                <FilterIcon size={15} aria-hidden='true' />
                                <span>{filter.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className='transactions-toolbar__meta'>
                    <span className='transactions-sort'>
                        <ArrowDown size={14} aria-hidden='true' />
                        Newest first
                    </span>
                    {hasActiveFilters && (
                        <button type='button' className='transactions-clear' onClick={clearFilters}>
                            <X size={13} aria-hidden='true' />
                            Clear filters
                        </button>
                    )}
                </div>
            </section>

            {isInitialLoading && <TransactionsSkeleton />}

            {!isInitialLoading && fetchError && !hasTransactions && (
                <TransactionsError onRetry={retryFetch} />
            )}

            {!isInitialLoading && !fetchError && !hasTransactions && (
                <TransactionsEmpty
                    hasFilters={hasActiveFilters}
                    searchKey={searchKey}
                    transactionType={transactionType}
                    onClear={clearFilters}
                    onAdd={() => navigate('/user/newTransaction')}
                />
            )}

            {hasTransactions && (
                <>
                    {fetchError && (
                        <div className='transactions-inline-error' role='alert'>
                            <span>
                                <AlertCircle size={16} aria-hidden='true' />
                                {fetchError} Showing the last loaded results.
                            </span>
                            <button type='button' onClick={retryFetch}>Try again</button>
                        </div>
                    )}

                    <section
                        className={isFetching ? 'transactions-ledger transactions-ledger--refreshing' : 'transactions-ledger'}
                        aria-busy={isFetching}
                        aria-label='Transaction ledger'
                    >
                        <div className='transactions-ledger__head' aria-hidden='true'>
                            <span>Transaction</span>
                            <span>Type</span>
                            <span>Amount</span>
                            <span></span>
                        </div>

                        <TransactionList list={userTransactions} />

                        {noOfRecords > 0 && (
                            <div className='transactions-pagination'>
                                <p className='transactions-pagination__range'>
                                    Showing <strong>{rangeStart}&ndash;{rangeEnd}</strong> of <strong>{noOfRecords.toLocaleString('en-IN')}</strong>
                                </p>

                                <div className='transactions-pagination__controls'>
                                    <Button
                                        variant='secondary'
                                        size='sm'
                                        icon={ChevronLeft}
                                        onClick={onPrevClick}
                                        disabled={pageNumber === 0 || isFetching}
                                    >
                                        Previous
                                    </Button>
                                    <span className='transactions-pagination__page'>
                                        Page {pageNumber + 1} of {Math.max(noOfPages, 1)}
                                    </span>
                                    <Button
                                        variant='secondary'
                                        size='sm'
                                        icon={ChevronRight}
                                        iconPosition='right'
                                        onClick={onNextClick}
                                        disabled={pageNumber + 1 >= noOfPages || isFetching}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

function TransactionsEmpty({ hasFilters, searchKey, transactionType, onClear, onAdd }) {
    const filterLabel = transactionType === 'income'
        ? 'income'
        : transactionType === 'expense'
            ? 'expense'
            : '';

    let description = 'Your ledger is ready for its first entry. Add an income or expense to start tracking your money.';

    if (hasFilters) {
        if (searchKey.trim()) {
            description = `Nothing matches "${searchKey.trim()}"${filterLabel ? ` in ${filterLabel} transactions` : ''}. Try a different search or clear the filters.`;
        } else {
            description = `You do not have any ${filterLabel} transactions yet. Try another filter or add a new transaction.`;
        }
    }

    return (
        <section className='transactions-empty' aria-live='polite'>
            <div className='transactions-empty__art' aria-hidden='true'>
                <div className='transactions-empty__art-ring'>
                    <Receipt size={38} />
                </div>
                <span className='transactions-empty__spark'></span>
            </div>

            <p className='transactions-empty__eyebrow'>{hasFilters ? 'No matches' : 'Fresh start'}</p>
            <h2>No transactions found</h2>
            <p className='transactions-empty__text'>{description}</p>

            <div className='transactions-empty__actions'>
                {hasFilters && (
                    <Button variant='secondary' icon={X} onClick={onClear}>
                        Clear filters
                    </Button>
                )}
                <Button variant='primary' icon={PlusCircle} onClick={onAdd}>
                    {hasFilters ? 'Add Transaction' : 'Add your first transaction'}
                </Button>
            </div>
        </section>
    );
}

function TransactionsError({ onRetry }) {
    return (
        <section className='transactions-state transactions-state--error' role='alert'>
            <div className='transactions-state__icon' aria-hidden='true'>
                <AlertCircle size={30} />
            </div>
            <p className='transactions-state__eyebrow'>Something went wrong</p>
            <h2>We could not load your transactions</h2>
            <p className='transactions-state__text'>
                The ledger could not be fetched right now. Your data is safe, so try loading it again.
            </p>
            <Button variant='primary' icon={RefreshCw} onClick={onRetry}>
                Try again
            </Button>
        </section>
    );
}

function TransactionsSkeleton() {
    return (
        <div className='transactions-skeleton' aria-busy='true' aria-label='Loading transactions'>
            <div className='transactions-skeleton__head'></div>
            {[0, 1, 2].map((group) => (
                <div className='transactions-skeleton__group' key={group}>
                    <div className='transactions-skeleton__date'></div>
                    {[0, 1].map((row) => (
                        <div className='transactions-skeleton__row' key={row}>
                            <span className='transactions-skeleton__icon'></span>
                            <span className='transactions-skeleton__lines'>
                                <span></span>
                                <span></span>
                            </span>
                            <span className='transactions-skeleton__amount'></span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Transactions;
