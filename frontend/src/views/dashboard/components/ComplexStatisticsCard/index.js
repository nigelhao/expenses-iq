/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard PRO React base styles
import typography from "assets/theme/base/typography";

// Images
import whiteCurved from "assets/images/curved-images/white-curved.jpeg";

function ComplexStatisticsCard({ color = "dark", count, percentage, dropdown = false }) {
  const { size } = typography;

  return (
    <Card
      sx={({ functions: { linearGradient, rgba }, palette: { gradients } }) => ({
        background: gradients[color]
          ? `${linearGradient(
              rgba(gradients[color].main, 0.9),
              rgba(gradients[color].state, 0.9)
            )}, url(${whiteCurved})`
          : `${linearGradient(
              rgba(gradients.dark.main, 0.9),
              rgba(gradients.dark.state, 0.9)
            )}, url(${whiteCurved})`,
      })}
    >
      <SoftBox p={2}>
        <Grid container>
          <Grid item xs={6}>
            <SoftBox mt={0.5} lineHeight={0}>
              <SoftTypography
                variant="button"
                fontWeight="regular"
                color="white"
                textTransform="capitalize"
              >
                {count.label}
              </SoftTypography>
              <SoftTypography variant="h5" fontWeight="bold" color="white">
                {count.number}
              </SoftTypography>
            </SoftBox>
          </Grid>
          <Grid item xs={6}>
            <SoftBox textAlign="right">
              {dropdown && (
                <SoftBox lineHeight={1} color="white">
                  <Icon fontSize="default" onClick={dropdown.action} sx={{ cursor: "pointer" }}>
                    more_horiz
                  </Icon>
                  {dropdown.menu}
                </SoftBox>
              )}
              <SoftTypography variant="button" fontWeight="bold" color="white" align="right">
                {percentage}
              </SoftTypography>
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>
    </Card>
  );
}

// Typechecking props for the ComplexStatisticsCard
ComplexStatisticsCard.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  count: PropTypes.shape({
    number: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  percentage: PropTypes.string.isRequired,
  dropdown: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      action: PropTypes.func,
      menu: PropTypes.node,
    }),
  ]),
};

export default ComplexStatisticsCard;
