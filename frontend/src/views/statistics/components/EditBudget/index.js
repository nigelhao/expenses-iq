import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import MoonLoader from "react-spinners/MoonLoader";
import SoftTypography from "components/SoftTypography";
import Grid from "@mui/material/Grid";
import FormField from "views/dashboard/components/EditTransaction/FormField";
import axios from "axios";
import data from "config.json";

const EditBudget = (props) => {
  const [updatePending, setUpdatePending] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [budget, setBudget] = useState("");

  const handleClose = () => {
    props.setOpenEditBudget(false);
  };

  const handleUpdate = async () => {
    setUpdatePending(true);
    setDisabled(true);
    try {
      await axios({
        method: "put",
        url: `${data.apiRootUrl}budget`,
        data: {
          budget: parseFloat(budget),
        },
        withCredentials: true,
      });

      props.setRefresh(props.refresh + 1);
      handleClose();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = "/sign-in";
      }
    } finally {
      setDisabled(false);
      setUpdatePending(false);
    }
  };

  useEffect(() => {
    if (props.openEditBudget) {
      setBudget("");
      setDisabled(true);

      const fetchBudget = async () => {
        try {
          const response = await axios({
            method: "get",
            url: data.apiRootUrl + "budget",
            withCredentials: true,
          });

          const currentBudget = parseFloat(response.data.data).toFixed(2);
          setBudget(currentBudget);
          setDisabled(false);
        } catch (err) {
          console.log(err);
          if (err.response && err.response.status === 401) {
            window.location.href = "/sign-in";
          }
        }
      };

      fetchBudget();
    }
  }, [props.openEditBudget]);

  return (
    <>
      <Modal open={props.openEditBudget} onClose={handleClose}>
        <Card sx={{ width: "90%", maxWidth: "500px", margin: "auto", marginTop: "5%" }}>
          <SoftBox p={3} lineHeight={1}>
            <SoftBox mb={1}>
              <SoftTypography variant="h5">Edit Monthly Budget</SoftTypography>
            </SoftBox>

            <SoftBox component="form" py={3} px={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormField
                    label="Monthly Budget (SGD)"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                    }}
                    inputProps={{ type: "number", step: "0.01" }}
                  />
                </Grid>
              </Grid>
            </SoftBox>
          </SoftBox>
          <SoftBox pb={3} px={3} display="flex" justifyContent="flex-end">
            <SoftBox display="flex" width="100%" flexDirection="row" gap={2}>
              <SoftButton
                variant="gradient"
                color="dark"
                sx={{ flexGrow: 1 }}
                onClick={handleUpdate}
                disabled={disabled}
              >
                {updatePending ? <MoonLoader size={20} color="white" /> : "Update Budget"}
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </Card>
      </Modal>
    </>
  );
};

EditBudget.propTypes = {
  refresh: PropTypes.number,
  setRefresh: PropTypes.func,
  openEditBudget: PropTypes.bool,
  setOpenEditBudget: PropTypes.func,
};

export default EditBudget;
