import { useMemo } from "react";
import PropTypes from "prop-types";
import { Bar } from "react-chartjs-2";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import configs from "views/dashboard/components/VerticalBarChart/configs";
import colors from "assets/theme/base/colors";

const VerticalBarChart = ({ title, description, height, chart }) => {
  const chartDatasets = useMemo(() => {
    if (!chart.datasets) return [];
    return chart.datasets.map((dataset) => ({
      ...dataset,
      weight: 5,
      borderWidth: 0,
      borderRadius: 4,
      backgroundColor: colors[dataset.color]
        ? colors[dataset.color || "dark"].main
        : colors.dark.main,
      fill: false,
      maxBarThickness: 35,
    }));
  }, [chart.datasets]);

  const { data, options } = useMemo(
    () => configs(chart.labels || [], chartDatasets),
    [chart.labels, chartDatasets]
  );

  const renderChart = (
    <SoftBox p={2}>
      <SoftBox mb={1}>
        <SoftTypography variant="h6">{title}</SoftTypography>
      </SoftBox>
      <SoftBox height={height}>
        <Bar data={data} options={options} />
      </SoftBox>
    </SoftBox>
  );

  return <Card>{title || description ? renderChart : <SoftBox p={2}>{renderChart}</SoftBox>}</Card>;
};

VerticalBarChart.defaultProps = {
  title: "",
  description: "",
  height: "19.125rem",
};

VerticalBarChart.propTypes = {
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  chart: PropTypes.objectOf(PropTypes.array).isRequired,
};

export default VerticalBarChart;
