import { useState, useEffect } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import DashboardLayout from "layouts/DashboardLayout";
import MiniStatisticsCard from "views/dashboard/components/MiniStatisticsCard";
import Description from "views/dashboard/components/Description";
import DataTable from "views/dashboard/components/DataTable";
import VerticalBarChart from "views/dashboard/components/VerticalBarChart";
import ComplexStatisticsCard from "views/dashboard/components/ComplexStatisticsCard";
import EditBudget from "./components/EditBudget";
import data from "config.json";
import { DateTime } from "luxon";
import DashboardNavbar from "layouts/DashboardNavbar";

const Home = () => {
  const [refresh, setRefresh] = useState(0);
  const [isUpdate, setUpdate] = useState(true);
  const [openEditBudget, setOpenEditBudget] = useState(false);

  const [budget, setBudget] = useState(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [currentMonthAverage, setCurrentMonthAverage] = useState(0);

  const [timezone, setTimeZone] = useState("Asia/Singapore");
  const todayMonth = DateTime.now().setZone(timezone).toFormat("yyyy-MM");

  const [tableData, setTableData] = useState({
    columns: [
      { Header: "date", accessor: "date" },
      { Header: "description", accessor: "description", width: "30%" },
      { Header: "category", accessor: "category", width: "30%" },
      { Header: "amount (SGD)", accessor: "amount" },
      { Header: "action", accessor: "id" },
    ],
    rows: [],
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const getLastSixMonths = () => {
    const result = [];
    const date = new Date();

    for (let i = -1; i < 5; i++) {
      const month = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const formattedMonth = month.toISOString().substring(0, 7);
      result.unshift(formattedMonth);
    }

    return result;
  };

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const response = await axios({
          method: "get",
          url: data.apiRootUrl + "budget",
          withCredentials: true,
        });
        const budget = parseFloat(response.data.data).toFixed(2);
        setBudget(budget);
      } catch (err) {
        console.log(err);
        if (err.response.status === 401) {
          window.location.href = "/sign-in";
        }
      }
    };

    const fetchTransactions = async () => {
      try {
        setUpdate(true);
        const response = await axios({
          method: "get",
          url: data.apiRootUrl + "transactions",
          withCredentials: true,
        });

        const newTransactions = response.data.data.map((t) => ({
          description: t.simple_description,
          category: t.category,
          date: t.date.substring(0, 10),
          full_date: new Date(t.date),
          amount: `${parseFloat(t.sgd_amount).toFixed(2)} ${
            t.original_currency !== "SGD"
              ? `(${parseFloat(t.original_amount).toFixed(2)} ${t.original_currency})`
              : ""
          }`,
          id: t.SK,
        }));

        newTransactions.sort((a, b) => b.full_date - a.full_date);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tmpExpensesByMonth = newTransactions.reduce((expenses, t) => {
          const yearMonth = t.date.substring(0, 7);
          expenses[yearMonth] = (expenses[yearMonth] || 0) + parseFloat(t.amount);
          return expenses;
        }, {});

        // Calculate days passed in current month
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysPassed = Math.min(today.getDate(), daysInCurrentMonth);

        console.log(todayMonth);

        const monthlyExpense = tmpExpensesByMonth[todayMonth] || 0;
        const monthlyAverage = daysPassed > 0 ? monthlyExpense / daysPassed : 0;

        setCurrentMonthExpenses(monthlyExpense);
        setCurrentMonthAverage(monthlyAverage);
        setTableData({ columns: tableData.columns, rows: newTransactions });

        setChartData({
          labels: getLastSixMonths(),
          datasets: [
            {
              label: "Expenses by month (SGD)",
              color: "dark",
              data: getLastSixMonths().map((month) => tmpExpensesByMonth[month] || 0),
            },
          ],
        });
      } catch (err) {
        console.log(err);
        if (err.response.status === 401) {
          window.location.href = "/sign-in";
        }
      } finally {
        setUpdate(false);
      }
    };
    fetchBudget();
    fetchTransactions();
  }, [refresh]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Description refresh={refresh} setRefresh={setRefresh} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <VerticalBarChart title="Spending trend" chart={chartData} height="13rem" />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MiniStatisticsCard
              bgColor="primary"
              title={{ text: "Current Month Expenses ", fontWeight: "regular" }}
              count={currentMonthExpenses.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MiniStatisticsCard
              bgColor="info"
              title={{
                text: "Current Month Average",
                fontWeight: "regular",
              }}
              count={currentMonthAverage.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <ComplexStatisticsCard
              bgColor="dark"
              count={{
                number: `${((currentMonthExpenses / budget) * 100).toFixed(2)}%`,
                label: "Budget Utilisation",
              }}
              percentage={
                currentMonthExpenses > budget
                  ? "exceed " + (currentMonthExpenses - budget).toFixed(2) + " SGD"
                  : "available " + (budget - currentMonthExpenses).toFixed(2) + " SGD"
              }
              isUpdate={isUpdate}
              dropdown={{
                action: () => setOpenEditBudget(true),
              }}
            />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <DataTable
          table={tableData}
          isSorted={false}
          isUpdate={isUpdate}
          refresh={refresh}
          setRefresh={setRefresh}
        />
      </SoftBox>
      <EditBudget
        openEditBudget={openEditBudget}
        setOpenEditBudget={setOpenEditBudget}
        refresh={refresh}
        setRefresh={setRefresh}
      />
    </DashboardLayout>
  );
};

export default Home;
