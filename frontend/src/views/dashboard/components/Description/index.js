import { useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import MoonLoader from "react-spinners/MoonLoader";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import axios from "axios";
import Swal from "sweetalert2";
import data from "config.json";

const Description = (props) => {
  const [description, setDescription] = useState("");
  const [isUpdate, setUpdate] = useState(false);

  const showError = () => Swal.fire("Error", "Cannot understand what you saying", "error");

  const handleSubmit = async () => {
    setUpdate(true);
    try {
      const response = await axios({
        method: "post",
        url: `${data.apiRootUrl}transactions`,
        data: {
          description: description,
        },
        withCredentials: true,
      });

      console.log(response);
      setUpdate(false);
      setDescription("");
      props.setRefresh(props.refresh + 1);
    } catch (error) {
      setUpdate(false);
      console.log(error);
      showError();
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <SoftBox pt={2} px={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Spending description
        </SoftTypography>
      </SoftBox>
      <SoftBox pt={2} px={2}>
        <SoftBox
          component="ul"
          display="flex"
          flexDirection="column"
          p={0}
          m={0}
          sx={{ listStyle: "none" }}
        >
          <SoftBox component="li" w="100%" py={1} mb={0.5}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {/* Add label text here */}
                </SoftTypography>
              </SoftBox>
              <SoftInput
                size="large"
                multiline
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </SoftBox>
          </SoftBox>
        </SoftBox>
      </SoftBox>
      <SoftBox pb={2} px={2} display="flex" flexDirection={{ xs: "column", sm: "row" }} mt="auto">
        <SoftBox width={{ xs: "100%", sm: "60%" }} lineHeight={1}>
          <SoftTypography variant="button" color="text" fontWeight="regular">
            Describe your expenses and we will process it
          </SoftTypography>
        </SoftBox>
        <SoftBox width={{ xs: "100%", sm: "40%" }} textAlign="right" mt={{ xs: 2, sm: "auto" }}>
          <SoftButton variant="gradient" color="dark" onClick={handleSubmit} disabled={isUpdate}>
            {!isUpdate ? "Confirm" : <MoonLoader color="#FFFF" size={15} speedMultiplier={0.8} />}
          </SoftButton>
        </SoftBox>
      </SoftBox>
    </Card>
  );
};

Description.propTypes = {
  refresh: PropTypes.number,
  setRefresh: PropTypes.func,
};

export default Description;
