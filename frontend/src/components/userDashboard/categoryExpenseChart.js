import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';


function CategoryExpenseChart({ categorySummary }) {
    const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f43f5e", "#84cc16", "#64748b"];

    return (
        <div className='chart'>
            <h4>Expenses by category</h4>
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={categorySummary}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        fill="#6366f1"
                        paddingAngle={3}
                        cornerRadius={6}
                        dataKey="amount"
                    >
                        {categorySummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend dataKey='category' />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid var(--main)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            boxShadow: 'var(--shadow)'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

export default CategoryExpenseChart;