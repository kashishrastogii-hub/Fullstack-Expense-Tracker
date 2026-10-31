import { useEffect, useState } from 'react';
import useCategories from './useCategories';
import UserService from '../services/userService';
import AuthService from '../services/auth.service';

function useDashboard(currentMonth) {
    const [total_income, setIncome] = useState(0);
    const [total_expense, setExpense] = useState(0);
    const [no_of_transactions, setTransactions] = useState(0);
    const cash_in_hand = total_income > total_expense ? Number((total_income - total_expense).toFixed(2)) : 0;
    const [categories] = useCategories();
    const [categorySummary, setCategorySummary] = useState([]);
    const [budgetAmount, setBudgetAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const generateTransactionSummary = async () => {
        try {
            const user = AuthService.getCurrentUser();
            if (!user) return;
            const incomeRes = await UserService.getTotalIncomeOrExpense(user.id, 2, currentMonth.id, currentMonth.year).catch(() => null);
            if (incomeRes && incomeRes.data && incomeRes.data.status === 'SUCCESS') {
                setIncome(Number(incomeRes.data.response ? incomeRes.data.response.toFixed(2) : 0));
            }
            const expenseRes = await UserService.getTotalIncomeOrExpense(user.id, 1, currentMonth.id, currentMonth.year).catch(() => null);
            if (expenseRes && expenseRes.data && expenseRes.data.status === 'SUCCESS') {
                setExpense(Number(expenseRes.data.response ? expenseRes.data.response.toFixed(2) : 0));
            }
            const countRes = await UserService.getTotalNoOfTransactions(user.id, currentMonth.id, currentMonth.year).catch(() => null);
            if (countRes && countRes.data && countRes.data.status === 'SUCCESS') {
                setTransactions(countRes.data.response || 0);
            }
        } catch (e) {
            setIsError(true);
        }
    };

    const fetchBudget = async () => {
        try {
            const res = await UserService.getBudget(currentMonth.id, currentMonth.year).catch(() => null);
            if (res && res.data && res.data.response !== undefined) {
                setBudgetAmount(res.data.response || 0);
            }
        } catch (e) {
            setIsError(true);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        Promise.allSettled([
            generateTransactionSummary(),
            fetchBudget()
        ]).then(() => {
            setIsLoading(false);
        });
    }, [currentMonth]);

    return [total_expense, total_income, cash_in_hand, no_of_transactions, categorySummary, budgetAmount, null, isLoading, isError];
}

export default useDashboard;
