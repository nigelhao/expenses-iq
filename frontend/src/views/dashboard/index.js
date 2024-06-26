import { useState, useEffect } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import DashboardLayout from "layouts/DashboardLayout";
import MiniStatisticsCard from "views/dashboard/components/MiniStatisticsCard";
import Description from "views/dashboard/components/Description";
import DataTable from "views/dashboard/components/DataTable";
import VerticalBarChart from "views/dashboard/components/VerticalBarChart";
import data from "config.json";

const Home = () => {
  const [refresh, setRefresh] = useState(0);
  const [isUpdate, setUpdate] = useState(true);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [averageDaily, setAverageDaily] = useState(0);
  const [numOfDays, setNumOfDays] = useState(0);

  const todayMonth = new Date().toISOString().substring(0, 7);

  const [tableData, setTableData] = useState({
    columns: [
      { Header: "transaction date", accessor: "date" },
      { Header: "description", accessor: "description", width: "30%" },
      { Header: "category", accessor: "category", width: "30%" },
      { Header: "amount (SGD)", accessor: "amount" },
    ],
    rows: [],
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

  const [chartData, setChartData] = useState({
    labels: getLastSixMonths(),
    datasets: [],
  });

  useEffect(() => {
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
        }));

        newTransactions.sort((a, b) => b.full_date - a.full_date);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const givenDate = new Date(newTransactions[newTransactions.length - 1].full_date);
        const diffInMilliseconds = today - givenDate;
        const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24) + 1);

        const tmpTotalExpenses = newTransactions.reduce(
          (total, t) => total + parseFloat(t.amount),
          0
        );
        const tmpExpensesByMonth = newTransactions.reduce((expenses, t) => {
          const yearMonth = t.date.substring(0, 7);
          expenses[yearMonth] = (expenses[yearMonth] || 0) + parseFloat(t.amount);
          return expenses;
        }, {});

        setAverageDaily(tmpTotalExpenses / diffInDays);
        setNumOfDays(diffInDays);
        setTotalExpenses(tmpTotalExpenses);
        setMonthlyExpenses(tmpExpensesByMonth[todayMonth] || 0);
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

    fetchTransactions();
  }, [refresh]);

  return (
    <DashboardLayout>
      <SoftBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Description refresh={refresh} setRefresh={setRefresh} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <VerticalBarChart
                  title="6 months spending trend"
                  chart={chartData}
                  height="13rem"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <MiniStatisticsCard
              bgColor="primary"
              title={{ text: "Current Month Expenses ", fontWeight: "regular" }}
              count={monthlyExpenses.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MiniStatisticsCard
              bgColor="error"
              title={{ text: "Total Expenses (" + numOfDays + " days)", fontWeight: "regular" }}
              count={totalExpenses.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MiniStatisticsCard
              bgColor="warning"
              title={{ text: "Average Daily (" + numOfDays + " days)", fontWeight: "regular" }}
              count={averageDaily.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <DataTable table={tableData} isSorted={false} isUpdate={isUpdate} />
      </SoftBox>
    </DashboardLayout>
  );
};

export default Home;
