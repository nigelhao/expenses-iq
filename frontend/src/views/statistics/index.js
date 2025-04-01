import { useState, useEffect } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import DashboardLayout from "layouts/DashboardLayout";
import MiniStatisticsCard from "views/statistics/components/MiniStatisticsCard";
import DataTable from "views/statistics/components/DataTable";
import VerticalBarChart from "views/statistics/components/VerticalBarChart";
import ReportsDoughnutChart from "views/statistics/components/ReportsDoughnutChart";
import EditBudget from "./components/EditBudget";
import data from "config.json";
import SoftSelect from "components/SoftSelect";
import DashboardNavbar from "layouts/DashboardNavbar";

const Statistics = () => {
  const [refresh, setRefresh] = useState(0);
  const [isUpdate, setUpdate] = useState(true);
  const [openEditBudget, setOpenEditBudget] = useState(false);

  const [selectMonth, setSelectMonth] = useState("");
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [numOfDays, setNumOfDays] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState({
    columns: [
      { Header: "date", accessor: "date" },
      { Header: "description", accessor: "description", width: "30%" },
      { Header: "category", accessor: "category", width: "30%" },
      { Header: "amount (SGD)", accessor: "amount" },
      { Header: "action", accessor: "id" },
    ],
    rows: [],
  });

  const [lifetimeExpenses, setLifetimeExpenses] = useState(0);
  const [lifetimeAverage, setLifetimeAverage] = useState(0);
  const [lifetimeDays, setLifetimeDays] = useState(0);

  const [monthExpenses, setMonthExpenses] = useState(0);
  const [monthAverage, setMonthAverage] = useState(0);

  const [categorySummary, setCategorySummary] = useState([]);
  const [chartData, setChartData] = useState({});

  const handleLifetimeStatistics = (transactions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const givenDate = new Date(transactions[transactions.length - 1].full_date);
    const diffInMilliseconds = today - givenDate;
    const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24) + 1);

    const tmpTotalExpenses = transactions.reduce((total, t) => total + parseFloat(t.amount), 0);

    setLifetimeExpenses(tmpTotalExpenses);
    setLifetimeAverage(tmpTotalExpenses / diffInDays);
    setLifetimeDays(diffInDays);
  };

  const getNumberOfDays = (yearMonth) => {
    if (!yearMonth || yearMonth.length !== 7) return 0;

    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(5, 7)) - 1;

    // Get current date
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Create a date for the first day of the next month
    const nextMonth = new Date(year, month + 1, 1);
    const lastDay = new Date(nextMonth - 1);

    // If the selected month is the current month, return days elapsed so far
    if (year === currentYear && month === currentMonth) {
      return today.getDate();
    }

    // Otherwise return the total days in month
    return lastDay.getDate();
  };

  const getUniqueMonths = (transactions) => {
    if (!transactions.length) return [];

    const uniqueMonths = new Set();

    transactions.forEach((row) => {
      const dateStr = row.date.substring(0, 7); // Format: YYYY-MM
      uniqueMonths.add(dateStr);
    });

    return Array.from(uniqueMonths).sort().reverse();
  };

  const getCategorySummary = (transactions) => {
    if (!transactions.length) return [];

    const categoryMap = {};

    transactions.forEach((row) => {
      const category = row.category;
      const amountStr = row.amount.split(" ")[0];
      const amount = parseFloat(amountStr);

      if (!isNaN(amount)) {
        categoryMap[category] = (categoryMap[category] || 0) + amount;
      }
    });

    const categoryArray = Object.keys(categoryMap).map((category) => ({
      category_name: category,
      amount: categoryMap[category],
    }));

    return categoryArray.sort((a, b) => b.amount - a.amount);
  };

  const getDailySummary = (transactions) => {
    if (!transactions.length || !selectMonth) return { labels: [], data: [] };

    const days = getNumberOfDays(selectMonth);
    const labels = Array.from({ length: days }, (_, i) => i + 1);
    const dailyData = new Array(days).fill(0);

    setNumOfDays(days);

    transactions.forEach((t) => {
      const day = parseInt(t.date.substring(8, 10));
      const amountStr = t.amount.split(" ")[0];
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && day >= 1 && day <= days) {
        dailyData[day - 1] += amount;
      }
    });

    return {
      labels: labels,
      datasets: [
        {
          label: "Daily Spending (SGD)",
          color: "info",
          data: dailyData.map((amount) => parseFloat(amount.toFixed(2))),
        },
      ],
    };
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setUpdate(true);
        const response = await axios({
          method: "get",
          url: data.apiRootUrl + "transactions",
          withCredentials: true,
        });

        const tmpTransactions = response.data.data.map((t) => ({
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

        tmpTransactions.sort((a, b) => b.full_date - a.full_date);
        setTransactions(tmpTransactions);

        handleLifetimeStatistics(tmpTransactions);

        let uniqueMonths = getUniqueMonths(tmpTransactions);
        setUniqueMonths(uniqueMonths);
        setSelectMonth(uniqueMonths[0]);
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

  useEffect(() => {
    if (!selectMonth) {
      return;
    }

    let numOfDays = getNumberOfDays(selectMonth);

    let filteredTransactions = transactions.filter((t) => t.date.substring(0, 7) === selectMonth);
    let tmpmonthExpenses = filteredTransactions
      .reduce((acc, t) => {
        const amountStr = t.amount.split(" ")[0];
        const amount = parseFloat(amountStr);
        return acc + (isNaN(amount) ? 0 : amount);
      }, 0)
      .toFixed(2);

    setMonthExpenses(tmpmonthExpenses);
    setMonthAverage(tmpmonthExpenses / numOfDays);

    setFilteredTableData({ columns: filteredTableData.columns, rows: filteredTransactions });
    setCategorySummary(getCategorySummary(filteredTransactions));

    setChartData(getDailySummary(filteredTransactions));
  }, [selectMonth]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SoftSelect
              label="Category"
              value={{ value: selectMonth, label: selectMonth }}
              options={uniqueMonths.map((month) => ({
                value: month,
                label: month,
              }))}
              onChange={(e) => {
                setSelectMonth(e.value);
              }}
            />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MiniStatisticsCard
              bgColor="error"
              title={{
                text: "Lifetime Expenses (" + lifetimeDays + " days)",
                fontWeight: "regular",
              }}
              count={lifetimeExpenses.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MiniStatisticsCard
              bgColor="info"
              title={{
                text: "Lifetime Average (" + lifetimeDays + " days)",
                fontWeight: "regular",
              }}
              count={lifetimeAverage.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MiniStatisticsCard
              bgColor="primary"
              title={{
                text: selectMonth
                  ? new Date(selectMonth + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }) +
                    " Expenses (" +
                    numOfDays +
                    " days)"
                  : "",
                fontWeight: "regular",
              }}
              count={monthExpenses + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MiniStatisticsCard
              bgColor="dark"
              title={{
                text: selectMonth
                  ? new Date(selectMonth + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }) +
                    " Average (" +
                    numOfDays +
                    " days)"
                  : "",
                fontWeight: "regular",
              }}
              count={monthAverage.toFixed(2) + " SGD"}
              isUpdate={isUpdate}
            />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <VerticalBarChart title="Spending by day" chart={chartData} height="15rem" />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <ReportsDoughnutChart
              title="Spending by category"
              count={{ number: monthExpenses, text: "SGD" }}
              unit="SGD"
              chart={{
                labels: categorySummary.map((c) => c.category_name),
                datasets: {
                  label: "Consumption",
                  backgroundColors: categorySummary.map((_, index) => {
                    const colors = [
                      "primary",
                      "secondary",
                      "info",
                      "success",
                      "warning",
                      "error",
                      "dark",
                    ];

                    // Cycle through colors if more categories than colors
                    return colors[index % colors.length];
                  }),
                  data: categorySummary.map((c) => {
                    return c.amount.toFixed(2);
                  }),
                },
              }}
            />
          </Grid>
        </Grid>
      </SoftBox>

      <SoftBox mb={3}>
        <DataTable
          table={filteredTableData}
          isSorted={true}
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

export default Statistics;
