/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Custom styles for the SidenavCard
import { card, cardContent, cardIconBox, cardIcon } from "layouts/Sidenav/styles/sidenavCard";

// Soft UI Dashboard PRO React context
import { useSoftUIController } from "context";

function SidenavCard() {
  const [controller] = useSoftUIController();
  const { miniSidenav, sidenavColor } = controller;

  return (
    <Card sx={(theme) => card(theme, { miniSidenav })}>
      <CardContent sx={(theme) => cardContent(theme, { sidenavColor })}>
        <SoftBox
          bgColor="white"
          width="2rem"
          height="2rem"
          borderRadius="md"
          shadow="md"
          mb={2}
          sx={cardIconBox}
        >
          <Icon fontSize="medium" sx={(theme) => cardIcon(theme, { sidenavColor })}>
            star
          </Icon>
        </SoftBox>
        <SoftBox lineHeight={1}>
          <SoftTypography variant="h6" color="white">
            Application
          </SoftTypography>
          <SoftBox mb={1.825} mt={-1}>
            <SoftTypography variant="caption" color="white" fontWeight="medium">
              alpha stage of development
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </CardContent>
    </Card>
  );
}

export default SidenavCard;
