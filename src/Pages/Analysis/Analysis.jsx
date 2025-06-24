import React, { useEffect, useState, useMemo } from "react";
import { Card } from "react-bootstrap";
import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import Layout from "../../Layout/Layout";
import ProfileAvtar from "../../Components/ProfileAvtar";
import { getAllExpense } from "../../Api/functions/expencseFunctions";
import { getAllBudget, getBudgetDetails } from "../../Api/functions/budgetFunctions";
import { Link } from "react-router-dom";

import {
  PieChart,
  Pie as RePie,
  Cell,
  ResponsiveContainer,
  Label,
  Layer,
} from "recharts";

const PieChartWithNeedle = ({ percent = 0, label = "" }) => {
  const value = Math.min(Math.max(percent, 0), 1);
  const needleAngle = 180 * value;

  const needle = (cx, cy, radius, angle) => {
    const radian = Math.PI * (1 - value);
    const x = cx + radius * Math.cos(radian);
    const y = cy - radius * Math.sin(radian);
    return (
      <Layer>
        <circle cx={cx} cy={cy} r={5} fill="#000" />
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="#000" strokeWidth={2} />
      </Layer>
    );
  };

  const data = [
    { value: 33.3, color: "#FF5722" },
    { value: 33.3, color: "#FFEB3B" },
    { value: 33.3, color: "#00E676" },
  ];

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <RePie
            data={data}
            dataKey="value"
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <Label
              value={`${label}: ${Math.round(value * 100)}%`}
              position="centerBottom"
              offset={20}
              style={{ fill: "#000", fontWeight: "bold" }}
            />
          </RePie>
          {needle(200, 200, 80, needleAngle)}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const Analysis = () => {
  const [expensesData, setExpensesData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [totalExpense, setTotalExpense] = useState(null);
  const [totalBudget, setTotalBudget] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");
  const [budgetDetails, setBudgetDetails] = useState([]);

  useEffect(() => {
    getAllExpense(setExpensesData, setTotalExpense);
    getAllBudget(setTotalBudget, setBudgetData);
    getBudgetDetails(setBudgetDetails);
  }, []);

  const filteredBudgetDetails = useMemo(
    () => budgetDetails.filter((item) => item.frequency === selectedFrequency),
    [budgetDetails, selectedFrequency]
  );

  const dynamicLineLabels = filteredBudgetDetails.map((item) => item.categoryName);
  const budgetAmountData = filteredBudgetDetails.map((item) => item.amount);
  const totalSpentData = filteredBudgetDetails.map((item) => item.totalSpent);

  const dynamicBudgetLineData = {
    labels: dynamicLineLabels,
    datasets: [
      {
        label: "Budget",
        data: budgetAmountData,
        borderColor: "#00C8FF",
        backgroundColor: "#00C8FF",
      },
    ],
  };

  const dynamicExpenseLineData = {
    labels: dynamicLineLabels,
    datasets: [
      {
        label: "Total Spent",
        data: totalSpentData,
        borderColor: "#1E1E99",
        backgroundColor: "#1E1E99",
      },
    ],
  };

  const expenseByCategory = useMemo(() => {
    const totals = {};
    expensesData.forEach((exp) => {
      const categoryName = exp.categoryId?.name || "Uncategorized";
      totals[categoryName] = (totals[categoryName] || 0) + exp.amount;
    });
    return totals;
  }, [expensesData]);

  const budgetByCategory = useMemo(() => {
    const totals = {};
    budgetData.forEach((budget) => {
      const categoryName = budget.categoryId?.name || "Uncategorized";
      totals[categoryName] = (totals[categoryName] || 0) + budget.amount;
    });
    return totals;
  }, [budgetData]);

  const allCategories = useMemo(() => {
    const categories = new Set([
      ...Object.keys(budgetByCategory),
      ...Object.keys(expenseByCategory),
    ]);
    return Array.from(categories);
  }, [budgetByCategory, expenseByCategory]);

  const barData = {
    labels: allCategories,
    datasets: [
      {
        label: "Budget",
        data: allCategories.map((cat) => budgetByCategory[cat] || 0),
        backgroundColor: "#FFC107",
      },
      {
        label: "Expense",
        data: allCategories.map((cat) => expenseByCategory[cat] || 0),
        backgroundColor: "#E040FB",
      },
    ],
  };

  const pieData = useMemo(() => {
    const labels = Object.keys(expenseByCategory);
    const data = Object.values(expenseByCategory);
    const backgroundColors = [
      "#FF5722", "#FF9800", "#FFC107", "#FFCD88", "#FFB855", "#B37626",
      "#F4C78B", "#FFE492", "#8E44AD", "#3498DB", "#2ECC71", "#E74C3C",
      "#95A5A6", "#34495E", "#16A085",
    ];
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, index) => backgroundColors[index % backgroundColors.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [expenseByCategory]);

  const pieOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: $${ctx.parsed}`,
        },
      },
    },
    cutout: "0%",
    responsive: true,
    maintainAspectRatio: false,
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { title: { display: true, text: "Category" } },
      y: { beginAtZero: true, title: { display: true, text: "Amount" } },
    },
  };

  const ratio = totalBudget && totalExpense ? totalExpense / totalBudget : 0;
  const savings = totalBudget && totalExpense ? (totalBudget - totalExpense) / totalBudget : 0;

  return (
    <Layout>
      <section className="py-4 analysis-section">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h4>Analysis</h4>
            <ProfileAvtar />
          </div>

          <div className="row g-3">
            <div className="col-lg-2">
              <Card className="text-center p-3 mb-3 shadow-custom" style={{ height: "118px", backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                <small>Total Budget</small>
                <h5 className="fw-bold mt-2">${totalBudget}</h5>
              </Card>
              <Card className="text-center p-3 shadow-custom" style={{ height: "118px", backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                <small>Total Expense</small>
                <h5 className="fw-bold mt-2">${totalExpense}</h5>
              </Card>
            </div>

            <div className="col-lg-2 d-flex flex-column gap-3">
              <Card className="text-center p-2 shadow-custom" style={{ height: "118px", backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                <PieChartWithNeedle percent={ratio} label="Expense Ratio" />
              </Card>
              <Card className="text-center p-2 shadow-custom" style={{ height: "118px", backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                <PieChartWithNeedle percent={savings} label="Savings Rate" />
              </Card>
            </div>

            <div className="col-lg-8">
              <div className="row g-3">
                <div className="col-md-6">
                  <Card className="p-3 d-flex justify-content-center align-items-center shadow-custom" style={{ backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                    <h6 className="mb-3">Expense Breakdown by Category</h6>
                    <div style={{ height: "185px", width: "200px" }}>
                      <Pie data={pieData} options={pieOptions} />
                    </div>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="p-3 shadow-custom" style={{ height: "255px", backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                    <h6 className="mb-3">Budget Compliance</h6>
                    <Bar data={barData} options={{ indexAxis: "y" }} style={{ height: "200px" }} />
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-1 mt-5" style={{ maxWidth: "120px" }}>
            <select
              id="frequency-select"
              className="form-select"
              style={{ fontWeight: "bold" }}
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <Card className="p-3 shadow-custom" style={{ backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                <h6 className="mb-3">Budget LineData ({selectedFrequency})</h6>
                {filteredBudgetDetails.length > 0 ? (
                  <Line data={dynamicBudgetLineData} options={lineOptions} />
                ) : (
                  <p className="text-muted">No budget data available for this frequency.</p>
                )}
              </Card>
            </div>
            <div className="col-md-6">
              <Card className="p-3 shadow-custom" style={{ backgroundColor: "#F4F1F6", border: "none", borderRadius: "10px" }}>
                <h6 className="mb-3">Expense LineData ({selectedFrequency})</h6>
                {filteredBudgetDetails.length > 0 ? (
                  <Line data={dynamicExpenseLineData} options={lineOptions} />
                ) : (
                  <p className="text-muted">No expense data available for this frequency.</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer id="expensio-footer" className="bg-dark text-white pt-3">
        <div className="container text-center">
          <hr style={{ borderTop: "2px solid white" }} />
          <p>
            Use of this website constitutes acceptance of the site
            <Link to="/terms-conditions" className="text-primary text-decoration-underline fw-semibold">
              Terms of Service
            </Link>
          </p>
          <p className="mb-0">&#169; 2025 Expensio – All rights reserved</p>
        </div>
      </footer>
    </Layout>
  );
};

export default Analysis;
